import { Not, query, World } from 'bitecs'

import { Inactive } from '../../shared/components/Inactive'
import { TTL } from '../../shared/components/TTL'
import { Projectile } from '../components/Projectile'

export function createDespawnSystem(
  world: World,
  release: (eid: number) => void
) {
  return {
    update(dt: number) {
      const expired = query(world, [
        Projectile,
        TTL,
        Not(Inactive)
      ]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < expired.length; i++) {
        const eid = expired[i]

        TTL.remaining[eid] -= dt
        if (TTL.remaining[eid] <= 0) {
          release(eid)
        }
      }
    }
  }
}
