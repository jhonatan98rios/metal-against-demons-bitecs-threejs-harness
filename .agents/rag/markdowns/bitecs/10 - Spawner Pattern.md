# Spawner Pattern

Entities that spawn other entities on a timer. Common for enemy waves, particle emitters, projectile launchers.

```JavaScript
// Components
const Position = { x: [], y: [] }
const Spawner = {
  interval: [],   // frames between spawns
  timer: [],      // current countdown
  prefab: []      // what to spawn (entity ID)
}

// Spawner system
const spawnerSystem = (world) => {
  for (const eid of query(world, [Spawner, Position])) {
    Spawner.timer[eid]--

    if (Spawner.timer[eid] <= 0) {
      // Reset timer
      Spawner.timer[eid] = Spawner.interval[eid]

      // Spawn entity at spawner position
      const spawned = addEntity(world)
      addComponent(world, spawned, Position)
      addComponent(world, spawned, Velocity)

      Position.x[spawned] = Position.x[eid]
      Position.y[spawned] = Position.y[eid]

      // Random direction
      const angle = Math.random() * Math.PI * 2
      Velocity.vx[spawned] = Math.cos(angle) * 2
      Velocity.vy[spawned] = Math.sin(angle) * 2
    }
  }
}

// Setup: create a spawner
const spawner = addEntity(world)
addComponent(world, spawner, Position)
addComponent(world, spawner, Spawner)
Position.x[spawner] = 200
Position.y[spawner] = 150
Spawner.interval[spawner] = 30
Spawner.timer[spawner] = 30
```