interface TouchState {
  touchId: number | null
  lastX: number
  lastY: number
}

type Look = {
  yaw: number
  pitch: number
}

const isJoystickTouch = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  return !!el?.closest('#virtual-joystick')
}

const onTouchStart =
  (state: TouchState) =>
  (e: TouchEvent): void => {
    if (state.touchId !== null) return
    const touch = e.changedTouches[0]
    if (!touch || isJoystickTouch(e.target)) return
    state.touchId = touch.identifier
    state.lastX = touch.clientX
    state.lastY = touch.clientY
  }

const onTouchMove =
  (look: Look, state: TouchState) =>
  (e: TouchEvent): void => {
    if (state.touchId === null) return
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === state.touchId
    )
    if (!touch) return
    const dx = touch.clientX - state.lastX
    const dy = touch.clientY - state.lastY
    state.lastX = touch.clientX
    state.lastY = touch.clientY
    look.yaw += (dx / window.innerWidth) * (Math.PI / 2) // full swipe = 90°
    look.pitch -= (dy / window.innerHeight) * (Math.PI / 2)
  }

const onTouchEnd =
  (state: TouchState) =>
  (e: TouchEvent): void => {
    if (state.touchId === null) return
    const found = Array.from(e.changedTouches).some(
      (t) => t.identifier === state.touchId
    )
    if (!found) return
    state.touchId = null
  }

export function createCameraTouchController() {
  const look: Look = { yaw: 0, pitch: 0 }
  const state: TouchState = { touchId: null, lastX: 0, lastY: 0 }

  const ts = onTouchStart(state)
  const tm = onTouchMove(look, state)
  const te = onTouchEnd(state)

  document.addEventListener('touchstart', ts, { passive: true })
  document.addEventListener('touchmove', tm, { passive: true })
  document.addEventListener('touchend', te, { passive: true })
  document.addEventListener('touchcancel', te, { passive: true })

  return {
    consumeLook: () => {
      const delta = { yaw: look.yaw, pitch: look.pitch }
      look.yaw = 0
      look.pitch = 0
      return delta
    },
    destroy() {
      document.removeEventListener('touchstart', ts)
      document.removeEventListener('touchmove', tm)
      document.removeEventListener('touchend', te)
      document.removeEventListener('touchcancel', te)
    }
  }
}
