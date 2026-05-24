# Top-Down Movement

WASD controls with 8-directional movement. Input is stored in a component, then processed by the movement system.


```JavaScript

// Components
const Position = { x: [], y: [] }
const Input = { x: [], y: [] }  // -1 to 1
const Speed = { value: [] }
const Player = {}  // Tag

// Input system - read keyboard state
const inputSystem = (world) => {
  for (const eid of query(world, [Input, Player])) {
    Input.x[eid] = 0
    Input.y[eid] = 0

    if (keys['KeyW']) Input.y[eid] -= 1
    if (keys['KeyS']) Input.y[eid] += 1
    if (keys['KeyA']) Input.x[eid] -= 1
    if (keys['KeyD']) Input.x[eid] += 1

    // Normalize diagonal
    const len = Math.hypot(Input.x[eid], Input.y[eid])
    if (len > 1) {
      Input.x[eid] /= len
      Input.y[eid] /= len
    }
  }
}

// Movement system
const movementSystem = (world) => {
  for (const eid of query(world, [Position, Input, Speed])) {
    Position.x[eid] += Input.x[eid] * Speed.value[eid]
    Position.y[eid] += Input.y[eid] * Speed.value[eid]
  }
}
```

