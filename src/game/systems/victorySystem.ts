import { query, World } from 'bitecs'
import { Active } from '../core/shared/components/Active'
import { Enemy } from '../core/enemies/components/Enemy'

export function createVictorySystem(world: World, onVictory: () => void) {
  // ponytail: simple query + isActive filter — no counter to drift. O(poolSize) per frame.
  return {
    update() {
      const enemies = query(world, [Active, Enemy])

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < enemies.length; i++) {
        if (Active.isActive[enemies[i]] === 1) return
      }

      onVictory()
    }
  }
}
