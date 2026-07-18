import { addComponent, addEntity, removeComponent, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Enemy } from '../components/Enemy'
import { Health } from '../../shared/components/Health'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { Animation } from '../../shared/components/Animation'
import { AnimationRow } from '../../shared/components/AnimationRow'
import { Boids } from '../../shared/components/Boids'
import { Billboard } from '../../shared/components/Billboard'
import { HitEffect } from '../../shared/components/HitEffect'

const POOL_COMPONENTS = [
  Active,
  Enemy,
  Health,
  Position,
  Velocity,
  Renderable,
  Sprite,
  Animation,
  AnimationRow,
  Boids,
  Billboard,
  HitEffect
] as const

const addPoolComponents = (world: World, eid: number) => {
  POOL_COMPONENTS.forEach((component) => {
    addComponent(world, eid, component)
  })
}

export function createEnemyPool(world: World, poolSize: number) {
  const freeList: number[] = []

  Array.from({ length: poolSize }, () => {
    const eid = addEntity(world)

    addPoolComponents(world, eid)

    Active.isActive[eid] = 0
    Enemy.isEnemy[eid] = 1
    Renderable.isRenderable[eid] = 1
    addComponent(world, eid, Inactive)

    freeList.push(eid)
  })

  const acquire = (): number => {
    const eid = freeList.pop()

    if (eid === undefined) {
      return -1
    }

    Active.isActive[eid] = 1
    removeComponent(world, eid, Inactive)

    return eid
  }

  const release = (eid: number) => {
    Active.isActive[eid] = 0
    addComponent(world, eid, Inactive)

    freeList.push(eid)
  }

  return { acquire, release }
}
