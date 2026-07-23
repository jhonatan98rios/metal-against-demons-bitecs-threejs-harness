import * as THREE from 'three'

// ponytail: single InstancedMesh per texture — N textures → N draw calls
// per-instance: matrix (position + billboard rotation), UV offset (sprite frame), color (hit flash)

const VERTEX_SHADER = /* glsl */ `
#include <common>
uniform vec2 spritesheetSize;
attribute vec2 instanceUVOffset;
attribute vec3 instanceColor;

varying vec2 vUv;
varying vec3 vColor;

void main() {
    #include <begin_vertex>
    #include <project_vertex>

    vec2 cellSize = 1.0 / spritesheetSize;
    vUv = uv * cellSize + instanceUVOffset;
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

function createMaterial(texture: THREE.Texture, columns: number, rows: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      spritesheetSize: { value: new THREE.Vector2(columns, rows) }
    },
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

export interface EnemyInstancedMesh {
  mesh: THREE.InstancedMesh
  uvBuffer: Float32Array
  colorBuffer: Float32Array
}

export interface EnemyIMConfig {
  texturePath: string
  columns: number
  rows: number
  width: number
  height: number
}

export function createEnemyIM(
  scene: THREE.Scene,
  config: EnemyIMConfig
): EnemyInstancedMesh {
  const geometry = new THREE.PlaneGeometry(config.width, config.height)

  const texture = new THREE.TextureLoader().load(config.texturePath)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  const material = createMaterial(texture, config.columns, config.rows)
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

// -- legacy compat ---------------------------------------------------------

export function createEnemyInstancedMesh(scene: THREE.Scene) {
  return createEnemyIM(scene, {
    texturePath: '/enemies/apparition.png',
    columns: 2,
    rows: 2,
    width: 3,
    height: 6
  })
}
