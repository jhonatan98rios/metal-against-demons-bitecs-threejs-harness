import * as THREE from 'three'

import { Glow } from '../core/shared/components/Glow'
import { Sprite } from '../core/shared/components/Sprite'

// ponytail: emissive reuses the sprite texture, so a glowing projectile keeps
// its own colors and the global bloom pass spreads the halo — no second map
const GLOW_GAIN = 2.4

/**
 * Applies the reusable `Glow` component to a sprite mesh material.
 * `Glow.intensity` is 0 = no emission; >0 scales the emissive boost.
 */
export function applySpriteGlow(
  eid: number,
  material: THREE.MeshStandardMaterial
) {
  const intensity = Glow.intensity[eid]
  if (intensity === 0) return

  material.emissive.set(0xffffff)
  material.emissiveIntensity = (intensity / 255) * GLOW_GAIN
}

export function createSpriteRender(eid: number) {
  const texture = new THREE.TextureLoader().load(Sprite.texture[eid])

  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace

  const columns = Sprite.columns[eid]
  const rows = Sprite.rows[eid]

  texture.repeat.set(1 / columns, 1 / rows)

  texture.offset.set(0, 1 - 1 / rows)

  const geometry = new THREE.PlaneGeometry(
    Sprite.width[eid],
    Sprite.height[eid]
  )

  // emissive intensity starts at 0 — applySpriteGlow turns it on per entity
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0,
    transparent: true,
    alphaTest: 0.5
  })

  const mesh = new THREE.Mesh(geometry, material)

  return mesh
}
