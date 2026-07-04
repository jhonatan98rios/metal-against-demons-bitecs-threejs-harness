type VirtualJoystickInput = {
  setJoystick: (x: number, z: number) => void
}

interface JoystickState {
  touchId: number | null
  centerX: number
  centerY: number
}

interface JoystickContext {
  state: JoystickState
  container: HTMLElement
  knob: HTMLElement
  input: VirtualJoystickInput
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const JOYSTICK_SIZE = 120
const KNOB_SIZE = 50
const DEAD_ZONE = 0.15
const MAX_DIST = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2

const createStyles = (): HTMLStyleElement => {
  const style = document.createElement('style')
  style.textContent = `
    .virtual-joystick {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getJoystickCenter = (
  state: JoystickState,
  container: HTMLElement
): void => {
  const rect = container.getBoundingClientRect()
  state.centerX = rect.left + rect.width / 2
  state.centerY = rect.top + rect.height / 2
}

const updateKnob = (knob: HTMLElement, dx: number, dy: number): void => {
  const dist = Math.hypot(dx, dy)
  const clampedDist = Math.min(dist, MAX_DIST)
  const angle = Math.atan2(dy, dx)
  const kx = Math.cos(angle) * clampedDist
  const ky = Math.sin(angle) * clampedDist
  knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
}

const resetKnob = (knob: HTMLElement): void => {
  knob.style.transform = 'translate(-50%, -50%)'
}

// ---------------------------------------------------------------------------
// Touch handlers
// ---------------------------------------------------------------------------

const onTouchStart =
  (ctx: JoystickContext) =>
  (e: TouchEvent): void => {
    if (ctx.state.touchId !== null) return
    const touch = e.changedTouches[0]
    if (!touch) return
    if (!ctx.container.contains(e.target as HTMLElement)) return
    e.preventDefault()
    ctx.state.touchId = touch.identifier
    getJoystickCenter(ctx.state, ctx.container)
    const dx = touch.clientX - ctx.state.centerX
    const dy = touch.clientY - ctx.state.centerY
    updateKnob(ctx.knob, dx, dy)
  }

const onTouchMove =
  (ctx: JoystickContext) =>
  (e: TouchEvent): void => {
    const { state } = ctx
    if (state.touchId === null) return
    const touches = Array.from(e.changedTouches)
    const touch = touches.find((t) => t.identifier === state.touchId)
    if (!touch) return
    e.preventDefault()
    const dx = touch.clientX - state.centerX
    const dy = touch.clientY - state.centerY
    const dist = Math.hypot(dx, dy)
    const clampedDist = Math.min(dist, MAX_DIST)
    const deadThreshold = DEAD_ZONE * MAX_DIST
    const nx =
      clampedDist > deadThreshold ? (dx / dist) * (clampedDist / MAX_DIST) : 0
    const nz =
      clampedDist > deadThreshold ? (dy / dist) * (clampedDist / MAX_DIST) : 0
    ctx.input.setJoystick(nx, nz)
    updateKnob(ctx.knob, dx, dy)
  }

const onTouchEnd =
  (ctx: JoystickContext) =>
  (e: TouchEvent): void => {
    if (ctx.state.touchId === null) return
    const found = Array.from(e.changedTouches).some(
      (t) => t.identifier === ctx.state.touchId
    )
    if (!found) return
    e.preventDefault()
    ctx.state.touchId = null
    ctx.input.setJoystick(0, 0)
    resetKnob(ctx.knob)
  }

const onTouchCancel = (ctx: JoystickContext) => (): void => {
  ctx.state.touchId = null
  ctx.input.setJoystick(0, 0)
  resetKnob(ctx.knob)
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

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

  const state: JoystickState = { touchId: null, centerX: 0, centerY: 0 }
  const ctx: JoystickContext = { state, container, knob, input }

  const tsHandler = onTouchStart(ctx)
  const tmHandler = onTouchMove(ctx)
  const teHandler = onTouchEnd(ctx)
  const tcHandler = onTouchCancel(ctx)

  document.addEventListener('touchstart', tsHandler, { passive: false })
  document.addEventListener('touchmove', tmHandler, { passive: false })
  document.addEventListener('touchend', teHandler, { passive: false })
  document.addEventListener('touchcancel', tcHandler, { passive: false })

  return {
    destroy() {
      style.remove()
      container.remove()
      document.removeEventListener('touchstart', tsHandler)
      document.removeEventListener('touchmove', tmHandler)
      document.removeEventListener('touchend', teHandler)
      document.removeEventListener('touchcancel', tcHandler)
    }
  }
}
