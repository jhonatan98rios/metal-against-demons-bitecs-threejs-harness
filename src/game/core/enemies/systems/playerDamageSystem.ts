import { query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Enemy } from '../components/Enemy'
import { Health } from '../../shared/components/Health'
import { HitEffect } from '../../shared/components/HitEffect'
import { Position } from '../../shared/components/Position'

const DAMAGE_RADIUS_SQ = 1.5 * 1.5
const DAMAGE_PER_HIT = 10
const COOLDOWN_S = 0.5

interface PlayerDamageWorld extends World {
  playerEid?: number
}

export function createPlayerDamageSystem(world: World) {
  const w = world as PlayerDamageWorld
  const cooldowns = new Map<number, number>()

  return {
    update(dt: number) {
      const playerEid = w.playerEid
      if (typeof playerEid !== 'number') return
      if (Active.isActive[playerEid] === 0) return

      const px = Position.x[playerEid]
      const pz = Position.z[playerEid]

      const enemies = query(world, [Active, Enemy, Position]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < enemies.length; i++) {
        const eid = enemies[i]
        if (Active.isActive[eid] === 0) continue

        const dx = px - Position.x[eid]
        const dz = pz - Position.z[eid]
        if (dx * dx + dz * dz > DAMAGE_RADIUS_SQ) {
          cooldowns.delete(eid)
          continue
        }

        const cd = (cooldowns.get(eid) ?? 0) - dt
        if (cd > 0) {
          cooldowns.set(eid, cd)
          continue
        }

        Health.current[playerEid] -= DAMAGE_PER_HIT
        HitEffect.timer[playerEid] = 0.15
        cooldowns.set(eid, COOLDOWN_S)
      }
    }
  }
}
