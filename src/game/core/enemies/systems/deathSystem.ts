import { Not, query, World } from 'bitecs'

import { Enemy } from '../components/Enemy'
import { Health } from '../../shared/components/Health'
import { Inactive } from '../../shared/components/Inactive'
import { XP } from '../../shared/components/XP'

interface DeathWorld extends World {
  playerEid?: number
}

export function createEnemyDeathSystem(
  world: World,
  release: (eid: number) => void
) {
  const w = world as DeathWorld

  return {
    update() {
      const playerEid = w.playerEid
      const enemies = query(world, [Enemy, Health, Not(Inactive)])

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < enemies.length; i++) {
        const eid = enemies[i]
        if (Health.current[eid] <= 0) {
          if (typeof playerEid === 'number')
            XP.current[playerEid] += Enemy.xpValue[eid]
          release(eid)
        }
      }
    }
  }
}
