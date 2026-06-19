# Feature: Enemy Boids Movement

> **Status**: `in-progress`

This file is the primary execution and maintenance contract for the feature.

## What

Drive enemy entity movement using Craig Reynolds' boids algorithm — separation, alignment, cohesion — plus a pursuit force toward the player. Single centralized BitECS system updates `Velocity` each frame; existing worker pool integrates velocity into position.

## Acceptance Criteria

- [x] **AC1**: New `Boids` component with per-entity fields: `maxSpeed`, `perceptionRadius`, `separationRadius`, `separationWeight`, `alignmentWeight`, `cohesionWeight`, `pursuitWeight`.
- [x] **AC2**: Single `boidsSystem` factory in `src/game/core/enemies/systems/` that queries `[Active, Enemy, Position, Velocity, Boids]` and updates `Velocity.x/z` for each active enemy.
- [x] **AC3**: Separation force: for each enemy, detect neighbors within `separationRadius`, push away proportional to inverse distance.
- [x] **AC4**: Alignment force: average velocity of neighbors within `perceptionRadius`, steer toward that average.
- [x] **AC5**: Cohesion force: average position of neighbors within `perceptionRadius`, steer toward that center.
- [x] **AC6**: Pursuit force: steer toward `world.playerEid` position (read from `Position` component).
- [x] **AC7**: Combined force is clamped to `maxSpeed` magnitude and written to `Velocity.x/z`. `Velocity.y` is never touched.
- [x] **AC8**: Player entity is never queried or modified by the boids system — no boids components on player, no velocity override.
- [x] **AC9**: System runs every frame in `main.ts` game loop, positioned **before** the worker pool update (worker pool integrates velocity → position).
- [x] **AC10**: Inactive enemies (`Active.isActive === 0`) are skipped by the query.
- [x] **AC11**: Existing `setupApparition()` and `createApparition()` add `Boids` component + defaults. Pool entities also get `Boids` component.
- [x] **AC12**: Top-down 2.5D constraint: all boids calculations operate on x/z plane only. `Position.y` is never read or written.
- [x] **AC13**: Default boids parameters defined as constants: `MAX_SPEED=15`, `PERCEPTION_RADIUS=8`, `SEPARATION_RADIUS=3`, `SEPARATION_WEIGHT=1.5`, `ALIGNMENT_WEIGHT=1.0`, `COHESION_WEIGHT=1.0`, `PURSUIT_WEIGHT=2.0`.

## Details

### Constraints

- **Single system only**: All boids logic lives in one file (`boidsSystem.ts` under `core/enemies/systems/`). No splitting into sub-systems or helpers that live outside that file (internal helpers are fine).
- **ECS query-driven**: Uses `query(world, [Active, Enemy, Position, Velocity, Boids])` — no manual entity iteration.
- **Worker pool compatibility**: The boids system only writes `Velocity`. The existing worker pool (`createWorkerPool`) already queries `[Active, Animation, Velocity]` and integrates `Velocity` → `Position`. This separation keeps boids logic main-threaded and the velocity integration parallelized.
- **Game loop order**: Must be `controller.update(dt)` → `boidsSystem.update(dt)` → `animationSystem.update(dt)` (worker pool). Player controller runs first (sets player pos), then boids sets enemy velocity, then worker pool moves everything.
- **Layer boundary**: `core/enemies/systems/` is a `core/` module — must only import from `bitecs` and other `core/` components. No imports from `gameplay/` or `rendering/`.
- **Per-function complexity ≤ 8** (lizard rule) — may require internal helper functions for each boids force.
- **No rendering changes**: Reuses existing `createRenderSystem()`, sprite system, animation system.
- **No collision with player**: Boids forces only compute from enemy→enemy and enemy→player. No force pushes the player.
- **No Y-axis**: Movement is on x/z ground plane. `Position.y` is set by spawn logic and never changed by boids.
- **SharedArrayBuffer compatible**: `Boids` component uses `sab.f32()` like other numeric components, enabling future worker offload.

