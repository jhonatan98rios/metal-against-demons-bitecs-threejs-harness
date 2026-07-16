/**
 * XP component for BitECS.
 * Tracks player experience points and level progression.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../constants'

export const XP = {
  /** Current level (starts at 1) */
  level: sab.u8(MAX_ENTITIES),
  /** XP accumulated in current level */
  current: sab.f32(MAX_ENTITIES),
  /** XP threshold needed for next level */
  next: sab.f32(MAX_ENTITIES)
}
