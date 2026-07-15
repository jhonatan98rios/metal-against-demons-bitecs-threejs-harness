import { query, World } from 'bitecs'
import * as THREE from 'three'

import { Active } from '../core/shared/components/Active'
import { Position } from '../core/shared/components/Position'
import { Renderable } from '../core/shared/components/Renderable'
import { Animation } from '../core/shared/components/Animation'
import { AnimationRow } from '../core/shared/components/AnimationRow'
import { Sprite } from '../core/shared/components/Sprite'

import { createSpriteRender } from './createSpriteRender'

export const renderObjects = new Map<
  number,
  THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
>()

const getOrCreateRenderObject = (eid: number, scene: THREE.Scene) => {
  const existingObject = renderObjects.get(eid)

  if (existingObject) {
    return existingObject
  }

  const newObject = createSpriteRender(eid)

  renderObjects.set(eid, newObject)
  scene.add(newObject)

  return newObject
}

const updateSpriteFrame = (eid: number, object: THREE.Mesh) => {
  const columns = Sprite.columns[eid]
  const rows = Sprite.rows[eid]
  const currentFrame = Animation.currentFrame[eid]
  const animationRow =
    AnimationRow.row[eid] ?? Math.floor(currentFrame / columns)

  const frameX = currentFrame % columns
  const frameY = animationRow

  const mat = object.material as THREE.MeshStandardMaterial
  mat.map?.offset.set(frameX / columns, 1 - (frameY + 1) / rows)
}

const syncPosition = (eid: number, object: THREE.Mesh) => {
  object.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
}

export const createRenderSystem = (world: World, scene: THREE.Scene) => {
  return () => {
    const entities = query(world, [Active, Position, Renderable])

    for (const eid of entities) {
      if (Active.isActive[eid] === 0) {
        const existingObject = renderObjects.get(eid)

        if (existingObject) {
          existingObject.visible = false
        }

        continue
      }

      const object = getOrCreateRenderObject(eid, scene)

      object.visible = true

      updateSpriteFrame(eid, object)
      syncPosition(eid, object)
    }
  }
}
