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

interface BoidsAccumulators {
  separationX: number
  separationZ: number
  alignmentX: number
  alignmentZ: number
  cohesionX: number
  cohesionZ: number
  neighborCount: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOID_TERMS = [Active, Enemy, Position, Velocity, Boids]
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
const DEBUG_BOIDS = false

// ---------------------------------------------------------------------------
// processNeighborPair -- single-pair accumulation
// ---------------------------------------------------------------------------

/** Separation (inverse-square), alignment (velocity matching), cohesion. */
function processNeighborPair(
  eid: number,
  nid: number,
  sepRadSq: number,
  perceptionRadSq: number,
  accumulators: BoidsAccumulators
): void {
  const dx = Position.x[eid] - Position.x[nid]
  const dz = Position.z[eid] - Position.z[nid]
  const distSq = dx * dx + dz * dz

  if (distSq <= 0) return

  if (distSq < sepRadSq) {
    // ponytail: 1/dist instead of 1/distSq — stronger mid-range push for flock spread
    const invDist = 1 / Math.sqrt(distSq)
    accumulators.separationX += dx * invDist
    accumulators.separationZ += dz * invDist
  }

  if (distSq >= perceptionRadSq) return

  accumulators.alignmentX += Velocity.x[nid]
  accumulators.alignmentZ += Velocity.z[nid]
  accumulators.cohesionX += Position.x[nid]
  accumulators.cohesionZ += Position.z[nid]
  accumulators.neighborCount++
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unit vector toward player. Uses pre-computed distance (no sqrt). */
function computePursuitDirection(
  myX: number,
  myZ: number,
  player: { x: number; z: number },
  distToPlayer: number
): { x: number; z: number } {
  if (distToPlayer <= 0.01) return { x: 0, z: 0 }
  return {
    x: (player.x - myX) / distToPlayer,
    z: (player.z - myZ) / distToPlayer
  }
}

/** Normalize alignment+cohesion by neighbor count. Skipped below threshold. */
function normalizeFlockingForces(
  eid: number,
  myX: number,
  myZ: number,
  accumulators: BoidsAccumulators
): {
  align: { x: number; z: number }
  cohesion: { x: number; z: number }
} {
  if (accumulators.neighborCount <= MIN_NEIGHBORS) {
    return {
      align: { x: 0, z: 0 },
      cohesion: { x: 0, z: 0 }
    }
  }
  const invCount = 1 / accumulators.neighborCount
  return {
    align: {
      x: accumulators.alignmentX * invCount * Boids.alignmentWeight[eid],
      z: accumulators.alignmentZ * invCount * Boids.alignmentWeight[eid]
    },
    cohesion: {
      x: (accumulators.cohesionX * invCount - myX) * Boids.cohesionWeight[eid],
      z: (accumulators.cohesionZ * invCount - myZ) * Boids.cohesionWeight[eid]
    }
  }
}

/** Clamp velocity to maxSpeed with squared-magnitude early exit. */
function clampVelocity(
  totalX: number,
  totalZ: number,
  maxSpd: number
): { x: number; z: number } {
  const magSq = totalX * totalX + totalZ * totalZ
  if (magSq > maxSpd * maxSpd) {
    const mag = Math.sqrt(magSq)
    return { x: (totalX / mag) * maxSpd, z: (totalZ / mag) * maxSpd }
  }
  return { x: totalX, z: totalZ }
}

function getVelocityForces(
  sw: number,
  pw: number,
  separation: { x: number; z: number },
  pursuit: { x: number; z: number },
  flocking: {
    align: { x: number; z: number }
    cohesion: { x: number; z: number }
  }
): { x: number; z: number } {
  return {
    x:
      separation.x * sw +
      flocking.align.x +
      flocking.cohesion.x +
      pursuit.x * pw,
    z:
      separation.z * sw +
      flocking.align.z +
      flocking.cohesion.z +
      pursuit.z * pw
  }
}

// ---------------------------------------------------------------------------
// buildSpatialGrid -- O(N), recycled buckets
// ---------------------------------------------------------------------------

function buildSpatialGrid(
  entities: readonly number[],
  gridBuckets: (number[] | undefined)[],
  usedCells: number[],
  recycled: number[][]
): void {
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < usedCells.length; i++) {
    const cellIdx = usedCells[i]
    const bucket = gridBuckets[cellIdx]
    if (bucket) {
      bucket.length = 0
      recycled.push(bucket)
      gridBuckets[cellIdx] = undefined
    }
  }
  usedCells.length = 0

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    if (Active.isActive[eid] === 0) continue
    const cx = Math.floor(Position.x[eid] / CELL_SIZE) + GRID_HALF,
      cz = Math.floor(Position.z[eid] / CELL_SIZE) + GRID_HALF,
      cellIdx = cx * GRID_SIZE + cz
    const existing = gridBuckets[cellIdx]
    if (existing) {
      existing.push(eid)
    } else {
      const newBucket = recycled.length > 0 ? recycled.pop()! : []
      gridBuckets[cellIdx] = newBucket
      usedCells.push(cellIdx)
      newBucket.push(eid)
    }
  }
}

