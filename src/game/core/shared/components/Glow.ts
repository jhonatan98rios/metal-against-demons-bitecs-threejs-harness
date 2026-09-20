/**
 * Glow (emissive) component for BitECS.
 * Marks an entity as a light emitter: the render system boosts its sprite
 * color by `intensity`, so the global bloom pass spreads it into a halo.
 * Reusable across any Renderable entity (orbs, projectiles, …).
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint8Array} intensity - 0 = no glow (default); higher = brighter
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Glow = {
  intensity: sab.u8(MAX_ENTITIES)
}
