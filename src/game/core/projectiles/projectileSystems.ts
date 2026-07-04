import { World } from 'bitecs'

import { createProjectilePool } from './pool/projectilePool'
import { createProjectileSpawnSystem } from './systems/spawnSystem'
import { createProjectileCollisionSystem } from './systems/collisionSystem'

export function createProjectileSystems(world: World) {
  const pool = createProjectilePool(world, 200)
  const spawn = createProjectileSpawnSystem(
    world,
    (x, z, vx, vz) => pool.acquire(x, z, vx, vz),
    25
  )
  const collision = createProjectileCollisionSystem(world, (eid) =>
    pool.release(eid)
  )

  return {
    spawn,
    collision,
    setSpawnInterval(ms: number) {
      spawn.setInterval(ms)
    }
  }
}
