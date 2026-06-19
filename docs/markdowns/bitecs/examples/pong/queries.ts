import { query, World } from 'bitecs'
import { Position, Velocity, Paddle, Ball, Renderable } from './components'

export function cachedQueriesFactory(world: World) {
  const movementQuery = query(world, [Position, Velocity])

  const paddleQuery = query(world, [Paddle, Position, Velocity])

  const ballQuery = query(world, [Ball, Position, Velocity])

  const renderQuery = query(world, [Position, Renderable])

  return { movementQuery, paddleQuery, ballQuery, renderQuery }
}
