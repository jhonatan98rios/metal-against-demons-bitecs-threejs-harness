/**
 * Pong ECS components (shared data structures).
 * This module defines the Structure-of-Arrays used by bitecs-like patterns
 * in the Pong example.
 */
export const Position = {
  x: [] as number[],
  y: [] as number[]
}

export const Velocity = {
  x: [] as number[],
  y: [] as number[]
}

export const Paddle = {
  speed: [] as number[]
}

export const Ball = {
  radius: [] as number[]
}

export const Renderable = {
  width: [] as number[],
  height: [] as number[]
}

export const Score = {
  left: [] as number[],
  right: [] as number[]
}
