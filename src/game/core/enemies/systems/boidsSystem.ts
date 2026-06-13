/**
 * Boids flocking system -- flat grid, fixed-timestep, LOD radii, debug metrics.
 *
 * Behavior:
 *   - Every entity gets velocity recomputed each boids tick (no staggering)
 *   - Distance-based LOD reduces neighbor radius, never disables flocking/pursuit
 *   - Pursuit scales with distance to prevent stationary clusters
 *   - Alignment/cohesion disabled below neighbor threshold (isolated entities)
 */
import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Boids } from '../../shared/components/Boids'
import { Enemy } from '../components/Enemy'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'

interface BoidsWorld extends World {
  playerEid?: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOID_TERMS = [Active, Enemy, Position, Velocity, Boids] as const
const BOIDS_MS_PER_TICK = 50 // 20 Hz
const MAX_ACCUM_MS = BOIDS_MS_PER_TICK * 4
const CELL_SIZE = 8
const GRID_SIZE = 256
const GRID_HALF = GRID_SIZE >> 1
const GRID_CELL_COUNT = GRID_SIZE * GRID_SIZE

const NEIGHBOR_OFFSETS: readonly [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 0],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
]

const LOD_NEAR = 15
const LOD_NEAR_SQ = LOD_NEAR * LOD_NEAR
const LOD_MID = 35
const LOD_MID_SQ = LOD_MID * LOD_MID
const MIN_NEIGHBORS = 2

// ---------------------------------------------------------------------------
// Flat spatial grid
// ---------------------------------------------------------------------------

const _gridBuckets: (number[] | undefined)[] = []

_gridBuckets.length = GRID_CELL_COUNT
const _usedCells: number[] = []
const _recycled: number[][] = []

// ---------------------------------------------------------------------------
// Force accumulators -- module-level, zero allocation per entity
// ---------------------------------------------------------------------------

// eslint-disable-next-line functional/no-let
let _sepX = 0,
  _sepZ = 0,
  _alignX = 0,
  _alignZ = 0
// eslint-disable-next-line functional/no-let
let _cohX = 0,
  _cohZ = 0,
  _neighborCount = 0
// eslint-disable-next-line functional/no-let
let _pursuitX = 0,
  _pursuitZ = 0
// eslint-disable-next-line functional/no-let
let _alignForceX = 0,
  _alignForceZ = 0,
  _cohForceX = 0,
  _cohForceZ = 0

// ---------------------------------------------------------------------------
// Accumulator state
// ---------------------------------------------------------------------------

// eslint-disable-next-line functional/no-let
let _accumMs = 0
// eslint-disable-next-line functional/no-let
let _lastTime = 0

// ---------------------------------------------------------------------------
// Debug metrics state
// ---------------------------------------------------------------------------

// eslint-disable-next-line functional/no-let
let _debugEntityCount = 0
// eslint-disable-next-line functional/no-let
let _debugTotalNeighbors = 0
// eslint-disable-next-line functional/no-let
let _debugMaxNeighbors = 0
// eslint-disable-next-line functional/no-let
let _debugLodSkipped = 0
// eslint-disable-next-line functional/no-let
let _debugDuration = 0
// eslint-disable-next-line functional/no-let
let _debugLastLog = 0

// ---------------------------------------------------------------------------
// processNeighborPair -- single-pair accumulation
// ---------------------------------------------------------------------------

