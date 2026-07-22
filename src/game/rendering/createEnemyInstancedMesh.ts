import * as THREE from 'three'

// ponytail: single InstancedMesh for all enemies — N draw calls → 1
// per-instance: matrix (position + billboard rotation), UV offset (sprite frame), color (hit flash)

const VERTEX_SHADER = /* glsl */ `
attribute vec2 instanceUVOffset;
attribute vec3 instanceColor;

varying vec2 vUv;
varying vec3 vColor;

void main() {
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv + instanceUVOffset;
    vColor = instanceColor;
}
`

const FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D map;

varying vec2 vUv;
varying vec3 vColor;

void main() {
    vec4 texColor = texture2D(map, vUv);
    if (texColor.a < 0.5) discard;
    gl_FragColor = vec4(texColor.rgb * vColor, texColor.a);
}
`

// ponytail: hardcoded capacity, bump if more enemies needed
const ENEMY_CAPACITY = 5000

function createMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: texture } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthTest: true,
    depthWrite: true
  })
}

function initOffScreenInstances(
  mesh: THREE.InstancedMesh,
  colorBuffer: Float32Array
) {
  const offScreen = new THREE.Matrix4().compose(
    new THREE.Vector3(0, -9999, 0),
    new THREE.Quaternion(),
    new THREE.Vector3(1, 1, 1)
  )

  Array.from({ length: ENEMY_CAPACITY }, (_, i) => {
    colorBuffer[i * 3] = 1
    colorBuffer[i * 3 + 1] = 1
    colorBuffer[i * 3 + 2] = 1
    mesh.setMatrixAt(i, offScreen)
  })

  mesh.instanceMatrix.needsUpdate = true
}

export function createEnemyInstancedMesh(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(3, 6) // APPARITION.WIDTH, APPARITION.HEIGHT

  const texture = new THREE.TextureLoader().load('/enemies/apparition.png')
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.repeat.set(0.5, 0.5) // 2 columns × 2 rows

  const material = createMaterial(texture)
  const mesh = new THREE.InstancedMesh(geometry, material, ENEMY_CAPACITY)
  mesh.frustumCulled = false

  const uvBuffer = new Float32Array(ENEMY_CAPACITY * 2)
  const colorBuffer = new Float32Array(ENEMY_CAPACITY * 3)

  mesh.geometry.setAttribute(
    'instanceUVOffset',
    new THREE.InstancedBufferAttribute(uvBuffer, 2)
  )
  mesh.geometry.setAttribute(
    'instanceColor',
    new THREE.InstancedBufferAttribute(colorBuffer, 3)
  )

  initOffScreenInstances(mesh, colorBuffer)
  scene.add(mesh)

  return { mesh, uvBuffer, colorBuffer }
}
