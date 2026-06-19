import { createWorld, World } from 'bitecs'

import { createPlayer } from '../player/entity'
import { createCameraEntity } from '../camera/entity'

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
  world.cameraEid = createCameraEntity(world)
  return world
}
