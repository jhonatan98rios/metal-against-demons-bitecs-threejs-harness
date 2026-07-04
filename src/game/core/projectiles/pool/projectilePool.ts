import { addComponent, addEntity, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { Animation } from '../../shared/components/Animation'
import { Projectile } from '../components/Projectile'

const COMPONENTS = [
  Active,
  Projectile,
  Position,
  Velocity,
  Renderable,
  Sprite,
  Animation
] as const

const addComponents = (world: World, eid: number) => {
  COMPONENTS.forEach((c) => addComponent(world, eid, c))
}

const TEXTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="3" fill="%23ff4400"/></svg>'
  )

export function createProjectilePool(world: World, size: number) {
  const free: number[] = []

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < size; i++) {
    const eid = addEntity(world)
    addComponents(world, eid)

    Active.isActive[eid] = 0
    Projectile.isProjectile[eid] = 1
    Projectile.damage[eid] = 1
    Renderable.isRenderable[eid] = 1
    Sprite.texture[eid] = TEXTURE
    Sprite.columns[eid] = 1
    Sprite.rows[eid] = 1
    Sprite.width[eid] = 0.5
    Sprite.height[eid] = 0.5
    Animation.currentFrame[eid] = 0
    Animation.elapsed[eid] = 0
    Animation.fps[eid] = 0
    Animation.startFrame[eid] = 0
    Animation.endFrame[eid] = 0

    free.push(eid)
  }

  return {
    acquire(x: number, z: number, vx: number, vz: number) {
      const eid = free.pop()
      if (eid === undefined) return -1
      Active.isActive[eid] = 1
      Position.x[eid] = x
      Position.y[eid] = 5
      Position.z[eid] = z
      Velocity.x[eid] = vx
      Velocity.z[eid] = vz
      return eid
    },

    release(eid: number) {
      Active.isActive[eid] = 0
      free.push(eid)
    }
  }
}
