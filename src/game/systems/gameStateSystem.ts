import { World } from 'bitecs'
import { GameState, STATES } from '../core/shared/components/GameState'

interface GameStateWorld extends World {
  stateEid?: number
}

const getEid = (w: GameStateWorld) =>
  typeof w.stateEid === 'number' ? w.stateEid : -1

const handleTerminalState = (
  eid: number,
  getRestartInput: () => boolean,
  debounce: { restart: boolean },
  onRestart: () => void
) => {
  const restart = getRestartInput()
  if (restart && !debounce.restart) {
    debounce.restart = true
    GameState.status[eid] = STATES.PLAYING
    onRestart()
  } else if (!restart) {
    debounce.restart = false
  }
}

const handlePauseToggle = (
  eid: number,
  state: number,
  getPauseInput: () => boolean,
  debounce: { pause: boolean }
) => {
  const pressed = getPauseInput()
  if (pressed && !debounce.pause) {
    debounce.pause = true
    GameState.status[eid] =
      state === STATES.PLAYING ? STATES.PAUSED : STATES.PLAYING
  } else if (!pressed) {
    debounce.pause = false
  }
}

export function createGameStateSystem(
  world: World,
  getPauseInput: () => boolean,
  getRestartInput: () => boolean,
  onRestart: () => void
) {
  const w = world as GameStateWorld
  const debounce = { pause: false, restart: false }
  return {
    update() {
      const eid = getEid(w)
      if (eid < 0) return
      const state = GameState.status[eid]
      if (state === STATES.GAME_OVER || state === STATES.LEVEL_UP) {
        handleTerminalState(eid, getRestartInput, debounce, onRestart)
        return
      }
      handlePauseToggle(eid, state, getPauseInput, debounce)
    },
    setGameOver() {
      const eid = getEid(w)
      if (eid >= 0) GameState.status[eid] = STATES.GAME_OVER
    },
    togglePause() {
      const eid = getEid(w)
      if (eid < 0) return
      const state = GameState.status[eid]
      if (state !== STATES.GAME_OVER && state !== STATES.LEVEL_UP)
        GameState.status[eid] =
          state === STATES.PLAYING ? STATES.PAUSED : STATES.PLAYING
    },
    setLevelUp() {
      const eid = getEid(w)
      if (eid >= 0) GameState.status[eid] = STATES.LEVEL_UP
    },
    getState(): number {
      const eid = getEid(w)
      return eid >= 0 ? GameState.status[eid] : STATES.PLAYING
    },
    // ponytail: only resume if actually in LEVEL_UP, prevents accidental unpause
    resumeFromLevelUp() {
      const eid = getEid(w)
      if (eid >= 0 && GameState.status[eid] === STATES.LEVEL_UP)
        GameState.status[eid] = STATES.PLAYING
    }
  }
}
