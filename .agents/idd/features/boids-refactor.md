# Feature: Boids System Refactoring

> **Status**: `draft`

This file is the primary execution and maintenance contract for the feature.

## What

Refactor `boidsSystem.ts` to eliminate global mutable state, extract pure functions, remove dead code, align naming, and bring the implementation inline with the `enemy-boids.md` feature spec — in small, testable steps.

## Acceptance Criteria

- [ ] **AC1**: All 21 module-level `let` variables eliminated or encapsulated in a per-instance context object.
- [ ] **AC2**: `processNeighborPair`, `computePursuitDirection`, `normaliseFlockingForces` converted to pure functions returning values instead of mutating globals.
- [ ] **AC3**: `_debugLodSkipped` removed (never incremented — dead metric).
- [ ] **AC4**: Debug metrics gated behind a flag (`DEBUG_BOIDS` constant) and stripped from hot path core computation.
- [ ] **AC5**: `clampVelocity` returns clamped `{x, z}` instead of writing `Velocity` component directly.
- [ ] **AC6**: `processEntity` complexity reduced below lizard limit of 8 via extracted pure helpers.
- [ ] **AC7**: Naming normalized: `normalise` → `normalize` (American English), `_sepX/_sepZ` → full names, `_cohX/_cohZ` → full names.
- [ ] **AC8**: `_gridBuckets` global grid moved into `createBoidsSystem` closure or context object.
- [ ] **AC9**: `BOID_TERMS` type cast eliminated (use `as const` tuple compatible with `query`).
- [ ] **AC10**: `percRadSq` renamed to `perceptionRadSq` for clarity.
- [ ] **AC11**: Glossary in `enemy-boids.md` updated to match actual function names after refactor.
- [ ] **AC12**: No externally observable behavior changes — refactored system produces identical velocity output.
- [ ] **AC13**: File size reduced from 373 lines (target ~250 after simplification).

## Details

### Constraints

- **No behavior change**: Every refactor step must preserve exact boids output. Forces, weights, LOD, pursuit scaling — all identical.
- **One step per PR**: Each task below is independently reviewable and testable via `pnpm validate:full`.
- **Pure functions first**: Move to pure computation before restructuring encapsulation.
- **Dead code removal**: `_debugLodSkipped` removed in step 1 — no reason to keep dead metrics.
- **Single file**: Refactored boids logic stays in `boidsSystem.ts` (per existing feature constraint).
- **Per-function complexity ≤ 8**: After each step, verify with lizard.
- **No new dependencies**: Only `bitecs` — no lodash, no utility libs.

### Out of Scope

- No algorithm changes (no spatial hash, no staggered updates, no obstacle avoidance).
- No test files (Vitest setup exists but no tests written — step 0 would be adding tests, but out of scope for this refactor).
- No runtime boids parameter tuning UI.
- No worker offloading.
- No changes to `Boids` component or `BOIDS_DEFAULTS`.
- No changes outside `src/game/core/enemies/systems/boidsSystem.ts` and `.agents/idd/features/enemy-boids.md`.

---

## Tasks (small, testable steps)

### Task 1: Remove dead code — `_debugLodSkipped` [done]

**What**: Remove all references to `_debugLodSkipped`. Variable declared on line 104 but never incremented. LOD attenuates radius, doesn't skip.

**Current state of file (relevant lines)**:

- Line 104: `let _debugLodSkipped = 0`
- Line 300: `_debugLodSkipped = 0` (in resetDebugCounters)
- Line 320: `\${_debugLodSkipped}` in console.log template
- Line 326: `_debugLodSkipped = 0` (reset at end of logDebugMetrics)

**Changes**: Delete all 4 lines referencing `_debugLodSkipped`. No other edits. Zero behavior change — this variable was never used for any decision or side effect.

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 2: Extract `clampVelocity` to pure function [done]

**What**: Change `clampVelocity(eid, x, z, maxSpd)` to return `{x, z}` instead of writing `Velocity.x[eid]`/`Velocity.z[eid]`. Caller writes the result to `Velocity` after return.

