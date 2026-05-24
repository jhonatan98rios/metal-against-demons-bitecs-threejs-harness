# Game Loop

The game loop runs all systems in order:

```JavaScript
// Define your system pipeline
const systems = [
  timeSystem,      // Update delta time first
  inputSystem,     // Read player input
  aiSystem,        // AI decisions
  movementSystem,  // Apply velocities
  gravitySystem,   // Apply gravity
  collisionSystem, // Handle collisions
  cleanupSystem,   // Remove dead entities
  renderSystem,    // Draw everything
]

// Run all systems
const runSystems = (world) => {
  for (const system of systems) {
    system(world)
  }
}

// Game loop
const loop = () => {
  runSystems(world)
  requestAnimationFrame(loop)
}
loop()
```

# Fixed Timestep
For deterministic physics, use a fixed timestep with accumulator:

```JavaScript
const FIXED_STEP = 1 / 60 // 60 updates per second
let accumulator = 0

const fixedGameLoop = () => {
  const now = performance.now()
  const frameTime = (now - world.time.then) / 1000
  world.time.then = now

  accumulator += frameTime

  // Run physics at fixed rate (may run multiple times per frame)
  while (accumulator >= FIXED_STEP) {
    physicsSystem(world, FIXED_STEP)
    accumulator -= FIXED_STEP
  }

  // Render with interpolation for smoothness
  const alpha = accumulator / FIXED_STEP
  renderSystem(world, alpha)

  requestAnimationFrame(fixedGameLoop)
}
```