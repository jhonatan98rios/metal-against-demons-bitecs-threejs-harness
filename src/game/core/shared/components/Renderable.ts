/**
 * Renderable component for BitECS.
 * This component determines whether an entity should be rendered in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint8Array} isRenderable - Flag indicating if the entity should be rendered (1 = renderable, 0 = not renderable)
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Renderable = {
  isRenderable: sab.u8(MAX_ENTITIES)
}
