/**
 * Health component for BitECS.
 * This component defines health properties for entities in the entity-component-system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Float32Array} current - Current health value of the entity
 * @property {Float32Array} max - Maximum health value of the entity
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Health = {
  current: sab.f32(MAX_ENTITIES),
  max: sab.f32(MAX_ENTITIES)
}
