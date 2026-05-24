# Component Definition (Schema-less)

Define components as Plain Objects with arrays.
The game uses simple SoA components for position, velocity, health, and more:

*Rule: Always use the entity ID (eid) as the array index.*

```JavaScript
// SoA component - recommended for performance
const Position = {
  x: [] as number[],
  y: [] as number[],
}

const Velocity = {
  x: [] as number[],
  y: [] as number[],
}

const Health = {
  current: [] as number[],
  max: [] as number[],
}

// Access data by eid ID
Position.x[eid] = 100
Position.y[eid] = 200
Health.current[eid] = 100
Health.max[eid] = 100
```

