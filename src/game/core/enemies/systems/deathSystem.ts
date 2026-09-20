import { Not, query, World } from 'bitecs'

import { Enemy } from '../components/Enemy'
import { Health } from '../../shared/components/Health'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'

/** Spawns an XP orb where the enemy died; the orb carries the enemy's XP. */
export function createEnemyDeathSystem(
  world: World,
  release: (eid: number) => void,
  spawnOrb: (x: number, z: number, xpValue: number) => void
) {
  return {
    update() {
      const enemies = query(world, [Enemy, Health, Not(Inactive)])

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < enemies.length; i++) {
        const eid = enemies[i]
        if (Health.current[eid] <= 0) {
          spawnOrb(Position.x[eid], Position.z[eid], Enemy.xpValue[eid])
          release(eid)
        }
      }
    }
  }
}