**Before**:

```ts
function clampVelocity(
  eid: number,
  totalX: number,
  totalZ: number,
  maxSpd: number
): void {
  const magSq = totalX * totalX + totalZ * totalZ
  if (magSq > maxSpd * maxSpd) {
    const mag = Math.sqrt(magSq)
    Velocity.x[eid] = (totalX / mag) * maxSpd
    Velocity.z[eid] = (totalZ / mag) * maxSpd
    return
  }
  Velocity.x[eid] = totalX
  Velocity.z[eid] = totalZ
}
```

**After**:

```ts
function clampVelocity(
  totalX: number,
  totalZ: number,
  maxSpd: number
): { x: number; z: number } {
  const magSq = totalX * totalX + totalZ * totalZ
  if (magSq > maxSpd * maxSpd) {
    const mag = Math.sqrt(magSq)
    return { x: (totalX / mag) * maxSpd, z: (totalZ / mag) * maxSpd }
  }
  return { x: totalX, z: totalZ }
}
```

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 3: Convert `computePursuitDirection` to pure function [done]

**What**: Change from mutating `_pursuitX`/`_pursuitZ` globals to returning `{x, z}`.

**Before**:

```ts
function computePursuitDirection(
  myX: number,
  myZ: number,
  playerEid: number,
  distToPlayer: number
): void {
  _pursuitX = 0
  _pursuitZ = 0
  if (distToPlayer <= 0.01) return
  _pursuitX = (Position.x[playerEid] - myX) / distToPlayer
  _pursuitZ = (Position.z[playerEid] - myZ) / distToPlayer
}
```

**After**:

```ts
function computePursuitDirection(
  myX: number,
  myZ: number,
  playerX: number,
  playerZ: number,
  distToPlayer: number
): { x: number; z: number } {
  if (distToPlayer <= 0.01) return { x: 0, z: 0 }
  return {
    x: (playerX - myX) / distToPlayer,
    z: (playerZ - myZ) / distToPlayer
  }
}
```

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 4: Convert `normaliseFlockingForces` to pure function + rename [done]

**What**: Change from mutating `_alignForceX/_alignForceZ/_cohForceX/_cohForceZ` globals to returning normalized values. Rename `normalise` → `normalize` (American English).

**Before**:

```ts
function normaliseFlockingForces(eid: number, myX: number, myZ: number): void {
  _alignForceX = 0
  _alignForceZ = 0
  _cohForceX = 0
  _cohForceZ = 0
  if (_neighborCount <= MIN_NEIGHBORS) return
  const invCount = 1 / _neighborCount
  _alignForceX = _alignX * invCount * Boids.alignmentWeight[eid]
  _alignForceZ = _alignZ * invCount * Boids.alignmentWeight[eid]
  _cohForceX = (_cohX * invCount - myX) * Boids.cohesionWeight[eid]
  _cohForceZ = (_cohZ * invCount - myZ) * Boids.cohesionWeight[eid]
}
```

**After**: Returns `{ align: { x, z }, cohesion: { x, z } }`. Caller provides all 8 inputs and reads the result.

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 5: Extract force accumulator from globals into local scope in `processEntity` [done]

**What**: After tasks 2-4, replace module-level `_sepX/_sepZ/_alignX/.../_cohX/.../_pursuitX/...` (13 vars) with locals declared inside the outer `update()` loop. Pass them through pure functions as parameters. Also remove `resetAccumulators()` helper — no longer needed if all accumulators are scoped to one update call.

**Why**: Primary source of global mutable state (21 out of 21). Eliminates cross-function side effects.

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 6: Move spatial grid (`_gridBuckets`, `_usedCells`, `_recycled`) into `createBoidsSystem` closure [done]

**What**: Instead of module-level arrays, allocate them inside the factory so each system instance has its own grid. Update `buildSpatialGrid` to use closure-scoped variables.

