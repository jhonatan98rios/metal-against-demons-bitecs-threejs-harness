import * as THREE from 'three'

function setupGeometry(): THREE.PlaneGeometry {
  const width = 30
  const height = 2000
  const geometry = new THREE.PlaneGeometry(width, height)
  return geometry
}

function setupMaterial(): THREE.MeshStandardMaterial {
  // ponytail: flat light gray — texture was too dark, masking color changes
  const material = new THREE.MeshStandardMaterial({
    color: 0xd0d2d4,
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
