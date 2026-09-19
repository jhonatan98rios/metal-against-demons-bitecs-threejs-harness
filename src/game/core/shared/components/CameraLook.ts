/**
 * First-person look component for BitECS.
 * `yaw` is horizontal rotation in radians (unbounded, wraps naturally via trig).
 * `pitch` is vertical rotation in radians, clamped by the camera system.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../constants'

export const CameraLook = {
  yaw: sab.f32(MAX_ENTITIES),
  pitch: sab.f32(MAX_ENTITIES)
}
