# Tag Components

```JavaScript
// Tag components - just empty objects
const Player = {}
const Enemy = {}
const Alive = {}
const Dead = {}
const Grounded = {}
const Flying = {}

// Add tags like any component
addComponent(world, entity, Player)
addComponent(world, entity, Alive)

// Query by tags
const players = query(world, [Player, Alive])
const enemies = query(world, [Enemy, Not(Dead)])
```
