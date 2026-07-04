import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Enemy } from '../../enemies/components/Enemy'
import { Position } from '../../shared/components/Position'

function findNearestEnemy(world: World, px: number, pz: number): number | null {
  const enemies = query(world, [Active, Enemy, Position]) as readonly number[]
  const active = enemies.filter((e) => Active.isActive[e] === 1)
  if (active.length === 0) return null

  // eslint-disable-next-line functional/no-let
  let nearest = active[0]
  // eslint-disable-next-line functional/no-let
  let nearestDistSq = Infinity

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < active.length; i++) {
    const eid = active[i]
    const dx = Position.x[eid] - px
    const dz = Position.z[eid] - pz
    const dsq = dx * dx + dz * dz
    if (dsq < nearestDistSq) {
      nearestDistSq = dsq
      nearest = eid
    }
  }

  return nearest
}

export function createProjectileSpawnSystem(
  world: World,
  acquire: (x: number, z: number, vx: number, vz: number) => number,
  speed: number
) {
  // eslint-disable-next-line functional/no-let
  let accumMs = 0
  // eslint-disable-next-line functional/no-let
  let lastTime = 0
  // eslint-disable-next-line functional/no-let
  let intervalMs = 800

  return {
    setInterval(ms: number) {
      intervalMs = ms
    },

    update() {
      const now = performance.now()
      accumMs += now - lastTime
      lastTime = now

      if (accumMs < intervalMs) return
      accumMs -= intervalMs

      const playerEid = (world as { playerEid?: number }).playerEid
      if (playerEid === undefined) return

      const px = Position.x[playerEid]
      const pz = Position.z[playerEid]

      const nearest = findNearestEnemy(world, px, pz)
      if (nearest === null) return

      const dx = Position.x[nearest] - px
      const dz = Position.z[nearest] - pz
      const dist = Math.sqrt(dx * dx + dz * dz)
      acquire(px, pz, (dx / dist) * speed, (dz / dist) * speed)
    }
  }
}
