const KEYBOARD_AXIS_MAP = [
  { key: 'w', axis: 'z', value: -1 },
  { key: 'arrowup', axis: 'z', value: -1 },

  { key: 's', axis: 'z', value: 1 },
  { key: 'arrowdown', axis: 'z', value: 1 },

  { key: 'a', axis: 'x', value: -1 },
  { key: 'arrowleft', axis: 'x', value: -1 },

  { key: 'd', axis: 'x', value: 1 },
  { key: 'arrowright', axis: 'x', value: 1 }
] as const

type Axis = {
  x: number
  z: number
}

const normalizeKey = (value: string) =>
  value === ' ' ? 'space' : value.toLowerCase()

const isDown = (key: string, keys: Record<string, boolean>) =>
  !!keys[normalizeKey(key)]

const getKeyboardAxis = (keys: Record<string, boolean>): Axis =>
  KEYBOARD_AXIS_MAP.reduce<Axis>(
    (axis, input) => {
      if (!isDown(input.key, keys)) {
        return axis
      }

      return {
        ...axis,
        [input.axis]: axis[input.axis] + input.value
      }
    },
    { x: 0, z: 0 }
  )

const getAxis = (keys: Record<string, boolean>, joystickVector: Axis): Axis => {
  const keyboardAxis = getKeyboardAxis(keys)

  const isKeyboardIdle = keyboardAxis.x === 0 && keyboardAxis.z === 0

  return isKeyboardIdle ? joystickVector : keyboardAxis
}

const setJoystick = (x: number, z: number, joystickVector: Axis) => {
  joystickVector.x = x
  joystickVector.z = z
}

const consumePressed = (key: string, pressed: Record<string, boolean>) => {
  const normalized = normalizeKey(key)
  const wasPressed = !!pressed[normalized]

  pressed[normalized] = false

  return wasPressed
}

export function createInput() {
  const keys: Record<string, boolean> = {}
  const pressed: Record<string, boolean> = {}
  const joystickVector: Axis = { x: 0, z: 0 }

  window.addEventListener('keydown', (e) => {
    const key = normalizeKey(e.key)

    keys[key] = true
    pressed[key] = true
  })

  window.addEventListener('keyup', (e) => {
    keys[normalizeKey(e.key)] = false
  })

  return {
    consumePressed: (key: string) => consumePressed(key, pressed),

    setJoystick: (x: number, z: number) => setJoystick(x, z, joystickVector),

    isDown: (key: string) => isDown(key, keys),

    getAxis: () => getAxis(keys, joystickVector)
  }
}
