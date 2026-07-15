interface TouchState {
  touchId: number | null
  lastX: number
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
  }

const onTouchMove =
  (angle: { value: number }, state: TouchState) =>
  (e: TouchEvent): void => {
    if (state.touchId === null) return
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === state.touchId
    )
    if (!touch) return
    const dx = touch.clientX - state.lastX
    state.lastX = touch.clientX
    angle.value += (dx / window.innerWidth) * (Math.PI / 2) // full swipe = 90°
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
  const angle = { value: 0 }
  const state: TouchState = { touchId: null, lastX: 0 }

  const ts = onTouchStart(state)
  const tm = onTouchMove(angle, state)
  const te = onTouchEnd(state)

  document.addEventListener('touchstart', ts, { passive: true })
  document.addEventListener('touchmove', tm, { passive: true })
  document.addEventListener('touchend', te, { passive: true })
  document.addEventListener('touchcancel', te, { passive: true })

  return {
    getAngle: () => angle.value,
    destroy() {
      document.removeEventListener('touchstart', ts)
      document.removeEventListener('touchmove', tm)
      document.removeEventListener('touchend', te)
      document.removeEventListener('touchcancel', te)
    }
  }
}
