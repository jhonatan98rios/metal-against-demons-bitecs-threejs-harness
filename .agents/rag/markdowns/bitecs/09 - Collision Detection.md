# Collision Detection

Simple circle-circle collision. When entities overlap, they bounce apart. Shows N×N query pattern.

```JavaScript
// Components
const Position = { x: [], y: [] }
const Velocity = { vx: [], vy: [] }
const Radius = { value: [] }

// Collision system - O(n²) broad phase
const collisionSystem = (world) => {
  const entities = query(world, [Position, Radius])

  for (let i = 0; i < entities.length; i++) {
    const a = entities[i]

    for (let j = i + 1; j < entities.length; j++) {
      const b = entities[j]

      const dx = Position.x[b] - Position.x[a]
      const dy = Position.y[b] - Position.y[a]
      const dist = Math.hypot(dx, dy)
      const minDist = Radius.value[a] + Radius.value[b]

      if (dist < minDist && dist > 0) {
        // Separate entities
        const overlap = (minDist - dist) / 2
        const nx = dx / dist
        const ny = dy / dist

        Position.x[a] -= nx * overlap
        Position.y[a] -= ny * overlap
        Position.x[b] += nx * overlap
        Position.y[b] += ny * overlap

        // Bounce velocities (simple)
        if (hasComponent(world, a, Velocity)) {
          Velocity.vx[a] = -nx * 2
          Velocity.vy[a] = -ny * 2
        }
      }
    }
  }
}
```
