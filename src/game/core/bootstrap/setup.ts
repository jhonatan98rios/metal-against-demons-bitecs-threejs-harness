import { addComponent, addEntity, createWorld, World } from 'bitecs'
import { createPlayer } from '../player/entity'
import { CameraMode } from '../shared/components/CameraMode'
import { GameState, STATES } from '../shared/components/GameState'

type WorldSetup = World & {
  playerEid: number
  cameraEid: number
  stateEid: number
}

export const setupWorld = () => {
  const world = createWorld() as WorldSetup
  world.playerEid = createPlayer(world)

  const cameraEid = addEntity(world)
  addComponent(world, cameraEid, CameraMode)
  CameraMode.mode[cameraEid] = 0
  world.cameraEid = cameraEid

  const stateEid = addEntity(world)
  addComponent(world, stateEid, GameState)
  GameState.status[stateEid] = STATES.PLAYING
  world.stateEid = stateEid

  return world
}
