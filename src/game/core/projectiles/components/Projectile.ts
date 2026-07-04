import { MAX_ENTITIES, sab } from '../../shared/constants'

export const Projectile = {
  isProjectile: sab.u8(MAX_ENTITIES),
  targetX: sab.f32(MAX_ENTITIES),
  targetZ: sab.f32(MAX_ENTITIES),
  damage: sab.f32(MAX_ENTITIES)
}
