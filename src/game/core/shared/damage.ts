import { DamagePopup, DAMAGE_POPUP_DURATION_S } from './components/DamagePopup'
import { Health } from './components/Health'
import { HitEffect } from './components/HitEffect'

/** How long the red hit flash lasts, in seconds. */
export const HIT_FLASH_DURATION_S = 0.15

/**
 * Applies damage to an entity: subtracts health and triggers the hit flash
 * plus floating damage popup. Shared by projectile collisions and skills.
 */
export function applyDamage(eid: number, amount: number): void {
  Health.current[eid] -= amount
  HitEffect.timer[eid] = HIT_FLASH_DURATION_S
  DamagePopup.timer[eid] = DAMAGE_POPUP_DURATION_S
  DamagePopup.damage[eid] = amount
}
