# Health & Damage

Combat basics: health pools, taking damage, death handling. Uses a queue pattern to safely defer entity removal.

```JavaScript
// Components
const Health = { current: [], max: [] }
const Damage = { amount: [] }  // Incoming damage
const Dead = {}  // Tag

// Queue for deferred removals (never mutate ECS in observers!)
const removalQueue: number[] = []

// Apply damage system
const damageSystem = (world) => {
  for (const eid of query(world, [Health, Damage])) {
    Health.current[eid] -= Damage.amount[eid]

    // Clear damage after applying
    removeComponent(world, eid, Damage)

    // Check for death
    if (Health.current[eid] <= 0) {
      Health.current[eid] = 0
      addComponent(world, eid, Dead)
    }
  }
}

// Observer only queues removal and spawns effects (no ECS mutation!)
observe(world, onAdd(Dead), (eid) => {
  spawnParticles(Position.x[eid], Position.y[eid], 10)
  removalQueue.push(eid)
})

// Drain removal queue at a controlled point in game loop
const cleanupSystem = (world) => {
  while (removalQueue.length > 0) {
    const eid = removalQueue.pop()!
    removeEntity(world, eid)
  }
}

// Deal damage helper
const dealDamage = (target, amount) => {
  if (hasComponent(world, target, Health)) {
    addComponent(world, target, Damage)
    Damage.amount[target] = amount
  }
}
```