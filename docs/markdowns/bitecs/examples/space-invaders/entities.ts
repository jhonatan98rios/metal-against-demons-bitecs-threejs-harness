import { addComponent, addEntity, World } from 'bitecs'
import {
  Bullet,
  Enemy,
  Health,
  Player,
  Position,
  Renderable,
  Score,
  Velocity
} from './components'

/**
 * Player entity.
 *
 * ECS entities are just ids.
 * Components define behavior/data.
 */
export function createPlayer(world: World, canvas: HTMLCanvasElement) {
  const eid = addEntity(world)

  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)
  addComponent(world, eid, Renderable)
  addComponent(world, eid, Player)
  addComponent(world, eid, Health)

  Position.x[eid] = canvas.width / 2 - 30
  Position.y[eid] = canvas.height - 80

  Velocity.x[eid] = 0
  Velocity.y[eid] = 0

  Renderable.width[eid] = 60
  Renderable.height[eid] = 30

  Player.speed[eid] = 500
  Player.shootCooldown[eid] = 0

  Health.value[eid] = 3

  return eid
}

/**
 * Enemy entity.
 *
 * Enemies move downward continuously.
 */
export function createEnemy(world: World, x: number, y: number) {
  const eid = addEntity(world)

  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)
  addComponent(world, eid, Renderable)
  addComponent(world, eid, Enemy)
  addComponent(world, eid, Health)

  Position.x[eid] = x
  Position.y[eid] = y

  Velocity.x[eid] = 0
  Velocity.y[eid] = 40

  Renderable.width[eid] = 50
  Renderable.height[eid] = 30

  Enemy.alive[eid] = 1

  Health.value[eid] = 1

  return eid
}

/**
 * Bullet entity.
 *
 * Bullets are regular ECS entities too.
 */
export function createBullet(
  world: World,
  x: number,
  y: number,
  direction: number
) {
  const eid = addEntity(world)

  addComponent(world, eid, Position)
  addComponent(world, eid, Velocity)
  addComponent(world, eid, Renderable)
  addComponent(world, eid, Bullet)

  Position.x[eid] = x
  Position.y[eid] = y

  Velocity.x[eid] = 0
  Velocity.y[eid] = 0

  Renderable.width[eid] = 6
  Renderable.height[eid] = 16

  Bullet.speed[eid] = 700
  Bullet.direction[eid] = direction
  Bullet.active[eid] = 1

  return eid
}

/**
 * Score singleton entity.
 */
export function createScore(world: World) {
  const eid = addEntity(world)

  addComponent(world, eid, Score)

  Score.value[eid] = 0

  return eid
}
