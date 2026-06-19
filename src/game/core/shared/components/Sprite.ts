/**
 * Sprite component for BitECS.
 * This component defines sprite properties for entities in the entity-component-system.
 *
 * Numeric fields are backed by SharedArrayBuffer for future Web Worker multithreading.
 * String fields (texture, name) remain as plain arrays — strings cannot live in SAB.
 * In a worker context, string fields are read on the main thread only.
 *
 * @property {string[]} name - Array of sprite names
 * @property {string[]} texture - Array of texture asset paths
 * @property {Uint8Array} columns - Number of columns in the sprite sheet
 * @property {Uint8Array} rows - Number of rows in the sprite sheet
 * @property {Float32Array} width - Width of individual sprite frames
 * @property {Float32Array} height - Height of individual sprite frames
 */
import { MAX_ENTITIES, sab } from '../constants'

export const Sprite = {
  name: [] as string[],
  texture: [] as string[],
  columns: sab.u8(MAX_ENTITIES),
  rows: sab.u8(MAX_ENTITIES),
  width: sab.f32(MAX_ENTITIES),
  height: sab.f32(MAX_ENTITIES)
}
