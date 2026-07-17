import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Projectile = {
  isProjectile: sab.u8(MAX_ENTITIES),
  targetX: sab.f32(MAX_ENTITIES),
  targetZ: sab.f32(MAX_ENTITIES),
  damage: sab.f32(MAX_ENTITIES),
  /** Pool ownership tag. 0 = unassigned, 1+ = pool id. */
  poolId: sab.u8(MAX_ENTITIES),
  /** 0 = cannot hit an enemy already hit by another projectile this frame. */
  friendlyFire: sab.u8(MAX_ENTITIES)
}