// ---------------------------------------------------------------------------
// accumulateFlockingForces -- neighbor loop extracted from processEntity
// to keep it under line limit.
// ponytail: global lock, per-entity flocking if throughput matters
function accumulateFlockingForces(
  eid: number,
  pos: { x: number; z: number },
  accumulators: BoidsAccumulators,
  gridBuckets: (number[] | undefined)[],
  attenuation: number
): void {
  const sepRadSq = Boids.separationRadius[eid] * attenuation * attenuation
  const perceptionRad = Boids.perceptionRadius[eid] * attenuation
  const cx = Math.floor(pos.x / CELL_SIZE) + GRID_HALF
  const cz = Math.floor(pos.z / CELL_SIZE) + GRID_HALF
  // eslint-disable-next-line functional/no-let
  for (let oi = 0; oi < NEIGHBOR_OFFSETS.length; oi++) {
    const ox = NEIGHBOR_OFFSETS[oi][0],
      oz = NEIGHBOR_OFFSETS[oi][1],
      ck = (cx + ox) * GRID_SIZE + (cz + oz)
    if (ck < 0 || ck >= GRID_CELL_COUNT) continue
    const bucket = gridBuckets[ck]
    if (!bucket) continue
    // eslint-disable-next-line functional/no-let
    for (let j = 0; j < bucket.length; j++) {
      processNeighborPair(
        eid,
        bucket[j],
        sepRadSq,
        perceptionRad * perceptionRad,
        accumulators
      )
    }
  }
}

// ---------------------------------------------------------------------------
/** Utilitary function to simplify getting acumulators */
function getBoidsAccumulators(
  accumulators: BoidsAccumulators
): BoidsAccumulators {
  return {
    separationX: accumulators.separationX,
    separationZ: accumulators.separationZ,
    alignmentX: accumulators.alignmentX,
    alignmentZ: accumulators.alignmentZ,
    cohesionX: accumulators.cohesionX,
    cohesionZ: accumulators.cohesionZ,
    neighborCount: accumulators.neighborCount
  }
}

// ---------------------------------------------------------------------------
/** Boids with LOD radii + distance-scaled pursuit. Never skips. */
function processEntity(
  eid: number,
  playerEid: number,
  distSq: number,
  accumulators: BoidsAccumulators,
  gridBuckets: (number[] | undefined)[]
): void {
  const mx = Position.x[eid],
    mz = Position.z[eid],
    ms = Boids.maxSpeed[eid],
    attenuation = distSq > LOD_MID_SQ ? 0.4 : distSq > LOD_NEAR_SQ ? 0.7 : 1.0

  accumulateFlockingForces(
    eid,
    { x: mx, z: mz },
    accumulators,
    gridBuckets,
    attenuation
  )
  const dp = Math.sqrt(distSq),
    pw = Boids.pursuitWeight[eid] * (1 + Math.min(3, dp / 20))
  const pursuit = computePursuitDirection(
    mx,
    mz,
    { x: Position.x[playerEid], z: Position.z[playerEid] },
    dp
  )
  const flocking = normalizeFlockingForces(
    eid,
    mx,
    mz,
    getBoidsAccumulators(accumulators)
  )

  const sw = Boids.separationWeight[eid]
  const separation = {
    x: accumulators.separationX,
    z: accumulators.separationZ
  }
  const forces = getVelocityForces(sw, pw, separation, pursuit, flocking)
  const velocity = clampVelocity(forces.x, forces.z, ms)
  Velocity.x[eid] = velocity.x
  Velocity.z[eid] = velocity.z
}

