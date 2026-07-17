/**
 * Skill component — marks an entity as an active skill instance.
 * Each active skill the player has is its own entity with this component.
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Skill = {
  /** Which skill type (0 = empty, 1 = projectile, 2 = fire trail, etc.) */
  skillId: sab.u8(MAX_ENTITIES),
  /** Current upgrade level (1+ = active, 0 = not used) */
  level: sab.u8(MAX_ENTITIES)
}
