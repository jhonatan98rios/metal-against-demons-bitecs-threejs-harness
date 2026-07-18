import { Not, query, World } from 'bitecs'
import { Enemy } from '../core/enemies/components/Enemy'
import { Inactive } from '../core/shared/components/Inactive'

export function createVictorySystem(world: World, onVictory: () => void) {
  // ponytail: query(Enemy, Not(Inactive)) — bitECS filters inactive entities.
  // Empty result means victory.
  return {
    update() {
      const enemies = query(world, [Enemy, Not(Inactive)])

      if (enemies.length === 0) {
        onVictory()
      }
    }
  }
}
