import * as THREE from 'three'

import {
  DamagePopup,
  DAMAGE_POPUP_DURATION_S
} from '../core/shared/components/DamagePopup'
import { Position } from '../core/shared/components/Position'

const CANVAS_W = 256
const CANVAS_H = 128
const POPUP_Y = 4.4
const FADE_S = 1
const DRIFT = 0.8

/** Red popup over the player (damage taken) */
export const PLAYER_POPUP_COLOR = '#ff2d2d'
/** Yellow popup over enemies (damage dealt) */
export const ENEMY_POPUP_COLOR = '#ffd700'

/** "-5" — the exact text drawn inside a damage popup */
export const formatDamageText = (damage: number) => `-${Math.round(damage)}`

const drawDamageText = (
  canvas: HTMLCanvasElement,
  damage: number,
  color: string
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.font = 'bold 96px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 16
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.strokeText(formatDamageText(damage), CANVAS_W / 2, CANVAS_H / 2)
  ctx.fillStyle = color
  ctx.fillText(formatDamageText(damage), CANVAS_W / 2, CANVAS_H / 2)
}

export const createDamagePopupSprite = (color: string): THREE.Sprite => {
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
  sprite.scale.set(2.6, 1.3, 1)
  sprite.position.y = POPUP_Y
  sprite.renderOrder = 3
  sprite.visible = false
  sprite.userData.canvas = canvas
  sprite.userData.color = color
  sprite.userData.lastDamage = -1
  return sprite
}

const driftY = (timer: number) => (1 - timer / DAMAGE_POPUP_DURATION_S) * DRIFT

/** Returns the remaining timer, or null once the popup finished (hidden). */
const tickPopup = (
  sprite: THREE.Sprite,
  eid: number,
  delta: number
): number | null => {
  const timer = DamagePopup.timer[eid]
  if (timer <= 0) {
    sprite.visible = false
    return null
  }

  DamagePopup.timer[eid] = Math.max(0, timer - delta)

  const material = sprite.material
  const damage = DamagePopup.damage[eid]
  if (sprite.userData.lastDamage !== damage) {
    drawDamageText(
      sprite.userData.canvas as HTMLCanvasElement,
      damage,
      sprite.userData.color as string
    )
    const map = material.map as THREE.CanvasTexture
    map.needsUpdate = true
    sprite.userData.lastDamage = damage
  }

  // ponytail: drift up as it fades out over the last second
  material.opacity = Math.min(1, timer / FADE_S)
  sprite.visible = true
  return timer
}

// player: sprite is a child of the player mesh, floats above the head
export const updateDamagePopup = (
  sprite: THREE.Sprite,
  eid: number,
  delta: number
) => {
  const timer = tickPopup(sprite, eid, delta)
  if (timer === null) return
  sprite.position.y = POPUP_Y + driftY(timer)
}

// enemies: sprite lives in the scene, follows the enemy position
export const updateWorldDamagePopup = (
  sprite: THREE.Sprite,
  eid: number,
  delta: number
) => {
  const timer = tickPopup(sprite, eid, delta)
  if (timer === null) return
  sprite.position.set(
    Position.x[eid],
    Position.y[eid] + POPUP_Y + driftY(timer),
    Position.z[eid]
  )
}
