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
  return mesh
}

// ponytail: flat sand fill behind the noisy side grounds — same texture/color,
// no displacement relief. Occludes the gray background that shows through the
// noise gaps in the real floor.
function setupFlatSandMaterial(): THREE.MeshStandardMaterial {
  const material = setupMaterial()
  material.displacementScale = 0
  return material
}

function createFillGround(width: number, centerX: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, 1000, 1, 1)
  const material = setupFlatSandMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  // ponytail: sit just behind the real floor (z<0) so gaps reveal sand, not gray bg
  mesh.position.set(centerX, -1, -3)
  mesh.name = 'Ground.Fill'
  return mesh
}

export function createFillGrounds(): THREE.Mesh[] {
  return [createFillGround(515, -242.5), createFillGround(455, 272.5)]
}

export function createGround(): [THREE.Mesh, THREE.Mesh] {
  return [
    createSideGround(515, -242.5, 'Ground.Left'),
    createSideGround(455, 272.5, 'Ground.Right')
  ]
}
