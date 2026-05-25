import * as THREE from 'three'

export const createRender = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  const scene = new THREE.Scene()
  const fogColor = 0xd7c1a0
  scene.background = new THREE.Color(fogColor)
  scene.fog = new THREE.Fog(fogColor, 0, 300)

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )

  camera.position.set(30, 25, 50)
  camera.lookAt(new THREE.Vector3(30, 0, 0))

  const ambient = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambient)

  return {
    renderer,
    scene,
    camera
  }
}
