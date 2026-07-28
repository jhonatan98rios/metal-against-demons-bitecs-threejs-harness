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

// ponytail: two sand planes flanking the road (x=15..45), same material/displacement
function createSideGround(
  width: number,
  centerX: number,
  name: string
): THREE.Mesh {
  const segments = Math.round((128 * width) / 1000)
  const geometry = new THREE.PlaneGeometry(width, 1000, segments, 128)
  const material = setupMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(centerX, -1, 0)
  mesh.name = name
  mesh.receiveShadow = true
  return mesh
}

export function createGround(): [THREE.Mesh, THREE.Mesh] {
  return [
    createSideGround(515, -242.5, 'Ground.Left'),
    createSideGround(455, 272.5, 'Ground.Right')
  ]
}
