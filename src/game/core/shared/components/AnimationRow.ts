/**
 * AnimationRow component for BitECS.
 * Selects which row of the spritesheet to display (0-3).
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * Row mapping:
 *   0 = idle facing left
 *   1 = walk facing left
 *   2 = idle facing right
 *   3 = walk facing right
 */
import { MAX_ENTITIES, sab } from '../constants'

export const AnimationRow = {
  row: sab.u8(MAX_ENTITIES)
}
