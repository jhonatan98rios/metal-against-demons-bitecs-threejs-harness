/**
 * Enemy tag component for BitECS.
 * Marks an entity as an enemy in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint8Array} isEnemy - Flag indicating if the entity is an enemy (1 = enemy, 0 = not an enemy)
 */
import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Enemy = {
  isEnemy: sab.u8(MAX_ENTITIES),
  /** XP granted to player when this enemy dies */
  xpValue: sab.u16(MAX_ENTITIES)
}
