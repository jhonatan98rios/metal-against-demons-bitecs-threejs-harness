import * as THREE from 'three'

import {
  DamagePopup,
  DAMAGE_POPUP_DURATION_S
} from '../core/shared/components/DamagePopup'

const CANVAS_W = 256
const CANVAS_H = 128
const POPUP_Y = 4.4
const FADE_S = 1

/** "-5" — the exact text drawn inside a damage popup */
export const formatDamageText = (damage: number) => `-${Math.round(damage)}`

const drawDamageText = (canvas: HTMLCanvasElement, damage: number) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.font = 'bold 80px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 14
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.strokeText(formatDamageText(damage), CANVAS_W / 2, CANVAS_H / 2)
  ctx.fillStyle = '#ff2d2d'
  ctx.fillText(formatDamageText(damage), CANVAS_W / 2, CANVAS_H / 2)
}

export const createDamagePopupSprite = (): THREE.Sprite => {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })
  )
  sprite.scale.set(2.2, 1.1, 1)
  sprite.position.y = POPUP_Y
  sprite.renderOrder = 3
  sprite.visible = false
  sprite.userData.canvas = canvas
  sprite.userData.lastDamage = -1
  return sprite
}

// ponytail: one sprite per entity (only the player gets popups); re-hits overwrite
export const updateDamagePopup = (
  sprite: THREE.Sprite,
  eid: number,
  delta: number
) => {
  const timer = DamagePopup.timer[eid]
  if (timer <= 0) {
    sprite.visible = false
    return
  }

  DamagePopup.timer[eid] = Math.max(0, timer - delta)

  const material = sprite.material
  const damage = DamagePopup.damage[eid]
  if (sprite.userData.lastDamage !== damage) {
    drawDamageText(sprite.userData.canvas as HTMLCanvasElement, damage)
    const map = material.map as THREE.CanvasTexture
    map.needsUpdate = true
    sprite.userData.lastDamage = damage
  }

  // ponytail: drift up as it fades out over the last second
  sprite.position.y = POPUP_Y + (1 - timer / DAMAGE_POPUP_DURATION_S) * 0.8
  material.opacity = Math.min(1, timer / FADE_S)
  sprite.visible = true
}
