type VirtualJoystickInput = {
  setJoystick: (x: number, z: number) => void
}

const JOYSTICK_SIZE = 120
const KNOB_SIZE = 50
const DEAD_ZONE = 0.15

const createStyles = (): HTMLStyleElement => {
  const style = document.createElement('style')
  style.textContent = `
    .virtual-joystick {
      position: fixed;
      bottom: 40px;
      left: 40px;
      width: ${JOYSTICK_SIZE}px;
      height: ${JOYSTICK_SIZE}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      touch-action: none;
      z-index: 1000;
      display: none;
    }

    .virtual-joystick.active {
      display: block;
    }

    .virtual-joystick__knob {
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${KNOB_SIZE}px;
      height: ${KNOB_SIZE}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: transform 0.05s linear;
    }
  `
  return style
}

export function createVirtualJoystick(input: VirtualJoystickInput) {
  const style = createStyles()
  document.head.appendChild(style)

  const container = document.createElement('div')
  container.className = 'virtual-joystick active'
  container.id = 'virtual-joystick'

  const knob = document.createElement('div')
  knob.className = 'virtual-joystick__knob'
  container.appendChild(knob)

  document.body.appendChild(container)

  let touchId: number | null = null
  let centerX = 0
  let centerY = 0

  const getCenter = () => {
    const rect = container.getBoundingClientRect()
    centerX = rect.left + rect.width / 2
    centerY = rect.top + rect.height / 2
  }

  const updateKnob = (dx: number, dy: number) => {
    const maxDist = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2
    const dist = Math.hypot(dx, dy)
    const clampedDist = Math.min(dist, maxDist)
    const angle = Math.atan2(dy, dx)

    const kx = Math.cos(angle) * clampedDist
    const ky = Math.sin(angle) * clampedDist

    knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
  }

  const resetKnob = () => {
    knob.style.transform = 'translate(-50%, -50%)'
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (touchId !== null) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const target = e.target as HTMLElement
    if (!container.contains(target)) return

    e.preventDefault()

    touchId = touch.identifier
    getCenter()

    const dx = touch.clientX - centerX
    const dy = touch.clientY - centerY

    updateKnob(dx, dy)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (touchId === null) return

    let touch: Touch | null = null

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        touch = e.changedTouches[i]
        break
      }
    }

    if (!touch) return

    e.preventDefault()

    const dx = touch.clientX - centerX
    const dy = touch.clientY - centerY

    const maxDist = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2
    const dist = Math.hypot(dx, dy)
    const clampedDist = Math.min(dist, maxDist)

    let nx = 0
    let nz = 0

    if (clampedDist > DEAD_ZONE * maxDist) {
      const normalized = clampedDist / maxDist
      nx = (dx / dist) * normalized
      nz = (-dy / dist) * normalized
    }

    input.setJoystick(nx, nz)

    updateKnob(dx, dy)
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchId === null) return

    let touchFound = false

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        touchFound = true
        break
      }
    }

    if (!touchFound) return

    e.preventDefault()

    touchId = null

    input.setJoystick(0, 0)
    resetKnob()
  }

  const handleTouchCancel = () => {
    touchId = null
    input.setJoystick(0, 0)
    resetKnob()
  }

  document.addEventListener('touchstart', handleTouchStart, { passive: false })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd, { passive: false })
  document.addEventListener('touchcancel', handleTouchCancel, { passive: false })

  return {
    destroy() {
      style.remove()
      container.remove()

      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
    }
  }
}
