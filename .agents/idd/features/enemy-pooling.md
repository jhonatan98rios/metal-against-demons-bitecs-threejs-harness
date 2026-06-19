# Feature: Enemy Object Pooling with Active Component

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Pre-allocate N enemy entities at startup with an `Active` flag, enabling acquire/release pooling to avoid GC pressure from creating/destroying entities at runtime. Support spawning 1000+ enemies.

## Acceptance Criteria

- [x] **AC1**: `Active` shared component with `isActive` (0/1) — entities with `isActive=0` are skipped by systems.
- [x] **AC2**: `createEnemyPool(world, poolSize)` pre-allocates N entities with `Active`, `Enemy`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow` components, all set to `Active=0`.
- [x] **AC3**: Pool provides `acquire()` returning an inactive EID (O(1) via free list) and `release(eid)` marking it inactive and returning it to the pool.
- [x] **AC4**: `createRenderSystem` skips inactive entities and hides/shows mesh via `object.visible`.
- [x] **AC5**: `createAnimationSystem` skips inactive entities.
- [x] **AC6**: `setupApparition(world: World, eid: number, x, z, facingLeft)` function resets all components on an existing entity (for reuse from pool).
- [x] **AC7**: `createApparition` remains as a convenience that calls `setupApparition` on a freshly created entity.
- [x] **AC8**: `main.ts` uses pool + `setupApparition` to spawn enemies, supporting 1000+ without per-spawn allocation.

## Details

### Constraints

- Pool uses a `freeList: number[]` stack for O(1) acquire/release — no linear scans.
- `Active` is a shared component (not enemy-specific) so other pooled objects (particles, items) can reuse it.
- Systems check `Active.isActive[eid] === 0` without requiring Active in the query — entities without Active (like player) are unaffected.
- The render system's `getOrCreateRenderObject` lazy mesh creation stays unchanged; inactive entities simply hide their mesh.
- Mesh creation only happens once per entity (on first activation), then toggles visibility on subsequent activate/deactivate cycles.

### Out of Scope

- No automatic pool resizing or garbage collection.
- No pool per enemy type — single homogeneous pool for all enemies.
- No particle or item pooling (Active component enables it later).
- No spatial partitioning or culling.

---

## Dependencies

### Feature Dependencies

- `Active` component (new, shared).
- Existing `Enemy`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow` components.
- Existing `createRenderSystem` and `createAnimationSystem`.

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- Pool: O(1) acquire/release via free list.
- Render system: still O(n) over all entities, but skips inactive with a cheap `isActive === 0` guard.
- Mesh creation: N meshes created over time (one per pool slot) — no per-frame allocation.
- Target: 1000+ active enemies at stable framerate.

### Security

- Not applicable.

### Backward Compatibility

- `Active` check is additive — entities without `Active` are processed normally.
- `createApparition` signature unchanged.
- Existing `setupApparition` refactor is internal — external callers use `createApparition` as before.

---

## API Contract (if applicable)

```text
// Active component
Active.isActive[eid] = 0 | 1

// Pool factory
function createEnemyPool(world: World, poolSize: number): {
  acquire(): number       // returns -1 if pool exhausted
  release(eid: number): void
}

// Setup function (reuses existing entity)
function setupApparition(eid: number, x: number, z: number, facingLeft: boolean): void

// createApparition now delegates to setupApparition
function createApparition(world: World, x: number, z: number, facingLeft?: boolean): number
```

---

## Glossary

| Location                                      | Type | Description                                                              |
| --------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| `src/game/core/shared/components/Active.ts`   | file | New `Active` shared component.                                           |
| `src/game/core/enemies/pool/enemyPool.ts`     | file | `createEnemyPool()` factory with free list.                              |
| `src/game/core/enemies/entity.ts`             | file | Refactored: `setupApparition()` extracted, `createApparition` delegates. |
| `src/game/rendering/createRenderSystem.ts`    | file | Modified: hide/show mesh based on Active.                                |
| `src/game/rendering/createAnimationSystem.ts` | file | Modified: skip inactive entities.                                        |
| `src/game/main.ts`                            | file | Modified: use pool instead of direct creation.                           |
