import { Not, query, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import {
  DamagePopup,
  DAMAGE_POPUP_DURATION_S
} from '../../shared/components/DamagePopup'
import { Enemy } from '../components/Enemy'
import { Health } from '../../shared/components/Health'
import { HitEffect } from '../../shared/components/HitEffect'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'

const DAMAGE_RADIUS_SQ = 1.5 * 1.5
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

      const enemies = query(world, [
        Enemy,
        Position,
        Not(Inactive)
      ]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < enemies.length; i++) {
        const eid = enemies[i]

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

        Health.current[playerEid] -= Enemy.damage[eid]
        HitEffect.timer[playerEid] = 0.15
        DamagePopup.timer[playerEid] = DAMAGE_POPUP_DURATION_S
        DamagePopup.damage[playerEid] = Enemy.damage[eid]
        cooldowns.set(eid, COOLDOWN_S)
      }
    }
  }
}
