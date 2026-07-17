import { addComponent, addEntity, World } from 'bitecs'

import { Active } from '../../shared/components/Active'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'
import { Renderable } from '../../shared/components/Renderable'
import { Sprite } from '../../shared/components/Sprite'
import { Animation } from '../../shared/components/Animation'
import { TTL } from '../../shared/components/TTL'
import { Billboard } from '../../shared/components/Billboard'
import { Projectile } from '../components/Projectile'

const COMPONENTS = [
  Active,
  Projectile,
  Position,
  Velocity,
  Renderable,
  Sprite,
  Animation,
  TTL,
  Billboard
] as const

const addComponents = (world: World, eid: number) => {
  COMPONENTS.forEach((c) => addComponent(world, eid, c))
}

/** Spritesheet configuration for projectile pools. */
export type ProjectileSpriteConfig = {
  texture: string
  columns: number
  rows: number
  width: number
  height: number
  fps: number
  startFrame: number
  endFrame: number
}

function initEntity(world: World, eid: number, sprite: ProjectileSpriteConfig) {
  Active.isActive[eid] = 0
  Projectile.isProjectile[eid] = 1
  Projectile.damage[eid] = 1
  Projectile.poolId[eid] = 1
  Projectile.friendlyFire[eid] = 0
  Renderable.isRenderable[eid] = 1
  Billboard.isBillboard[eid] = 1
  Sprite.texture[eid] = sprite.texture
  Sprite.columns[eid] = sprite.columns
  Sprite.rows[eid] = sprite.rows
  Sprite.width[eid] = sprite.width
  Sprite.height[eid] = sprite.height
  Animation.currentFrame[eid] = sprite.startFrame
  Animation.elapsed[eid] = 0
  Animation.fps[eid] = sprite.fps
  Animation.startFrame[eid] = sprite.startFrame
  Animation.endFrame[eid] = sprite.endFrame
}

export function createProjectilePool(
  world: World,
  size: number,
  sprite: ProjectileSpriteConfig
) {
  const free: number[] = []

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < size; i++) {
    const eid = addEntity(world)
    addComponents(world, eid)
    initEntity(world, eid, sprite)
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
      TTL.remaining[eid] = 1
      return eid
    },

    release(eid: number) {
      Active.isActive[eid] = 0
      free.push(eid)
    }
  }
}
