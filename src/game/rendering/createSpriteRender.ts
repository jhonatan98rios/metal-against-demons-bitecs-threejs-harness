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
  mesh.castShadow = true
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: texture,
    alphaTest: 0.5
  })

  // ponytail: horizontal shadow disc — vertical sprite casts invisible line shadow,
  // this disc casts a visible blob on the ground in shadow pass only
  const discGeo = new THREE.CircleGeometry(Sprite.width[eid] * 0.6, 6)
  discGeo.rotateX(-Math.PI / 2)
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial())
  disc.castShadow = true
  disc.renderOrder = 999
  disc.material.colorWrite = false
  disc.material.depthWrite = false
  disc.position.y = -Sprite.height[eid] / 2
  mesh.add(disc)

  return mesh
}
