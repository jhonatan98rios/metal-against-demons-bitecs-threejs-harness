import { query, World } from 'bitecs'
import {
  Bullet,
  Enemy,
  Player,
  Position,
  Renderable,
  Velocity
} from './components'

export function cachedQueriesFactory(world: World) {
  /**
   * Queries return entities matching components.
   *
   * Same pattern used in your movementSystem example:
   * query(world, [Position, Velocity])
   */

  const movementQuery = query(world, [Position, Velocity])

  const playerQuery = query(world, [Player, Position, Velocity])

  const enemyQuery = query(world, [Enemy, Position, Velocity])

  const bulletQuery = query(world, [Bullet, Position])

  const renderQuery = query(world, [Position, Renderable])

  return { movementQuery, renderQuery, playerQuery, enemyQuery, bulletQuery }
}
