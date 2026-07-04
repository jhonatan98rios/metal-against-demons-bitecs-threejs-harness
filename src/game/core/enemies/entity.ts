import { addComponent, addEntity, World } from 'bitecs'

import { Enemy } from './components/Enemy'

import { Health } from '../shared/components/Health'
import { Position } from '../shared/components/Position'
import { Velocity } from '../shared/components/Velocity'
import { Renderable } from '../shared/components/Renderable'
import { Sprite } from '../shared/components/Sprite'
import { Animation } from '../shared/components/Animation'
import { AnimationRow } from '../shared/components/AnimationRow'
import { Boids, BOIDS_DEFAULTS } from '../shared/components/Boids'

import { APPARITION } from './definitions/apparition'

const ENEMY_COMPONENTS = [
  Enemy,
  Health,
  Position,
  Velocity,
  Renderable,
  Sprite,
  Animation,
  AnimationRow,
  Boids
] as const

const addEnemyComponents = (world: World, eid: number) => {
  ENEMY_COMPONENTS.forEach((component) => {
    addComponent(world, eid, component)
  })
}

const setupEnemyTag = (eid: number) => {
  Enemy.isEnemy[eid] = 1
}

const setupHealth = (eid: number) => {
  Health.current[eid] = APPARITION.HEALTH
  Health.max[eid] = APPARITION.MAX_HEALTH
}

const setupPosition = (eid: number, x: number, z: number) => {
  Position.x[eid] = x
  Position.y[eid] = 5
  Position.z[eid] = z
}

const setupVelocity = (eid: number) => {
  Velocity.x[eid] = 0
  Velocity.z[eid] = 0
}

const setupRenderable = (eid: number) => {
  Renderable.isRenderable[eid] = 1
}

const setupSprite = (eid: number) => {
  Sprite.texture[eid] = APPARITION.TEXTURE

  Sprite.columns[eid] = APPARITION.COLUMNS
  Sprite.rows[eid] = APPARITION.ROWS

  Sprite.width[eid] = APPARITION.WIDTH
  Sprite.height[eid] = APPARITION.HEIGHT
}

const setupAnimation = (eid: number) => {
  Animation.currentFrame[eid] = 0
  Animation.elapsed[eid] = 0

  Animation.fps[eid] = APPARITION.SPEED

  Animation.startFrame[eid] = APPARITION.START_FRAME
  Animation.endFrame[eid] = APPARITION.END_FRAME
}

const setupAnimationRow = (eid: number, facingLeft: boolean) => {
  AnimationRow.row[eid] = facingLeft ? 0 : 1
}

const setupBoids = (eid: number) => {
  Boids.maxSpeed[eid] = BOIDS_DEFAULTS.MAX_SPEED * APPARITION.SPEED
  Boids.perceptionRadius[eid] = BOIDS_DEFAULTS.PERCEPTION_RADIUS
  Boids.separationRadius[eid] = BOIDS_DEFAULTS.SEPARATION_RADIUS
  Boids.separationWeight[eid] = BOIDS_DEFAULTS.SEPARATION_WEIGHT
  Boids.alignmentWeight[eid] = BOIDS_DEFAULTS.ALIGNMENT_WEIGHT
  Boids.cohesionWeight[eid] = BOIDS_DEFAULTS.COHESION_WEIGHT
  Boids.pursuitWeight[eid] = BOIDS_DEFAULTS.PURSUIT_WEIGHT
}

export function setupApparition(
  eid: number,
  x: number,
  z: number,
  facingLeft = true
) {
  setupEnemyTag(eid)

  setupHealth(eid)
  setupPosition(eid, x, z)
  setupVelocity(eid)

  setupRenderable(eid)
  setupSprite(eid)
  setupAnimation(eid)
  setupAnimationRow(eid, facingLeft)
  setupBoids(eid)
}

export function createApparition(
  world: World,
  x: number,
  z: number,
  facingLeft = true
) {
  const eid = addEntity(world)

  addEnemyComponents(world, eid)

  setupApparition(eid, x, z, facingLeft)

  return eid
}
