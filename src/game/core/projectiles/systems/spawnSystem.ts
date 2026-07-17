import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Enemy } from '../../enemies/components/Enemy'
import { Position } from '../../shared/components/Position'

function findNearestEnemy(world: World, px: number, pz: number): number | null {
  const enemies = query(world, [Active, Enemy, Position]) as readonly number[]

  // eslint-disable-next-line functional/no-let
  let nearest = -1
  // eslint-disable-next-line functional/no-let
  let nearestDistSq = Infinity

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < enemies.length; i++) {
    const eid = enemies[i]
    if (Active.isActive[eid] === 0) continue
    const dx = Position.x[eid] - px
    const dz = Position.z[eid] - pz
    const dsq = dx * dx + dz * dz
    if (dsq < nearestDistSq) {
      nearestDistSq = dsq
      nearest = eid
    }
  }

  return nearest === -1 ? null : nearest
}

export function createProjectileSpawnSystem(
  world: World,
  acquire: (x: number, z: number, vx: number, vz: number) => number,
  speed: number
) {
  // eslint-disable-next-line functional/no-let
  let accumS = 0
  // eslint-disable-next-line functional/no-let
  let intervalS = 0.8
  // eslint-disable-next-line functional/no-let
  let currentSpeed = speed

  return {
    setInterval(sec: number) {
      intervalS = sec
    },

    setSpeed(s: number) {
      currentSpeed = s
    },

    update(dt: number) {
      // ponytail: cap accumulation so background resume spawns at most 1 projectile
      accumS = Math.min(accumS + dt, intervalS)
      if (accumS < intervalS) return
      accumS -= intervalS

      const playerEid = (world as { playerEid?: number }).playerEid
      if (playerEid === undefined) return

      const px = Position.x[playerEid]
      const pz = Position.z[playerEid]

      const nearest = findNearestEnemy(world, px, pz)
      if (nearest === null) return

      const dx = Position.x[nearest] - px
      const dz = Position.z[nearest] - pz
      const dist = Math.sqrt(dx * dx + dz * dz)
      acquire(px, pz, (dx / dist) * currentSpeed, (dz / dist) * currentSpeed)
    }
  }
}
