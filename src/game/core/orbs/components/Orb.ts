/**
 * XP orb component for BitECS.
 * Enemies drop one orb on death carrying their XP value; collecting it grants
 * that XP to the player. Pooled like enemies and projectiles.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 *
 * @property {Uint8Array} isOrb - Tag flag (1 = entity is an orb)
 * @property {Float32Array} xpValue - XP granted when collected
 */
import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Orb = {
  isOrb: sab.u8(MAX_ENTITIES),
  xpValue: sab.f32(MAX_ENTITIES)
}
