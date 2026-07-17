import { query, World } from 'bitecs'
import * as THREE from 'three'

import { Active } from '../core/shared/components/Active'
import { Position } from '../core/shared/components/Position'
import { Renderable } from '../core/shared/components/Renderable'
import { Animation } from '../core/shared/components/Animation'
import { AnimationRow } from '../core/shared/components/AnimationRow'
import { Sprite } from '../core/shared/components/Sprite'
import { Health } from '../core/shared/components/Health'
import { HitEffect } from '../core/shared/components/HitEffect'

import { createSpriteRender } from './createSpriteRender'

export const renderObjects = new Map<
  number,
  THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
>()

// -- blob shadow -----------------------------------------------------------

// ponytail: mutable cache via object property avoids functional/no-let
const shadowTexCache = { tex: null as THREE.CanvasTexture | null }
const SHADOW_Y = -0.95 // ground is at y=-1, blob slightly above to avoid z-fighting

const getShadowTexture = (): THREE.CanvasTexture => {
  if (shadowTexCache.tex) return shadowTexCache.tex

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0.45)')
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.25)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  shadowTexCache.tex = new THREE.CanvasTexture(canvas)
  shadowTexCache.tex.needsUpdate = true
  return shadowTexCache.tex
}

const shadowGeo = new THREE.PlaneGeometry(1, 1)

const shadowObjects = new Map<number, THREE.Mesh>()

const getOrCreateShadow = (eid: number, scene: THREE.Scene): THREE.Mesh => {
  const existing = shadowObjects.get(eid)
  if (existing) return existing

  const mat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(shadowGeo, mat)
  mesh.rotation.x = -Math.PI / 2 // horizontal
  mesh.renderOrder = -1 // below sprites

  shadowObjects.set(eid, mesh)
  scene.add(mesh)
  return mesh
}

const syncShadow = (eid: number, shadow: THREE.Mesh) => {
  const w = Sprite.width[eid] || 2
  shadow.position.set(Position.x[eid], SHADOW_Y, Position.z[eid])
  shadow.scale.setScalar(w * 0.8)
}

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

const BAR_W = 2
const BAR_H = 0.2
const BAR_Y = 3.5

const createHealthBar = (): { bg: THREE.Mesh; fill: THREE.Mesh } => {
  const fillGeo = new THREE.PlaneGeometry(BAR_W, BAR_H)
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    depthTest: false,
    depthWrite: false,
    transparent: true
  })
  const fill = new THREE.Mesh(fillGeo, fillMat)
  fill.userData.healthBarFill = true
  // ponytail: renderOrder garante fill sobre bg; z-offset sozinho é instável com depthTest false
  fill.renderOrder = 1

  const bgGeo = new THREE.PlaneGeometry(BAR_W, BAR_H)
  const bgMat = new THREE.MeshBasicMaterial({
    color: 0x333333,
    depthTest: false,
    depthWrite: false,
    transparent: true
  })
  const bg = new THREE.Mesh(bgGeo, bgMat)
  bg.userData.healthBarBg = true
  bg.position.y = BAR_Y
  bg.add(fill)
  fill.position.z = 0.01

  return { bg, fill }
}

const getOrCreateHealthBar = (
  mesh: THREE.Mesh
): { bg: THREE.Mesh; fill: THREE.Mesh } => {
  const existing = mesh.children.find((c) => c.userData.healthBarBg) as
    | THREE.Mesh
    | undefined

  if (existing) {
    return { bg: existing, fill: existing.children[0] as THREE.Mesh }
  }

  const parts = createHealthBar()
  mesh.add(parts.bg)
  return parts
}

const updateHealthBar = (mesh: THREE.Mesh, eid: number) => {
  const current = Health.current[eid]
  const max = Health.max[eid]
  const visible = current < max

  const parts = getOrCreateHealthBar(mesh)
  parts.bg.visible = visible

  if (!visible) return

  const ratio = Math.max(0, current / max)
  parts.fill.scale.x = ratio
  parts.fill.position.x = (BAR_W * (ratio - 1)) / 2

  const fillMat = parts.fill.material as THREE.MeshBasicMaterial
  if (ratio > 0.5) {
    fillMat.color.setHSL(0.33, 1, 0.5)
  } else if (ratio > 0.25) {
    fillMat.color.setHSL(0.15, 1, 0.5)
  } else {
    fillMat.color.setHSL(0, 1, 0.5)
  }
}

const applyHitFlash = (
  object: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>,
  eid: number,
  delta: number
) => {
  const hitTimer = HitEffect.timer[eid]
  const mat = object.material

  if (hitTimer > 0) {
    mat.emissive.set(0xff0000)
    mat.emissiveIntensity = hitTimer / 0.15
    HitEffect.timer[eid] = Math.max(0, hitTimer - delta)
    return
  }

  if (mat.emissiveIntensity > 0) {
    mat.emissive.set(0x000000)
    mat.emissiveIntensity = 0
  }
}

const applyHealthBar = (
  object: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>,
  eid: number
) => {
  if (Health.max[eid] > 0) {
    updateHealthBar(object, eid)
  }
}

export const createRenderSystem = (world: World, scene: THREE.Scene) => {
  return (delta: number) => {
    const entities = query(world, [Active, Position, Renderable])

    for (const eid of entities) {
      if (Active.isActive[eid] === 0) {
        const existingObject = renderObjects.get(eid)

        if (existingObject) {
          existingObject.visible = false
        }

        const inactiveShadow = shadowObjects.get(eid)
        if (inactiveShadow) inactiveShadow.visible = false

        continue
      }

      const object = getOrCreateRenderObject(eid, scene)

      object.visible = true

      updateSpriteFrame(eid, object)
      syncPosition(eid, object)
      applyHitFlash(object, eid, delta)
      applyHealthBar(object, eid)

      const shadow = getOrCreateShadow(eid, scene)
      syncShadow(eid, shadow)
      shadow.visible = true
    }
  }
}
