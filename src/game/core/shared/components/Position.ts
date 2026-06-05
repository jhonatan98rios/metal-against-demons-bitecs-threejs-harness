/**
 * Position component for BitECS.
 * This component defines position properties for entities in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Float32Array} x - X coordinate of the entity in 3D space
 * @property {Float32Array} y - Y coordinate of the entity in 3D space
 * @property {Float32Array} z - Z coordinate of the entity in 3D space
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Position = {
  x: sab.f32(MAX_ENTITIES),
  y: sab.f32(MAX_ENTITIES),
  z: sab.f32(MAX_ENTITIES)
}
