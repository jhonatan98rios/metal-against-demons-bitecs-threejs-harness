/**
 * Crawler enemy definition.
 * Spritesheet: /enemies/crawler.png (260×74px, 4 cols × 2 rows).
 *
 * Row mapping:
 *   0 = walking right (frames 0-3)
 *   1 = walking left (frames 0-3)
 *
 * Each frame: 65×37px → 3×2 world units (~1.76:1 ratio).
 */
export const CRAWLER = {
  /** Spritesheet texture path relative to /public */
  TEXTURE: '/enemies/crawler.png',

  /** Number of columns in the spritesheet */
  COLUMNS: 4,

  /** Number of rows in the spritesheet */
  ROWS: 2,

  /** Frame width in world units */
  WIDTH: 6,

  /** Frame height in world units */
  HEIGHT: 4,

  /** Starting health value */
  HEALTH: 3,

  /** Maximum health value */
  MAX_HEALTH: 3,

  /** Movement speed multiplier (1 = default, higher = faster) */
  SPEED: 1.3,

  /** Starting frame index for animation loop */
  START_FRAME: 0,

  /** Ending frame index for animation loop */
  END_FRAME: 3,

  /** XP granted to player on kill */
  XP_VALUE: 7
} as const
