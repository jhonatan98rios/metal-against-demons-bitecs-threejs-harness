import { addComponent, addEntity, World } from 'bitecs'

import { Player } from './components'

import { Active } from '../shared/components/Active'
import { Health } from '../shared/components/Health'
import { Position } from '../shared/components/Position'
import { Velocity } from '../shared/components/Velocity'
import { Renderable } from '../shared/components/Renderable'
import { Sprite } from '../shared/components/Sprite'
import { Animation } from '../shared/components/Animation'
import { AnimationRow } from '../shared/components/AnimationRow'
import { XP } from '../shared/components/XP'

const PLAYER_COMPONENTS = [
  Active,
  Player,
  Health,
  Position,
  Velocity,
  Renderable,
  Sprite,
  Animation,
  AnimationRow,
  XP
] as const

const addPlayerComponents = (world: World, eid: number) => {
  PLAYER_COMPONENTS.forEach((component) => {
    addComponent(world, eid, component)
  })
}

const setupHealth = (eid: number) => {
  Health.current[eid] = 100
  Health.max[eid] = 100
}

const setupPosition = (eid: number) => {
  Position.x[eid] = 30
  Position.y[eid] = 5
  Position.z[eid] = 0
}

const setupVelocity = (eid: number) => {
  Velocity.x[eid] = 0
  Velocity.z[eid] = 0
}

const setupRenderable = (eid: number) => {
  Renderable.isRenderable[eid] = 1
}

const setupSprite = (eid: number) => {
  Sprite.texture[eid] = '/player/spritesheet.png'

  Sprite.columns[eid] = 4
  Sprite.rows[eid] = 4

  Sprite.width[eid] = 4
  Sprite.height[eid] = 8
}

const setupAnimation = (eid: number) => {
  Animation.currentFrame[eid] = 0
  Animation.elapsed[eid] = 0

  Animation.fps[eid] = 8

  Animation.startFrame[eid] = 0
  Animation.endFrame[eid] = 3
}

const setupAnimationRow = (eid: number) => {
  AnimationRow.row[eid] = 0
}

const setupActive = (eid: number) => {
  Active.isActive[eid] = 1
}

const setupPlayerTag = (eid: number) => {
  Player.isPlayer[eid] = 1
}

const setupXP = (eid: number) => {
  XP.level[eid] = 1
  XP.current[eid] = 0
  XP.next[eid] = 100
}

export function createPlayer(world: World) {
  const playerEid = addEntity(world)

  addPlayerComponents(world, playerEid)

  setupPlayerTag(playerEid)
  setupActive(playerEid)

  setupXP(playerEid)
  setupHealth(playerEid)
  setupPosition(playerEid)
  setupVelocity(playerEid)

  setupRenderable(playerEid)
  setupSprite(playerEid)
  setupAnimation(playerEid)
  setupAnimationRow(playerEid)

  return playerEid
}
