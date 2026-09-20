/**
 * XP orb definition.
 * Sprite: /orbs/xp_orb.png (32×32px, single frame).
 * Orbs are single-frame, so they carry no Animation/AnimationRow component —
 * that also keeps them out of the worker animation query.
 */
export const ORB = {
  /** Texture path relative to /public */
  TEXTURE: '/orbs/xp_orb.png',

  /** Single-frame sprite */
  COLUMNS: 1,
  ROWS: 1,

  /** Frame size in world units */
  WIDTH: 0.7,
  HEIGHT: 0.7,

  /** Sprite Y offset (sprite is already centered) */
  Y_OFFSET: 0,

  /** Height at which orbs hover */
  HOVER_Y: 2.5,

  /** Player distance at which an orb starts moving toward the player */
  MAGNET_RADIUS: 8,

  /** Player distance at which an orb is collected */
  COLLECT_RADIUS: 1.2,

  /** Orb travel speed toward the player (world units / second) */
  MAGNET_SPEED: 22
} as const
