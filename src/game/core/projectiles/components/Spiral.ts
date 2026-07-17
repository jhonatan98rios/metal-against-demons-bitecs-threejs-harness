import { MAX_ENTITIES, sab } from '../../shared/constants'

/**
 * Spiral movement for projectiles that orbit clockwise around a center point
 * (typically the player) while moving outward.
 *
 * Not backed by Velocity — positions are recalculated each frame by the
 * spiral movement system relative to the center entity.
 */
export const Spiral = {
  /** Current angle in radians. Decrements each frame (clockwise). */
  angle: sab.f32(MAX_ENTITIES),
  /** Radians per second rotating around center. */
  angularSpeed: sab.f32(MAX_ENTITIES),
  /** Units per second moving outward from center. */
  radialSpeed: sab.f32(MAX_ENTITIES)
}