**Before**:

```ts
const _gridBuckets: (number[] | undefined)[] = []
_gridBuckets.length = GRID_CELL_COUNT
const _usedCells: number[] = []
const _recycled: number[][] = []
function buildSpatialGrid(entities: readonly number[]): void {
  // uses _gridBuckets, _usedCells, _recycled
}
```

**After**:

```ts
export function createBoidsSystem(world: World) {
  const gridBuckets: (number[] | undefined)[] = []
  gridBuckets.length = GRID_CELL_COUNT
  const usedCells: number[] = []
  const recycled: number[][] = []
  return {
    update() { ... buildSpatialGrid(entities using closure vars) },
    buildSpatialGrid, // expose if needed externally — currently private
    processEntity,   // same for this one
    shouldTick       // same
  }
}
```

**Validation**: `pnpm lint && pnpm typecheck` passes with zero errors.

---

### Task 7: Move timing state (`_accumMs`, `_lastTime`) into closure [done]

Same pattern as task 6 — move to `createBoidsSystem`. Enables multiple instances.

**Validation**: `pnpm lint && pnpm typecheck` passes.

---

### Task 8: Move debug metrics into closure with `DEBUG_BOIDS` flag guard

Move `_debugEntityCount`, `_debugTotalNeighbors`, `_debugMaxNeighbors`, `_debugDuration`, `_debugLastLog` to closure. Add `const DEBUG_BOIDS = false` at top of file. Guard hot-path calls in `update()` and `logDebugMetrics()`.

**Validation**: `pnpm lint && pnpm typecheck` passes.

---

### Task 9: Fix `BOID_TERMS` type cast [done]

Replace `as unknown as Parameters<typeof query>[1]` with spread or proper typing.

**Before**:

```ts
const BOID_TERMS = [Active, Enemy, Position, Velocity, Boids] as const
query(world, BOID_TERMS as unknown as Parameters<typeof query>[1])
```

**After**:

```ts
const BOID_TERMS = [Active, Enemy, Position, Velocity, Boids]
query(world, [...BOID_TERMS])
```

**Validation**: `pnpm lint && pnpm typecheck` passes.

---

### Task 10: Rename `percRadSq` → `perceptionRadSq`

Parameter rename in `processNeighborPair` + all call sites.

**Validation**: `pnpm lint && pnpm typecheck` passes.

---

### Task 11: Update `enemy-boids.md` glossary to match refactored function names

After refactor, update `.agents/idd/features/enemy-boids.md` glossary symbols to reflect actual code (e.g., `normalizeFlockingForces`, new signatures).

**Validation**: Verify all glossary anchors resolve.

---

### Task 12: Final validation pass

Run `pnpm validate:full`. Confirm zero errors. Confirm lizard complexity ≤ 8 for all functions. Confirm no remaining module-level `let` (except `DEBUG_BOIDS`).

**Validation**: `pnpm validate:full` passes with zero warnings.

---

## Dependencies

| Dependency       | Relationship                                |
| ---------------- | ------------------------------------------- |
| `enemy-boids.md` | Glossary updated in Task 11 after refactor. |

### External Dependencies

- None — only `bitecs`.

---

## Technical Considerations

### Performance

- Tasks 2-4 introduce small object allocations (`{x, z}`). V8 optimizes this well; if profiling shows regression, inline objects as locals in Task 5.
- Task 5 (local accumulators) may be **faster** than global mutation — fewer cross-call side effects for optimizer.
- Task 8 (DEBUG flag) improves hot path by removing dead metric bookkeeping.
- Overall: neutral to slight positive performance impact.

### Security

- Not applicable.

### Backward Compatibility

- `createBoidsSystem(world)` signature unchanged. Return type `{ update() }` unchanged.
- `Velocity.x/z` written identically. Zero behavioral change — pure refactoring.

---

## API Contract (if applicable)

```text
// After refactor — external API unchanged
export function createBoidsSystem(world: World): { update(): void }
```
