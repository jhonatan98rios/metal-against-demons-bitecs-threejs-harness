import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { TTL } from '../../shared/components/TTL'
import { Projectile } from '../components/Projectile'

export function createDespawnSystem(
  world: World,
  release: (eid: number) => void
) {
  return {
    update(dt: number) {
      const expired = query(world, [
        Active,
        Projectile,
        TTL
      ]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < expired.length; i++) {
        const eid = expired[i]
        if (Active.isActive[eid] === 0) continue

        TTL.remaining[eid] -= dt
        if (TTL.remaining[eid] <= 0) {
          release(eid)
        }
      }
    }
  }
}
