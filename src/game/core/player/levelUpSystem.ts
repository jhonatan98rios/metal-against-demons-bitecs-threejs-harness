import { World } from 'bitecs'

import { XP } from '../shared/components/XP'

interface LevelUpWorld extends World {
  playerEid?: number
}

/**
 * RPG level-up formula: next = prev × 1.5
 * Level 1→2: 100 XP, 2→3: 150 XP, 3→4: 225 XP, etc.
 * Excess XP carries over (e.g., gain 200 XP at level 1 → level 3 with 0 XP).
 */
const XP_MULTIPLIER = 1.5

export function createLevelUpSystem(world: World, onLevelUp: () => void) {
  const w = world as LevelUpWorld

  return {
    update() {
      const playerEid = w.playerEid
      if (typeof playerEid !== 'number') return

      // ponytail: while supports multiple level-ups in one frame (carry-over)
      while (XP.current[playerEid] >= XP.next[playerEid]) {
        XP.current[playerEid] -= XP.next[playerEid]
        XP.level[playerEid] += 1
        if (XP.level[playerEid] > 255) XP.level[playerEid] = 255 // u8 cap
        XP.next[playerEid] = Math.round(XP.next[playerEid] * XP_MULTIPLIER)
        onLevelUp()
      }
    }
  }
}
