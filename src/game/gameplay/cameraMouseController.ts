const SENSITIVITY = 0.002

export function createCameraMouseController(canvas: HTMLCanvasElement) {
  const angle = { value: 0 }

  const onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== canvas) return
    angle.value -= e.movementX * SENSITIVITY
  }

  const onPointerLockChange = () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', onMouseMove)
    } else {
      document.removeEventListener('mousemove', onMouseMove)
    }
  }

  const onClick = () => canvas.requestPointerLock()
  canvas.addEventListener('click', onClick)
  document.addEventListener('pointerlockchange', onPointerLockChange)

  return {
    getAngle: () => angle.value,
    destroy() {
      document.exitPointerLock()
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }
}
