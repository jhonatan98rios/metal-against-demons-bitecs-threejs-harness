/**
 * Velocity component for BitECS.
 * This component defines velocity properties for entities in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Float32Array} x - X-axis velocity of the entity
 * @property {Float32Array} z - Z-axis velocity of the entity
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Velocity = {
  x: sab.f32(MAX_ENTITIES),
  z: sab.f32(MAX_ENTITIES)
}
