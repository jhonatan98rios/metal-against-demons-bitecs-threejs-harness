# Query Pattern

The simplest query finds all entities with a set of components:

```JavaScript
import { query } from 'bitecs'

// Find all entities with Position
const positioned = query(world, [Position])

// Find all entities with Position AND Velocity
const moving = query(world, [Position, Velocity])

// Iterate over results
for (const entity of moving) {
  Position.x[entity] += Velocity.x[entity]
  Position.y[entity] += Velocity.y[entity]
}
```

# System Structure

Systems are just functions that query and update entities. Systems MUST follow this loop structure to ensure the model doesn't try to use forEach or other slow iterators.

```JavaScript
import { query } from 'bitecs'

// Movement system - updates positions based on velocity
const movementSystem = (world) => {
  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid]
    Position.y[eid] += Velocity.y[eid]
  }
}

// Gravity system - applies gravity to entities with mass
const gravitySystem = (world) => {
  const GRAVITY = 9.81
  for (const eid of query(world, [Velocity, Mass])) {
    Velocity.y[eid] += GRAVITY * Mass.value[eid]
  }
}

// Collision system - handles entity collisions
const collisionSystem = (world) => {
  const entities = query(world, [Position, Collider])

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]
      const b = entities[j]
      // Check collision between a and b...
    }
  }
}

// Player input system
const playerInputSystem = (world: World) => {
  const { input } = world

  for (const eid of query(world, [Player, Position, Velocity, Speed])) {
    const speed = Speed.value[eid]

    // Reset velocity
    Velocity.vx[eid] = 0
    Velocity.vy[eid] = 0

    // Apply input
    if (input.keys.w) Velocity.vy[eid] = -speed
    if (input.keys.s) Velocity.vy[eid] = speed
    if (input.keys.a) Velocity.vx[eid] = -speed
    if (input.keys.d) Velocity.vx[eid] = speed
  }
}
```

# Conditional Systems
Run systems only when certain conditions are met:

```TS
// Only run when game is not paused
const gameplayPipeline = (world) => {
  if (world.paused) return

  movementSystem(world)
  collisionSystem(world)
  aiSystem(world)
}

// Only run every N frames
let frameCount = 0
const throttledAI = (world) => {
  frameCount++
  if (frameCount % 3 !== 0) return  // Run every 3rd frame

  for (const eid of query(world, [AI])) {
    // Expensive AI calculations...
  }
}

// Phase-based systems
const renderPhase = (world) => {
  renderBackground(world)
  renderEntities(world)
  renderUI(world)
  renderDebug(world)
}
```  


# Delta Time
Use custom world context to pass delta time to systems:
```TS
// World with time context
const world = createWorld({
  time: {
    delta: 0,
    elapsed: 0,
    then: performance.now(),
  }
})

// Time system - updates delta and elapsed time
const timeSystem = (world) => {
  const now = performance.now()
  world.time.delta = (now - world.time.then) / 1000 // seconds
  world.time.elapsed += world.time.delta
  world.time.then = now
}

// Use delta time in movement (frame-rate independent)
const movementSystem = (world) => {
  const dt = world.time.delta

  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid] * dt
    Position.y[eid] += Velocity.y[eid] * dt
  }
}
```