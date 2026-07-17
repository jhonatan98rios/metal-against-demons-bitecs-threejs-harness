const SENSITIVITY = 0.002

export function createCameraMouseController(canvas: HTMLCanvasElement) {
  const angle = { value: 0 }

  const onMouseMove = (e: MouseEvent) => {
    angle.value += e.movementX * SENSITIVITY
  }

  document.addEventListener('mousemove', onMouseMove)

  return {
    getAngle: () => angle.value,
    lock: () => canvas.requestPointerLock(),
    unlock: () => document.exitPointerLock(),
    isLocked: () => document.pointerLockElement === canvas,
    destroy() {
      document.exitPointerLock()
      document.removeEventListener('mousemove', onMouseMove)
    }
  }
}
