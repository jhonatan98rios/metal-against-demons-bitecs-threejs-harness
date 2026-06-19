# Steering Behaviors

Entities seek toward targets. Classic AI pattern: calculate desired velocity, steer toward it with limited force.

```JavaScript

// Components
const Position = { x: [], y: [] }
const Velocity = { vx: [], vy: [] }
const Seek = { targetX: [], targetY: [] }
const MaxSpeed = { value: [] }
const MaxForce = { value: [] }

// Seek system - steer toward target
const seekSystem = (world) => {
  for (const eid of query(world, [Position, Velocity, Seek])) {
    // Desired velocity toward target
    let dx = Seek.targetX[eid] - Position.x[eid]
    let dy = Seek.targetY[eid] - Position.y[eid]

    // Normalize and scale to max speed
    const dist = Math.hypot(dx, dy)
    if (dist > 0) {
      dx = (dx / dist) * MaxSpeed.value[eid]
      dy = (dy / dist) * MaxSpeed.value[eid]
    }

    // Steering = desired - current
    let sx = dx - Velocity.vx[eid]
    let sy = dy - Velocity.vy[eid]

    // Limit steering force
    const force = Math.hypot(sx, sy)
    if (force > MaxForce.value[eid]) {
      sx = (sx / force) * MaxForce.value[eid]
      sy = (sy / force) * MaxForce.value[eid]
    }

    Velocity.vx[eid] += sx
    Velocity.vy[eid] += sy
  }
}

```
