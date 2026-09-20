import { Not, query, World } from 'bitecs'

import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { XP } from '../../shared/components/XP'
import { Orb } from '../components/Orb'
import { ORB } from '../definitions/orb'

const COLLECT_RADIUS_SQ = ORB.COLLECT_RADIUS * ORB.COLLECT_RADIUS

interface OrbWorld extends World {
  playerEid?: number
}

/** Grants an orb's XP to the player and releases the orb on contact. */
export function createOrbCollectSystem(
  world: World,
  release: (eid: number) => void
) {
  const w = world as OrbWorld

  return {
    update() {
      const playerEid = w.playerEid
      if (typeof playerEid !== 'number') return

      const px = Position.x[playerEid]
      const pz = Position.z[playerEid]
      const orbs = query(world, [
        Orb,
        Position,
        Not(Inactive)
      ]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < orbs.length; i++) {
        const eid = orbs[i]
        const dx = px - Position.x[eid]
        const dz = pz - Position.z[eid]
        if (dx * dx + dz * dz > COLLECT_RADIUS_SQ) continue

        XP.current[playerEid] += Orb.xpValue[eid]
        release(eid)
      }
    }
  }
}
