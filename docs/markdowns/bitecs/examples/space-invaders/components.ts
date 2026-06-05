/**
 * Position component.
 *
 * Components are pure data containers.
 * No methods.
 */
export const Position = {
  x: [] as number[],
  y: [] as number[]
}

/**
 * Velocity component.
 *
 * Used by movement system.
 */
export const Velocity = {
  x: [] as number[],
  y: [] as number[]
}

/**
 * Renderable component.
 *
 * Render system reads this data.
 */
export const Renderable = {
  width: [] as number[],
  height: [] as number[]
}

/**
 * Player component.
 *
 * Stores player-specific data.
 */
export const Player = {
  speed: [] as number[],
  shootCooldown: [] as number[]
}

/**
 * Enemy component.
 *
 * Enemies descend vertically.
 */
export const Enemy = {
  alive: [] as number[]
}

/**
 * Bullet component.
 *
 * direction:
 * -1 = upward
 *  1 = downward
 */
export const Bullet = {
  speed: [] as number[],
  direction: [] as number[],
  active: [] as number[]
}

/**
 * Health component.
 *
 * Reusable generic component.
 */
export const Health = {
  value: [] as number[]
}

/**
 * Score singleton component.
 */
export const Score = {
  value: [] as number[]
}
