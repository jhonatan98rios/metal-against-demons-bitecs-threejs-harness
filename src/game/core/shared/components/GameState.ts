/**
 * GameState component — single entity holds the global game state.
 * 0 = PLAYING, 1 = PAUSED, 2 = LEVEL_UP, 3 = GAME_OVER
 *
 * Backed by SharedArrayBuffer for future Web Worker multithreading.
 */
import { MAX_ENTITIES, sab } from '../constants'

export const STATES = {
  PLAYING: 0,
  PAUSED: 1,
  LEVEL_UP: 2,
  GAME_OVER: 3
} as const

export type GameStatus = (typeof STATES)[keyof typeof STATES]

export const GameState = {
  status: sab.u8(MAX_ENTITIES)
}
