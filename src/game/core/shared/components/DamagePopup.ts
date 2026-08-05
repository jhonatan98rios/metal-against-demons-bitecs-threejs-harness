import { MAX_ENTITIES, sab } from '../constants'

/** How long a damage popup stays visible above the player, in seconds */
export const DAMAGE_POPUP_DURATION_S = 2

/**
 * Floating damage popup rendered above the player when an enemy hits.
 * timer counts down to 0 (hidden); damage holds the value drawn as "-N".
 */
export const DamagePopup = {
  timer: sab.f32(MAX_ENTITIES),
  damage: sab.f32(MAX_ENTITIES)
}
