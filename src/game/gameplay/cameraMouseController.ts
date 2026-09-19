const SENSITIVITY = 0.002

export function createCameraMouseController(canvas: HTMLCanvasElement) {
  const delta = { yaw: 0, pitch: 0 }

  const onMouseMove = (e: MouseEvent) => {
    // ponytail: no pointer lock → no look, so menus never rotate the camera
    if (document.pointerLockElement !== canvas) return
    delta.yaw += e.movementX * SENSITIVITY
    delta.pitch -= e.movementY * SENSITIVITY
  }

  const onPointerLockError = () => {
    // ponytail: refusals (no gesture / cooldown) are expected — user clicks again
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockerror', onPointerLockError)

  return {
    consumeLook: () => {
      const look = { yaw: delta.yaw, pitch: delta.pitch }
      delta.yaw = 0
      delta.pitch = 0
      return look
    },
    lock: () => {
      if (document.pointerLockElement === canvas) return
      const request = canvas.requestPointerLock() as unknown
      if (request && typeof (request as Promise<void>).catch === 'function')
        (request as Promise<void>).catch(() => {
          // ponytail: browsers gate pointer lock on gestures/cooldowns
        })
    },
    unlock: () => document.exitPointerLock(),
    isLocked: () => document.pointerLockElement === canvas,
    destroy() {
      document.exitPointerLock()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockerror', onPointerLockError)
    }
  }
}
