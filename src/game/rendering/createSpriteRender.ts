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

  const geometry = new THREE.PlaneGeometry(
    Sprite.width[eid],
    Sprite.height[eid]
  )

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5
  })

  const mesh = new THREE.Mesh(geometry, material)

  return mesh
}
