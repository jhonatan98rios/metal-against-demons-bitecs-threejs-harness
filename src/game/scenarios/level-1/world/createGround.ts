import * as THREE from 'three'

function setupTexture(
  path: string
): THREE.Texture<HTMLImageElement, THREE.TextureEventMap> {
  const texture = new THREE.TextureLoader().load(path)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.repeat.set(10, 10)
  texture.anisotropy = 8
  return texture
}

function setupGeometry(): THREE.PlaneGeometry {
  const width = 1000
  const height = 1000
  const segments = 128
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments)
  return geometry
}

function setupMaterial(): THREE.MeshStandardMaterial {
  const texture = setupTexture('/world/sand.jpg')
  const displacementMap = setupTexture('/world/sand.png')

  // ponytail: warm light sand — dominant palette element, subtly golden
  const material = new THREE.MeshStandardMaterial({
    color: 0xe4c4b8,
    map: texture,
    displacementMap: displacementMap,
    displacementScale: 3,
    bumpMap: displacementMap,
    bumpScale: 3,
    roughness: 0.85,
    metalness: 0
  })

  return material
}

export function createGround(): THREE.Mesh {
  const geometry = setupGeometry()
  const material = setupMaterial()
  const ground = new THREE.Mesh(geometry, material)

  ground.rotation.x = -Math.PI / 2
  ground.name = 'Ground'

  ground.position.y = -1
  return ground
}
