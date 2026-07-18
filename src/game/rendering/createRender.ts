import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { Position } from '../core/shared/components/Position'

// -- color palette: sunset sandstorm — pink/salmon shift, diffuse light ---------
// dust haze with pink undertone — seamless fog/background blend
const SKY_COLOR = 0xefcac4
// sun: sunset with red shift — warm pink, not yellow
const SUN_COLOR = 0xffd8d2
// hemi: sky pink-tinted white, ground rosy sand (dust-scattered)
const HEMI_SKY = 0xffeeea
const HEMI_GROUND = 0xefcac4

function createWebGLRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95

  return renderer
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )

  // ponytail: initial position ≈25% higher & farther than before
  camera.position.set(30, 28, 65)
  camera.lookAt(new THREE.Vector3(30, 0, 10))

  return camera
}

function createDirectionalLight() {
  const dirLight = new THREE.DirectionalLight(SUN_COLOR, 1.2)
  dirLight.position.set(140, 120, 30)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  dirLight.shadow.bias = -0.0005
  dirLight.shadow.normalBias = 0.05
  dirLight.shadow.radius = 5 // ponytail: extremely soft — light diffused by dust
  return dirLight
}

function setShadowCamera(shadowCam: THREE.OrthographicCamera) {
  shadowCam.left = -250
  shadowCam.right = 250
  shadowCam.top = 250
  shadowCam.bottom = -250
  shadowCam.near = 0.5
  shadowCam.far = 1000

  shadowCam.updateProjectionMatrix()
}

function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  // ponytail: bloom barely perceptible — only softens emissive / bright highlights
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.15,
    0.4,
    0.85
  )
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  return composer
}

// ponytail: small point light that follows player to prevent silhouette loss
function createPlayerFillLight(): THREE.PointLight {
  const light = new THREE.PointLight(0xffe0d8, 2.5, 40, 1.5)
  light.castShadow = false
  light.position.set(30, 8, 0)
  return light
}

export const createFollowCamera = (
  camera: THREE.PerspectiveCamera,
  getPlayerEid: () => number,
  offset = new THREE.Vector3(0, 20, 50),
  smooth = 0.05
) => {
  const targetPos = new THREE.Vector3()
  return () => {
    const eid = getPlayerEid()
    if (!eid) return
    targetPos.set(Position.x[eid], Position.y[eid], Position.z[eid]).add(offset)
    camera.position.lerp(targetPos, smooth)
    camera.lookAt(Position.x[eid], Position.y[eid], Position.z[eid])
  }
}

export const createRender = (canvas: HTMLCanvasElement) => {
  const renderer = createWebGLRenderer(canvas)

  const scene = new THREE.Scene()

  // sand haze background — warm desert atmosphere
  scene.background = new THREE.Color(SKY_COLOR)
  // fog: dust haze — starts closer, blends horizon with sky
  scene.fog = new THREE.Fog(SKY_COLOR, 70, 550)

  const camera = createCamera()

  // hemisphere: sky cool blue, ground warm brown from sand bounce
  const hemi = new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, 2.5)
  hemi.position.set(0, 200, 0)
  scene.add(hemi)

  // sun: warm golden directional
  const dirLight = createDirectionalLight()
  dirLight.target.position.set(30, 5, 30)
  scene.add(dirLight.target)
  setShadowCamera(dirLight.shadow.camera)
  scene.add(dirLight)

  // ponytail: warm ambient fill — dust-scattered light reaches everywhere
  const ambient = new THREE.AmbientLight(0x7c6458, 1.15)
  scene.add(ambient)

  // player fill light — prevents silhouette from disappearing in shadow
  const playerFill = createPlayerFillLight()
  scene.add(playerFill)

  const composer = createPostProcessing(renderer, scene, camera)

  return {
    renderer,
    scene,
    camera,
    composer,
    playerFill
  }
}
