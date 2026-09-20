import { Not, query, World } from 'bitecs'

import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Orb } from '../components/Orb'
import { ORB } from '../definitions/orb'

const MAGNET_RADIUS_SQ = ORB.MAGNET_RADIUS * ORB.MAGNET_RADIUS

interface OrbWorld extends World {
  playerEid?: number
}

/** Pulls active orbs toward the player once inside the magnet radius. */
export function createOrbMagnetSystem(world: World) {
  const w = world as OrbWorld

  return {
    update(dt: number) {
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
        const distSq = dx * dx + dz * dz

        if (distSq > MAGNET_RADIUS_SQ || distSq === 0) continue

        const dist = Math.sqrt(distSq)
        const step = Math.min(ORB.MAGNET_SPEED * dt, dist)
        Position.x[eid] += (dx / dist) * step
        Position.z[eid] += (dz / dist) * step
      }
    }
  }
}