/** Separation (inverse-square), alignment (velocity matching), cohesion. */
function processNeighborPair(
  eid: number,
  nid: number,
  sepRadSq: number,
  percRadSq: number
): void {
  const dx = Position.x[eid] - Position.x[nid]
  const dz = Position.z[eid] - Position.z[nid]
  const distSq = dx * dx + dz * dz

  if (distSq <= 0) return

  if (distSq < sepRadSq) {
    _sepX += dx / distSq
    _sepZ += dz / distSq
  }

  if (distSq >= percRadSq) return

  _alignX += Velocity.x[nid]
  _alignZ += Velocity.z[nid]
  _cohX += Position.x[nid]
  _cohZ += Position.z[nid]
  _neighborCount++
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetAccumulators(): void {
  _sepX = 0
  _sepZ = 0
  _alignX = 0
  _alignZ = 0
  _cohX = 0
  _cohZ = 0
  _neighborCount = 0
}

/** Unit vector toward player. Uses pre-computed distance (no sqrt). */
function computePursuitDirection(
  myX: number,
  myZ: number,
  playerEid: number,
  distToPlayer: number
): void {
  _pursuitX = 0
  _pursuitZ = 0
  if (distToPlayer <= 0.01) return
  _pursuitX = (Position.x[playerEid] - myX) / distToPlayer
  _pursuitZ = (Position.z[playerEid] - myZ) / distToPlayer
}

/** Normalise alignment+cohesion by neighbor count. Skipped below threshold. */
function normaliseFlockingForces(eid: number, myX: number, myZ: number): void {
  _alignForceX = 0
  _alignForceZ = 0
  _cohForceX = 0
  _cohForceZ = 0
  if (_neighborCount <= MIN_NEIGHBORS) return
  const invCount = 1 / _neighborCount
  _alignForceX = _alignX * invCount * Boids.alignmentWeight[eid]
  _alignForceZ = _alignZ * invCount * Boids.alignmentWeight[eid]
  _cohForceX = (_cohX * invCount - myX) * Boids.cohesionWeight[eid]
  _cohForceZ = (_cohZ * invCount - myZ) * Boids.cohesionWeight[eid]
}

/** Clamp velocity to maxSpeed with squared-magnitude early exit. */
function clampVelocity(
  eid: number,
  totalX: number,
  totalZ: number,
  maxSpd: number
): void {
  const magSq = totalX * totalX + totalZ * totalZ
  if (magSq > maxSpd * maxSpd) {
    const mag = Math.sqrt(magSq)
    Velocity.x[eid] = (totalX / mag) * maxSpd
    Velocity.z[eid] = (totalZ / mag) * maxSpd
    return
  }
  Velocity.x[eid] = totalX
  Velocity.z[eid] = totalZ
}

// ---------------------------------------------------------------------------
// buildSpatialGrid -- O(N), recycled buckets
// ---------------------------------------------------------------------------

function buildSpatialGrid(entities: readonly number[]): void {
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < _usedCells.length; i++) {
    const cellIdx = _usedCells[i]
    const bucket = _gridBuckets[cellIdx]
    if (bucket) {
      bucket.length = 0
      _recycled.push(bucket)
      _gridBuckets[cellIdx] = undefined
    }
  }
  _usedCells.length = 0

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    if (Active.isActive[eid] === 0) continue
    const cx = Math.floor(Position.x[eid] / CELL_SIZE) + GRID_HALF,
      cz = Math.floor(Position.z[eid] / CELL_SIZE) + GRID_HALF,
      cellIdx = cx * GRID_SIZE + cz
    const existing = _gridBuckets[cellIdx]
    if (existing) {
      existing.push(eid)
    } else {
      const newBucket = _recycled.length > 0 ? _recycled.pop()! : []
      _gridBuckets[cellIdx] = newBucket
      _usedCells.push(cellIdx)
      newBucket.push(eid)
    }
  }
}

// ---------------------------------------------------------------------------
// processEntity -- LOD-aware boids with radius attenuation
// ---------------------------------------------------------------------------

