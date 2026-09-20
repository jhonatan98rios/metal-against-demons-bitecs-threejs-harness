import {
  addComponent,
  addEntity,
  Not,
  query,
  removeComponent,
  World
} from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Inactive } from '../../shared/components/Inactive'
import { Position } from '../../shared/components/Position'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { Orb } from '../components/Orb'
import { ORB } from '../definitions/orb'

const ORB_COMPONENTS = [Active, Orb, Position, Renderable, Sprite] as const

const addOrbComponents = (world: World, eid: number) => {
  ORB_COMPONENTS.forEach((component) => {
    addComponent(world, eid, component)
  })
}

const initOrb = (world: World, eid: number) => {
  Active.isActive[eid] = 0
  Orb.isOrb[eid] = 1
  Renderable.isRenderable[eid] = 1
  Sprite.texture[eid] = ORB.TEXTURE
  Sprite.columns[eid] = ORB.COLUMNS
  Sprite.rows[eid] = ORB.ROWS
  Sprite.width[eid] = ORB.WIDTH
  Sprite.height[eid] = ORB.HEIGHT
  addComponent(world, eid, Inactive)
}

export function createOrbPool(world: World, size: number) {
  const freeList: number[] = []

  Array.from({ length: size }, () => {
    const eid = addEntity(world)
    addOrbComponents(world, eid)
    initOrb(world, eid)
    freeList.push(eid)
  })

  const release = (eid: number) => {
    Active.isActive[eid] = 0
    addComponent(world, eid, Inactive)
    freeList.push(eid)
  }

  return {
    acquire(x: number, z: number, xpValue: number): number {
      const eid = freeList.pop()
      if (eid === undefined) return -1

      Active.isActive[eid] = 1
      removeComponent(world, eid, Inactive)
      Orb.xpValue[eid] = xpValue
      Position.x[eid] = x
      Position.y[eid] = ORB.HOVER_Y
      Position.z[eid] = z
      return eid
    },

    release,

    /** Release every active orb (called on run restart). */
    releaseAll() {
      const active = query(world, [Orb, Not(Inactive)]) as readonly number[]

      // eslint-disable-next-line functional/no-let
      for (let i = 0; i < active.length; i++) {
        release(active[i])
      }
    }
  }
}
