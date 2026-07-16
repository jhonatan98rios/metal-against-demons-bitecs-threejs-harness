import * as THREE from 'three'
import { Position } from '../core/shared/components/Position'

function createWebGLRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  return renderer
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )

  camera.position.set(30, 25, 50)
  camera.lookAt(new THREE.Vector3(30, 0, 0))

  return camera
}

// ponytail: key light atrás (-Z) só pra sombra; fill light na frente (+Z) ilumina sprites
function createKeyLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xffffff, 1.2)
  light.position.set(30, 80, -60)
  light.castShadow = true
  light.shadow.mapSize.width = 2048
  light.shadow.mapSize.height = 2048
  light.shadow.bias = -0.0002
  return light
}

function createFillLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xfff5e8, 2.0)
  light.position.set(30, 80, 80)
  light.castShadow = false
  return light
}

function setShadowCamera(shadowCam: THREE.OrthographicCamera) {
  shadowCam.left = -200
  shadowCam.right = 200
  shadowCam.top = 200
  shadowCam.bottom = -200
  shadowCam.near = 0.5
  shadowCam.far = 1000

  shadowCam.updateProjectionMatrix()
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
  const fogColor = 0xd7c1a0
  scene.background = new THREE.Color(fogColor)
  scene.fog = new THREE.Fog(fogColor, 0, 300)

  const camera = createCamera()
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x443322, 0.5)
  hemi.position.set(0, 200, 0)
  scene.add(hemi)

  // key light: atrás (-Z), projeta sombra visível na top-down (direção +Z, em direção à câmera)
  const keyLight = createKeyLight()
  keyLight.target.position.set(30, 5, 30)
  scene.add(keyLight.target)
  setShadowCamera(keyLight.shadow.camera)
  scene.add(keyLight)

  // fill light: frente (+Z), ilumina face visível dos sprites, sem sombra
  const fillLight = createFillLight()
  scene.add(fillLight)

  const ambient = new THREE.AmbientLight(0x404040, 0.3)
  scene.add(ambient)

  return {
    renderer,
    scene,
    camera
  }
}
