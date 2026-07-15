import { World } from 'bitecs'

import { Active } from '../shared/components/Active'
import { Health } from '../shared/components/Health'

interface PlayerDeathWorld extends World {
  playerEid?: number
}

export function createPlayerDeathSystem(world: World, onGameOver: () => void) {
  const w = world as PlayerDeathWorld

  return {
    update() {
      const playerEid = w.playerEid
      if (typeof playerEid !== 'number') return
      if (Active.isActive[playerEid] === 0) return

      if (Health.current[playerEid] <= 0) {
        onGameOver()
      }
    }
  }
}
