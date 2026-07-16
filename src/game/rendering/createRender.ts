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

function createDirectionalLight() {
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
  // ponytail: luz na frente (+Z) ilumina face visível dos sprites billboard; sombra projeta pra trás (-Z)
  dirLight.position.set(30, 120, 100)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  dirLight.shadow.bias = -0.0001
  return dirLight
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
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x443322, 0.6)
  hemi.position.set(0, 200, 0)
  scene.add(hemi)

  const dirLight = createDirectionalLight()
  // ponytail: target centralizado no play area pra shadow camera cobrir tudo
  dirLight.target.position.set(30, 5, 30)
  scene.add(dirLight.target)
  setShadowCamera(dirLight.shadow.camera)

  scene.add(dirLight)

  const ambient = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambient)

  return {
    renderer,
    scene,
    camera
  }
}
