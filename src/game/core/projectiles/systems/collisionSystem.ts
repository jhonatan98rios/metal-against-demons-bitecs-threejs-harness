import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Enemy } from '../../enemies/components/Enemy'
import { Health } from '../../shared/components/Health'
import { HitEffect } from '../../shared/components/HitEffect'
import { Position } from '../../shared/components/Position'
import { Projectile } from '../components/Projectile'

const HIT_RADIUS_SQ = 2 * 2

function checkProjectileAgainstEnemies(
  pid: number,
  enemies: readonly number[],
  release: (eid: number) => void
): void {
  const px = Position.x[pid]
  const pz = Position.z[pid]

  for (const eid of enemies) {
    if (Active.isActive[eid] === 0) continue

    const dx = px - Position.x[eid]
    const dz = pz - Position.z[eid]
    if (dx * dx + dz * dz > HIT_RADIUS_SQ) continue

    Health.current[eid] -= Projectile.damage[pid]
    HitEffect.timer[eid] = 0.15
    release(pid)
    break
  }
}

export function createProjectileCollisionSystem(
  world: World,
  release: (eid: number) => void,
  poolId = 0
) {
  return {
    update() {
      const projectiles = query(world, [
        Active,
        Projectile,
        Position
      ]) as readonly number[]
      const enemies = query(world, [
        Active,
        Enemy,
        Position,
        Health
      ]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < projectiles.length; i++) {
        const pid = projectiles[i]
        if (Active.isActive[pid] === 0) continue
        if (poolId !== 0 && Projectile.poolId[pid] !== poolId) continue

        checkProjectileAgainstEnemies(pid, enemies, release)
      }
    }
  }
}
