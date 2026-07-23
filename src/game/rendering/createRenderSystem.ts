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
import { Enemy } from '../core/enemies/components/Enemy'

import { createSpriteRender } from './createSpriteRender'
import { createEnemyIM, EnemyInstancedMesh } from './createEnemyInstancedMesh'
import { APPARITION } from '../core/enemies/definitions/apparition'
import { CRAWLER } from '../core/enemies/definitions/crawler'

const renderObjects = new Map<
  number,
  THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
>()

// -- non-enemy mesh management (player, projectiles) -----------------------

const getOrCreateRenderObject = (eid: number, scene: THREE.Scene) => {
  const existingObject = renderObjects.get(eid)
  if (existingObject) return existingObject

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

// -- health bars -----------------------------------------------------------

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

// -- non-enemy health bars (attached to mesh) ------------------------------

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

// -- enemy health bars (standalone, not attached to instanced mesh) --------

const enemyHealthBars = new Map<number, { bg: THREE.Mesh; fill: THREE.Mesh }>()

const syncEnemyHealthBar = (eid: number, scene: THREE.Scene) => {
  const current = Health.current[eid]
  const max = Health.max[eid]

  if (current >= max) {
    const existing = enemyHealthBars.get(eid)
    if (existing) existing.bg.visible = false
    return
  }

  const bar =
    enemyHealthBars.get(eid) ??
    (() => {
      const hb = createHealthBar()
      scene.add(hb.bg)
      enemyHealthBars.set(eid, hb)
      return hb
    })()

  bar.bg.visible = true
  bar.bg.position.set(Position.x[eid], Position.y[eid] + BAR_Y, Position.z[eid])

  const ratio = Math.max(0, current / max)
  bar.fill.scale.x = ratio
  bar.fill.position.x = (BAR_W * (ratio - 1)) / 2

  const fillMat = bar.fill.material as THREE.MeshBasicMaterial
  if (ratio > 0.5) {
    fillMat.color.setHSL(0.33, 1, 0.5)
  } else if (ratio > 0.25) {
    fillMat.color.setHSL(0.15, 1, 0.5)
  } else {
    fillMat.color.setHSL(0, 1, 0.5)
  }
}

// -- non-enemy hit flash ---------------------------------------------------

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

// -- per-frame helpers (reuse allocations) ---------------------------------

const _pos = new THREE.Vector3()
const _rot = new THREE.Quaternion()
const _scl = new THREE.Vector3(1, 1, 1)
const _mat = new THREE.Matrix4()
const _up = new THREE.Vector3(0, 1, 0)

// -- enemy instanced mesh routing ------------------------------------------

interface EnemyIMSlot {
  im: EnemyInstancedMesh
  counter: number
}

function updateEnemyInstance(
  eid: number,
  index: number,
  im: EnemyInstancedMesh,
  cam: { x: number; z: number },
  delta: number
) {
  const columns = Sprite.columns[eid]
  const rows = Sprite.rows[eid]
  const frame = Animation.currentFrame[eid]
  const row = AnimationRow.row[eid] ?? 0
  im.uvBuffer[index * 2] = (frame % columns) / columns
  im.uvBuffer[index * 2 + 1] = 1 - (row + 1) / rows

  const hitTimer = HitEffect.timer[eid]
  if (hitTimer > 0) {
    HitEffect.timer[eid] = Math.max(0, hitTimer - delta)
    const flash = hitTimer / 0.15
    im.colorBuffer[index * 3] = 1
    im.colorBuffer[index * 3 + 1] = 1 - flash
    im.colorBuffer[index * 3 + 2] = 1 - flash
  } else {
    im.colorBuffer[index * 3] = 1
    im.colorBuffer[index * 3 + 1] = 1
    im.colorBuffer[index * 3 + 2] = 1
  }

  _pos.set(Position.x[eid], Position.y[eid], Position.z[eid])
  _rot.setFromAxisAngle(
    _up,
    Math.atan2(cam.x - Position.x[eid], cam.z - Position.z[eid])
  )
  _mat.compose(_pos, _rot, _scl)
  im.mesh.setMatrixAt(index, _mat)
}

function finalizeEnemyIM(slot: EnemyIMSlot) {
  slot.im.mesh.count = slot.counter
  slot.im.mesh.instanceMatrix.needsUpdate = true
  slot.im.mesh.geometry.attributes.instanceUVOffset.needsUpdate = true
  slot.im.mesh.geometry.attributes.instanceColor.needsUpdate = true
}

function renderNonEnemy(eid: number, scene: THREE.Scene, delta: number) {
  const object = getOrCreateRenderObject(eid, scene)
  object.visible = true
  updateSpriteFrame(eid, object)
  syncPosition(eid, object)
  applyHitFlash(object, eid, delta)
  updateHealthBar(object, eid)
}

function handleInactive(eid: number) {
  if (Enemy.isEnemy[eid]) {
    const bar = enemyHealthBars.get(eid)
    if (bar) bar.bg.visible = false
    return
  }
  const obj = renderObjects.get(eid)
  if (obj) obj.visible = false
}

// ponytail: one InstancedMesh per texture, pre-created at system init
function createEnemyIMSlots(scene: THREE.Scene): Map<string, EnemyIMSlot> {
  const map = new Map<string, EnemyIMSlot>()

  const makeSlot = (
    texture: string,
    columns: number,
    rows: number,
    width: number,
    height: number
  ) => {
    map.set(texture, {
      im: createEnemyIM(scene, {
        texturePath: texture,
        columns,
        rows,
        width,
        height
      }),
      counter: 0
    })
  }

  makeSlot(
    APPARITION.TEXTURE,
    APPARITION.COLUMNS,
    APPARITION.ROWS,
    APPARITION.WIDTH,
    APPARITION.HEIGHT
  )
  makeSlot(
    CRAWLER.TEXTURE,
    CRAWLER.COLUMNS,
    CRAWLER.ROWS,
    CRAWLER.WIDTH,
    CRAWLER.HEIGHT
  )

  return map
}

export const createRenderSystem = (
  world: World,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const enemyIMByTexture = createEnemyIMSlots(scene)

  return (delta: number) => {
    const entities = query(world, [Active, Position, Renderable])
    const cam = { x: camera.position.x, z: camera.position.z }

    enemyIMByTexture.forEach((s) => {
      s.counter = 0
    })

    for (const eid of entities) {
      if (Active.isActive[eid] === 0) {
        handleInactive(eid)
        continue
      }

      if (Enemy.isEnemy[eid] === 1) {
        const slot = enemyIMByTexture.get(Sprite.texture[eid])!
        updateEnemyInstance(eid, slot.counter, slot.im, cam, delta)
        syncEnemyHealthBar(eid, scene)
        slot.counter++
      } else {
        renderNonEnemy(eid, scene, delta)
      }
    }

    enemyIMByTexture.forEach((slot) => finalizeEnemyIM(slot))
  }
}
