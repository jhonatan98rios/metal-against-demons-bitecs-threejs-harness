import * as THREE from 'three'
import { Sprite } from '../core/shared/components/Sprite'

export function createSpriteRender(eid: number) {
  const texture = new THREE.TextureLoader().load(Sprite.texture[eid])

  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace

  const columns = Sprite.columns[eid]
  const rows = Sprite.rows[eid]

  texture.repeat.set(1 / columns, 1 / rows)

  texture.offset.set(0, 1 - 1 / rows)

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide
  })

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(Sprite.width[eid], Sprite.height[eid], 1)
  sprite.castShadow = false
  sprite.receiveShadow = false

  return sprite
}