/** Boids with LOD radii + distance-scaled pursuit. Never skips. */
function processEntity(eid: number, playerEid: number, distSq: number): void {
  resetAccumulators()
  const mx = Position.x[eid],
    mz = Position.z[eid],
    ms = Boids.maxSpeed[eid],
    at = distSq > LOD_MID_SQ ? 0.4 : distSq > LOD_NEAR_SQ ? 0.7 : 1.0,
    sr2 = Boids.separationRadius[eid] * Boids.separationRadius[eid] * at * at,
    pr2 = Boids.perceptionRadius[eid] * Boids.perceptionRadius[eid] * at * at,
    cx = Math.floor(mx / CELL_SIZE) + GRID_HALF,
    cz = Math.floor(mz / CELL_SIZE) + GRID_HALF
  // eslint-disable-next-line functional/no-let
  for (let oi = 0; oi < NEIGHBOR_OFFSETS.length; oi++) {
    const ox = NEIGHBOR_OFFSETS[oi][0],
      oz = NEIGHBOR_OFFSETS[oi][1],
      ck = (cx + ox) * GRID_SIZE + (cz + oz)
    if (ck < 0 || ck >= GRID_CELL_COUNT) continue
    const bucket = _gridBuckets[ck]
    if (!bucket) continue
    // eslint-disable-next-line functional/no-let
    for (let j = 0; j < bucket.length; j++) {
      processNeighborPair(eid, bucket[j], sr2, pr2)
    }
  }
  const dp = Math.sqrt(distSq),
    pw = Boids.pursuitWeight[eid] * (1 + Math.min(3, dp / 20))
  computePursuitDirection(mx, mz, playerEid, dp)
  normaliseFlockingForces(eid, mx, mz)
  const sw = Boids.separationWeight[eid]
  clampVelocity(
    eid,
    _sepX * sw + _alignForceX + _cohForceX + _pursuitX * pw,
    _sepZ * sw + _alignForceZ + _cohForceZ + _pursuitZ * pw,
    ms
  )
}

// ---------------------------------------------------------------------------
// shouldTick -- frame-rate independent accumulator
// ---------------------------------------------------------------------------

/** Returns true when it's time for a boids tick (20 Hz). */
function shouldTick(): boolean {
  const now = performance.now()
  _accumMs = Math.min(_accumMs + now - _lastTime, MAX_ACCUM_MS)
  _lastTime = now
  if (_accumMs < BOIDS_MS_PER_TICK) return false
  _accumMs -= BOIDS_MS_PER_TICK
  return true
}

// ---------------------------------------------------------------------------
// Debug helpers
// ---------------------------------------------------------------------------

function resetDebugCounters(): void {
  _debugEntityCount = 0
  _debugTotalNeighbors = 0
  _debugMaxNeighbors = 0
  _debugLodSkipped = 0
}

function updateDebugCounters(neighborCount: number): void {
  _debugTotalNeighbors += neighborCount
  if (neighborCount > _debugMaxNeighbors) {
    _debugMaxNeighbors = neighborCount
  }
  _debugEntityCount++
}

function logDebugMetrics(): void {
  const now = performance.now()
  if (now - _debugLastLog < 1000) return
  const avg =
    _debugEntityCount > 0
      ? (_debugTotalNeighbors / _debugEntityCount).toFixed(1)
      : '0.0'
  console.log(
    `[boids] avg_nbrs=${avg} max=${_debugMaxNeighbors}` +
      ` entities=${_debugEntityCount} skipped=${_debugLodSkipped}` +
      ` duration=${_debugDuration.toFixed(2)}ms`
  )
  _debugTotalNeighbors = 0
  _debugMaxNeighbors = 0
  _debugEntityCount = 0
  _debugLodSkipped = 0
  _debugLastLog = now
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create boids system with fixed-timestep (20 Hz), distance-based LOD that
 * attenuates neighbor radii (never disables flocking), and debug metrics.
 *
 * Every entity gets velocity recomputed each boids tick (no staggering).
 * Pursuit scales with distance to prevent stationary clusters.
 * Isolated entities (under MIN_NEIGHBORS) skip alignment/cohesion
 * but still pursue the player and avoid separation collisions.
 */
export function createBoidsSystem(world: World) {
  const boidsWorld = world as BoidsWorld

  return {
    update() {
      if (!shouldTick()) return
      const playerEid = boidsWorld.playerEid
      if (typeof playerEid !== 'number') return
      const entities = query(
        world,
        BOID_TERMS as unknown as Parameters<typeof query>[1]
      ) as readonly number[]
      if (entities.length === 0) return
      buildSpatialGrid(entities)
      resetDebugCounters()
      const tickStart = performance.now()
      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < entities.length; i++) {
        const eid = entities[i]
        if (Active.isActive[eid] === 0) continue
        const dx = Position.x[eid] - Position.x[playerEid],
          dz = Position.z[eid] - Position.z[playerEid],
          distSq = dx * dx + dz * dz
        processEntity(eid, playerEid, distSq)
        updateDebugCounters(_neighborCount)
      }
      _debugDuration = performance.now() - tickStart
      logDebugMetrics()
    }
  }
}
