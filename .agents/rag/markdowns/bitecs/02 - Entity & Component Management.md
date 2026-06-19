# Entity & Component Management

The game uses simple SoA components for position, velocity, health, and more:

```JavaScript
import { createWorld, addEntity, addComponent } from 'bitecs'

const world = createWorld()
const eid = addEntity(world)

addComponent(world, Position, eid)
addComponent(world, Velocity, eid)

// Set values using the EID
Position.x[eid] = 0
Velocity.x[eid] = 1
```
