import { Not, query, World } from 'bitecs'
import { Enemy } from '../core/enemies/components/Enemy'
import { Spawner } from '../core/enemies/components/Spawner'
import { Inactive } from '../core/shared/components/Inactive'

export function createVictorySystem(world: World, onVictory: () => void) {
  // ponytail: query(Enemy, Not(Inactive)) — bitECS filters inactive entities.
  // Empty result + no pending spawner (all spawned) means victory.
  return {
    update() {
      const enemies = query(world, [Enemy, Not(Inactive)])
      const spawners = query(world, [Spawner])

      if (enemies.length === 0 && spawners.length === 0) {
        onVictory()
      }
    }
  }
}