// ---------------------------------------------------------------------------
// Tick helpers
// ---------------------------------------------------------------------------

/** Returns true when it's time for a boids tick (20 Hz). */
function shouldBoidsTick(state: {
  accumMs: number
  lastTime: number
}): boolean {
  const now = performance.now()
  state.accumMs = Math.min(state.accumMs + now - state.lastTime, MAX_ACCUM_MS)
  state.lastTime = now
  if (state.accumMs < BOIDS_MS_PER_TICK) return false
  state.accumMs -= BOIDS_MS_PER_TICK
  return true
}

interface BoidsDebugState {
  entityCount: number
  totalNeighbors: number
  maxNeighbors: number
  duration: number
  lastLog: number
}

/** Update debug counters in-place. */
function updateBoidsDebugCounters(
  state: BoidsDebugState,
  neighborCount: number
): void {
  state.totalNeighbors += neighborCount
  if (neighborCount > state.maxNeighbors) state.maxNeighbors = neighborCount
  state.entityCount++
}

/** Log boids metrics if a second has passed. */
function logBoidsDebugMetrics(state: BoidsDebugState): void {
  const now = performance.now()
  if (now - state.lastLog < 1000) return
  const avg =
    state.entityCount > 0
      ? (state.totalNeighbors / state.entityCount).toFixed(1)
      : '0.0'
  console.log(
    `[boids] avg_nbrs=${avg} max=${state.maxNeighbors}` +
      ` entities=${state.entityCount}` +
      ` duration=${state.duration.toFixed(2)}ms`
  )
  state.totalNeighbors = 0
  state.maxNeighbors = 0
  state.entityCount = 0
  state.lastLog = now
}

/** Run one boids tick: grid build, per-entity process, debug capture. */
function runBoidsTick(
  world: World,
  gridBuckets: (number[] | undefined)[],
  usedCells: number[],
  recycled: number[][],
  debugState: BoidsDebugState
): void {
  const playerEid = (world as BoidsWorld).playerEid
  if (typeof playerEid !== 'number') return
  const entities = query(world, [...BOID_TERMS]) as readonly number[]
  if (entities.length === 0) return
  buildSpatialGrid(entities, gridBuckets, usedCells, recycled)
  const tickStart = performance.now()
  const accumulators: BoidsAccumulators = {
    separationX: 0,
    separationZ: 0,
    alignmentX: 0,
    alignmentZ: 0,
    cohesionX: 0,
    cohesionZ: 0,
    neighborCount: 0
  }
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    if (Active.isActive[eid] === 0) continue
    accumulators.separationX = 0
    accumulators.separationZ = 0
    accumulators.alignmentX = 0
    accumulators.alignmentZ = 0
    accumulators.cohesionX = 0
    accumulators.cohesionZ = 0
    accumulators.neighborCount = 0
    const dx = Position.x[eid] - Position.x[playerEid],
      dz = Position.z[eid] - Position.z[playerEid],
      distSq = dx * dx + dz * dz
    processEntity(eid, playerEid, distSq, accumulators, gridBuckets)
    if (DEBUG_BOIDS)
      updateBoidsDebugCounters(debugState, accumulators.neighborCount)
  }
  if (DEBUG_BOIDS) {
    debugState.duration = performance.now() - tickStart
    logBoidsDebugMetrics(debugState)
  }
}

// ---------------------------------------------------------------------------
// System factory
// ---------------------------------------------------------------------------

/**
 * Create boids system with fixed-timestep (20 Hz), distance-based LOD that
 * attenuates neighbor radii (never disables flocking), and debug metrics.
 */
export function createBoidsSystem(world: World) {
  const gridBuckets: (number[] | undefined)[] = []
  gridBuckets.length = GRID_CELL_COUNT
  const usedCells: number[] = []
  const recycled: number[][] = []
  const tickState = { accumMs: 0, lastTime: 0 }
  const debugState: BoidsDebugState = {
    entityCount: 0,
    totalNeighbors: 0,
    maxNeighbors: 0,
    duration: 0,
    lastLog: 0
  }

  return {
    update() {
      if (!shouldBoidsTick(tickState)) return
      runBoidsTick(world, gridBuckets, usedCells, recycled, debugState)
    }
  }
}
