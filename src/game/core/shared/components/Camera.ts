/**
 * Camera tag component for BitECS.
 *
 * Marks an entity as the active camera.
 * Only one camera entity should exist at any time.
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Camera = {
  isCamera: sab.u8(MAX_ENTITIES)
}