### Out of Scope

- No obstacle avoidance (walls, level geometry).
- No player collision or damage — boids purely controls movement.
- No leader-based flocking or hierarchy.
- No spawning/wave management — uses existing enemy pool.
- No boids visual debugging (debug overlay, gizmos).
- No dynamic boids parameter tuning at runtime (UI sliders, etc.).
- No per-enemy boids variation beyond what `Boids` component fields allow.

---

## Dependencies

### Feature Dependencies

| Dependency                          | Relationship                                                   |
| ----------------------------------- | -------------------------------------------------------------- |
| `Enemy` tag component               | Query filter — boids only affects enemy entities.              |
| `Active` component                  | Query filter — skip inactive/pooled enemies.                   |
| `Position` component                | Read neighbor positions and player position for force calc.    |
| `Velocity` component                | Write target velocity; read neighbor velocities for alignment. |
| `Boids` component (new)             | Per-entity boids parameters.                                   |
| `setupApparition()` in `entity.ts`  | Must be updated to `addComponent(world, eid, Boids)` + setup.  |
| `createApparition()` in `entity.ts` | Must be updated to `addComponent(world, eid, Boids)` + setup.  |
| `main.ts` game loop                 | Must wire `boidsSystem.update(dt)` before worker pool update.  |
| Worker pool (`createWorkerPool`)    | Already integrates velocity → position — no changes needed.    |

### External Dependencies

- `bitecs` — `query`, `addComponent`, `World`.
- `sab` from `src/game/core/shared/constants.ts` — SharedArrayBuffer-backed component arrays.

---

## Technical Considerations

### Performance

- Boids is O(n²) in the worst case (each enemy checks all others). With 1000 enemies, that's ~1M distance checks per frame.
- **Mitigation**: The perception radius limits the effective neighborhood — but the naive loop still iterates all enemies for each enemy.
- **Mitigation**: `separationRadius` (smaller, ~3 units) can early-exit distance checks — if `distance > perceptionRadius`, skip all three forces.
- **Spatial optimization out of scope**: Grid/spatial hash partitioning is not required for this feature.
- Boids runs on main thread (not worker pool) because it reads/writes across all enemy entities and neighbor data is shared.
- 1000 enemies × 3 neighborhood loops × 1000 checks ≈ 3M distance checks per frame. At 60fps this is ~50M/s. `Math.hypot` is fast but measurable. Consider `dx*dx + dz*dz` compare against squared radii to avoid `Math.sqrt` in inner loop.

### Security

- Not applicable — all computation is local client-side.

### Backward Compatibility

- `Velocity` component is already on enemy entities — boids overwrites `Velocity.x/z` each frame, same way player controller resets player velocity.
- `Enemy` component unchanged.
- Existing worker pool query `[Active, Animation, Velocity]` continues to work without modification.
- Existing `setupApparition()` callers need no signature change — only internal logic added.
- New `Boids` component is additive — no shared component changes.

---

## API Contract (if applicable)

