import * as THREE from 'three'

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
  dirLight.position.set(-50, 100, -30)
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
