import * as THREE from 'three'

function setupGeometry(): THREE.PlaneGeometry {
  const width = 30
  const height = 2000
  const geometry = new THREE.PlaneGeometry(width, height)
  return geometry
}

function setupTexture(): THREE.Texture<
  HTMLImageElement,
  THREE.TextureEventMap
> {
  const texture = new THREE.TextureLoader().load('/world/road.jpg')
  texture.anisotropy = 8
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.repeat.set(1, 50)
  return texture
}

function setupMaterial(): THREE.MeshStandardMaterial {
  const texture = setupTexture()
  // ponytail: neutral gray asphalt — distinct from sand without cold blue cast
  const material = new THREE.MeshStandardMaterial({
    color: 0x808890,
    map: texture,
    roughness: 0.85,
    metalness: 0.05
  })

  return material
}

function setupMesh(): THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.MeshStandardMaterial,
  THREE.Object3DEventMap
> {
  const geometry = setupGeometry()
  const material = setupMaterial()

  const road = new THREE.Mesh(geometry, material)
  return road
}

export function createRoad(): THREE.Mesh {
  const road = setupMesh()
  road.rotation.x = -Math.PI / 2
  road.position.x = 30
  road.position.y = 1
  road.receiveShadow = true
  road.name = 'Road'
  return road
}