```text
// New Boids component
import { MAX_ENTITIES, sab } from '../constants'

export const Boids = {
  maxSpeed: sab.f32(MAX_ENTITIES),
  perceptionRadius: sab.f32(MAX_ENTITIES),
  separationRadius: sab.f32(MAX_ENTITIES),
  separationWeight: sab.f32(MAX_ENTITIES),
  alignmentWeight: sab.f32(MAX_ENTITIES),
  cohesionWeight: sab.f32(MAX_ENTITIES),
  pursuitWeight: sab.f32(MAX_ENTITIES)
}

// Default boids params (used in entity setup)
export const BOIDS_DEFAULTS = {
  MAX_SPEED: 15,
  PERCEPTION_RADIUS: 8,
  SEPARATION_RADIUS: 3,
  SEPARATION_WEIGHT: 1.5,
  ALIGNMENT_WEIGHT: 1.0,
  COHESION_WEIGHT: 1.0,
  PURSUIT_WEIGHT: 2.0
}

// New component to add to enemy entity setup:
addComponent(world, eid, Boids)
Boids.maxSpeed[eid] = BOIDS_DEFAULTS.MAX_SPEED
Boids.perceptionRadius[eid] = BOIDS_DEFAULTS.PERCEPTION_RADIUS
Boids.separationRadius[eid] = BOIDS_DEFAULTS.SEPARATION_RADIUS
Boids.separationWeight[eid] = BOIDS_DEFAULTS.SEPARATION_WEIGHT
Boids.alignmentWeight[eid] = BOIDS_DEFAULTS.ALIGNMENT_WEIGHT
Boids.cohesionWeight[eid] = BOIDS_DEFAULTS.COHESION_WEIGHT
Boids.pursuitWeight[eid] = BOIDS_DEFAULTS.PURSUIT_WEIGHT

// Boids system — called each frame before worker pool
import { query, World } from 'bitecs'
import { Active } from '../../shared/components/Active'
import { Enemy } from '../components/Enemy'
import { Position } from '../../shared/components/Position'
import { Velocity } from '../../shared/components/Velocity'
import { Boids } from '../../shared/components/Boids'

interface BoidsWorld extends World {
  playerEid?: number
}

export function createBoidsSystem(world: World) {
  const boidsWorld = world as BoidsWorld

  return {
    update(dt: number) {
      const playerEid = boidsWorld.playerEid
      if (typeof playerEid !== 'number') return

      const entities = query(world, [Active, Enemy, Position, Velocity, Boids])

      for (const eid of entities) {
        if (Active.isActive[eid] === 0) continue

        // Compute boids forces...
        // Write Velocity.x[eid], Velocity.z[eid]
      }
    }
  }
}
```

---

## Glossary

| Location                                                          | Type     | Description                                                                        |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `.agents/idd/features/enemy-boids.md`                             | file     | This feature spec.                                                                 |
| `src/game/core/shared/components/Boids.ts`                        | file     | New `Boids` component definition with 7 per-entity f32 fields + constants.         |
| `src/game/core/enemies/systems/boidsSystem.ts`                    | file     | New boids system: `createBoidsSystem(world)` factory, returns `{ update(dt) }`.    |
| `src/game/core/enemies/systems/boidsSystem.ts::createBoidsSystem` | function | Factory that wires `world.playerEid` access and returns the update closure.        |
| `src/game/core/enemies/systems/boidsSystem.ts::computeSeparation` | function | (internal) Separation force: push away from neighbors within separationRadius.     |
| `src/game/core/enemies/systems/boidsSystem.ts::computeAlignment`  | function | (internal) Alignment force: average velocity of neighbors within perceptionRadius. |
| `src/game/core/enemies/systems/boidsSystem.ts::computeCohesion`   | function | (internal) Cohesion force: average position of neighbors within perceptionRadius.  |
| `src/game/core/enemies/systems/boidsSystem.ts::computePursuit`    | function | (internal) Pursuit force: steer toward player position.                            |
| `src/game/core/enemies/systems/boidsSystem.ts::clampVelocity`     | function | (internal) Clamp combined force magnitude to maxSpeed, write to Velocity.x/z.      |
| `src/game/core/enemies/entity.ts::setupApparition`                | function | Updated to add `Boids` component + defaults.                                       |
| `src/game/core/enemies/entity.ts::createApparition`               | function | Updated to add `Boids` component + defaults.                                       |
| `src/game/core/enemies/pool/enemyPool.ts::createEnemyPool`        | function | Updated to add `Boids` component in pool component list.                           |
| `src/game/main.ts::start`                                         | function | Updated to create boids system and wire into game loop before worker pool.         |
| `src/game/core/shared/constants.ts`                               | file     | No changes needed — existing `sab.f32()` used for Boids component.                 |
| `src/game/systems/processors.ts`                                  | file     | No changes needed — existing velocity integration moves boids-driven entities.     |
| `src/game/systems/createWorkerPool.ts`                            | file     | No changes needed — worker pool already integrates velocity for all animated ents. |
