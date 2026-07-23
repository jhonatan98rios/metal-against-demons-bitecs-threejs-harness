/**
 * Apparition enemy definition.
 * Spritesheet: /enemies/apparition.png (100×200px, 2 cols × 2 rows).
 *
 * Row mapping:
 *   0 = walking left (frames 0-1)
 *   1 = walking right (frames 0-1)
 *
 * Each frame: 50×100px → 3×6 world units (1:2 ratio).
 */
export const APPARITION = {
  /** Spritesheet texture path relative to /public */
  TEXTURE: '/enemies/apparition.png',

  /** Number of columns in the spritesheet */
  COLUMNS: 2,

  /** Number of rows in the spritesheet */
  ROWS: 2,

  /** Frame width in world units */
  WIDTH: 3,

  /** Frame height in world units */
  HEIGHT: 6,

  /** Starting health value */
  HEALTH: 5,

  /** Maximum health value */
  MAX_HEALTH: 5,

  /** Movement speed multiplier (1 = default, higher = faster) */
  SPEED: 0.2,

  /** Animation frame rate (frames per second) */
  ANIM_FPS: 0.4,

  /** Starting frame index for animation loop */
  START_FRAME: 0,

  /** Ending frame index for animation loop */
  END_FRAME: 1,

  /** XP granted to player on kill */
  XP_VALUE: 10
} as const
