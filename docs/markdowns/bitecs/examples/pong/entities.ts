/**
 * Pong ECS entities (shared helpers using shared components)
 */
import { addComponent, addEntity } from 'bitecs'
import type { World } from 'bitecs'
import {
  Position,
  Velocity,
  Paddle,
  Ball,
  Renderable,
  Score
} from './components'

export function createPaddle(world: World, x: number, y: number) {
  const eid = addEntity(world)

  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)
  addComponent(world, eid, Paddle)
  addComponent(world, eid, Renderable)

  Position.x[eid] = x
  Position.y[eid] = y

  Velocity.x[eid] = 0
  Velocity.y[eid] = 0

  Paddle.speed[eid] = 420

  Renderable.width[eid] = 20
  Renderable.height[eid] = 100

  return eid
}

export function createBall(world: World, x: number, y: number) {
  const eid = addEntity(world)

  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)
  addComponent(world, eid, Ball)
  addComponent(world, eid, Renderable)

  Position.x[eid] = x
  Position.y[eid] = y

  Velocity.x[eid] = 280
  Velocity.y[eid] = 180

  Ball.radius[eid] = 10

  Renderable.width[eid] = 20
  Renderable.height[eid] = 20

  return eid
}

export function createScore(world: World) {
  const eid = addEntity(world)

  addComponent(world, eid, Score)

  Score.left[eid] = 0
  Score.right[eid] = 0

  return eid
}
