import { createWorld, World } from 'bitecs'
import { createPlayer } from '../player/entity'

enum Status {
  PLAYING,
  PAUSED,
  GAMEOVER
}

type WorldSetup = World & {
  status: Status
  playerEid: number
}

export const setupWorld = () => {
  const world = createWorld() as WorldSetup
  world.playerEid = createPlayer(world)
  return world
}
