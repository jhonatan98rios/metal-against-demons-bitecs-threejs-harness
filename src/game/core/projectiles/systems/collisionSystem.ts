import { Not, query, World } from 'bitecs'

import { Enemy } from '../../enemies/components/Enemy'
import { Health } from '../../shared/components/Health'
import { HitEffect } from '../../shared/components/HitEffect'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Projectile } from '../components/Projectile'

const HIT_RADIUS_SQ = 2 * 2

type PoolEntry = {
  release: (eid: number) => void
  hitThisFrame: Set<number>
}

export type CollisionSystem = {
  registerPool(poolId: number, release: (eid: number) => void): void
  update(): void
}

// ── inner helpers (extracted to stay under complexity limits) ──────────

function checkProjectileHit(
  pid: number,
  enemies: readonly number[],
  entry: PoolEntry
): void {
  const px = Position.x[pid]
  const pz = Position.z[pid]
  const friendlyFire = Projectile.friendlyFire[pid]

  // eslint-disable-next-line functional/no-let
  for (let j = 0; j < enemies.length; j++) {
    const eid = enemies[j]
    if (friendlyFire === 0 && entry.hitThisFrame.has(eid)) continue

    const dx = px - Position.x[eid]
    const dz = pz - Position.z[eid]
    if (dx * dx + dz * dz > HIT_RADIUS_SQ) continue

    Health.current[eid] -= Projectile.damage[pid]
    HitEffect.timer[eid] = 0.15
    entry.hitThisFrame.add(eid)
    entry.release(pid)
    break
  }
}

function processProjectiles(
  projectiles: readonly number[],
  enemies: readonly number[],
  pools: Map<number, PoolEntry>
): void {
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < projectiles.length; i++) {
    const pid = projectiles[i]

    const entry = pools.get(Projectile.poolId[pid])
    if (!entry) continue

    checkProjectileHit(pid, enemies, entry)
  }
}

// ── system factory ─────────────────────────────────────────────────────

function createCollisionSystem(world: World): CollisionSystem {
  const pools = new Map<number, PoolEntry>()

  return {
    registerPool(poolId: number, release: (eid: number) => void) {
      pools.set(poolId, { release, hitThisFrame: new Set() })
    },

    update() {
      for (const [, entry] of pools) entry.hitThisFrame.clear()

      const projectiles = query(world, [
        Projectile,
        Position,
        Not(Inactive)
      ]) as readonly number[]
      const enemies = query(world, [
        Enemy,
        Position,
        Health,
        Not(Inactive)
      ]) as readonly number[]

      processProjectiles(projectiles, enemies, pools)
    }
  }
}

const instances = new WeakMap<World, CollisionSystem>()

/** Lazy singleton per world. Skills call registerPool(), main loop calls update(). */
export function getCollisionSystem(world: World): CollisionSystem {
  // eslint-disable-next-line functional/no-let
  let sys = instances.get(world)
  if (!sys) {
    sys = createCollisionSystem(world)
    instances.set(world, sys)
  }
  return sys
}
