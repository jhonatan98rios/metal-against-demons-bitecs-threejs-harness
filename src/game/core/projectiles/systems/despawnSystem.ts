import { Not, query, World } from 'bitecs'

import { Inactive } from '../../shared/components/Inactive'
import { TTL } from '../../shared/components/TTL'
import { Projectile } from '../components/Projectile'

export function createDespawnSystem(
  world: World,
  poolId: number,
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
        // ponytail: only despawn our own pool — cross-pool releases corrupt free lists
        if (Projectile.poolId[eid] !== poolId) continue

        TTL.remaining[eid] -= dt
        if (TTL.remaining[eid] <= 0) {
          release(eid)
        }
      }
    }
  }
}
