/**
 * Player component for the game core.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../shared/constants'

export const Player = {
  isPlayer: sab.u8(MAX_ENTITIES)
}
