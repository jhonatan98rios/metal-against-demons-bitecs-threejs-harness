import { createWorld, World } from 'bitecs'

enum Status {
  PLAYING,
  PAUSED,
  GAMEOVER
}

type WorldSetup = World & {
  status: Status
}

export const setupWorld = () => {
  const world = createWorld() as WorldSetup
  return world
}
