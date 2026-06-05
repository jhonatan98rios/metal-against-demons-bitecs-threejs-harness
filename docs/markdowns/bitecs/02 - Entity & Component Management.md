# Entity & Component Management

The game uses simple SoA components for position, velocity, health, and more:

```JavaScript
import { createWorld, addEntity, addComponent } from 'bitecs'

const world = createWorld()
const eid = addEntity(world)

const Position = {
  x: [] as number[],
  y: [] as number[],
}

const Velocity = {
  x: [] as number[],
  y: [] as number[],
}

addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

// Set values using the EID
Position.x[eid] = 0
Velocity.x[eid] = 1
```
