import { addComponent, addEntity, createWorld, World } from 'bitecs'
import { createPlayer } from '../player/entity'
import { CameraMode } from '../shared/components/CameraMode'

enum Status {
  PLAYING,
  PAUSED,
  GAMEOVER
}

type WorldSetup = World & {
  status: Status
  playerEid: number
  cameraEid: number
}

export const setupWorld = () => {
  const world = createWorld() as WorldSetup
  world.playerEid = createPlayer(world)

  const cameraEid = addEntity(world)
  addComponent(world, cameraEid, CameraMode)
  CameraMode.mode[cameraEid] = 0
  world.cameraEid = cameraEid

  return world
}
