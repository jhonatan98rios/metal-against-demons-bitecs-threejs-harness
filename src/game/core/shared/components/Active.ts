/**
 * Active component for BitECS.
 * Marks whether an entity is actively processed by systems.
 * Entities with isActive=0 are skipped by render and animation systems.
 * Used by object pools to avoid GC pressure from create/destroy cycles.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint8Array} isActive - Flag indicating active status (1 = active, 0 = inactive)
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Active = {
  isActive: sab.u8(MAX_ENTITIES)
}
