# Feature: SharedArrayBuffer Backed Components

> **Status**: `complete`

Migrate all numeric component arrays from `[] as number[]` to `SharedArrayBuffer`-backed TypedArrays, enabling future multithreading with Web Workers for 10K+ enemies and thousands of bullets.

## Acceptance Criteria

- [x] **AC1**: `MAX_ENTITIES` constant defined at `src/game/core/shared/constants.ts` (`100000`).
- [x] **AC2**: All numeric component arrays migrated to typed SAB-backed arrays: - Flag fields (`isActive`, `isEnemy`, `isPlayer`, `isRenderable`, `row`) → `Uint8Array` (1 byte each) - Frame fields (`currentFrame`, `startFrame`, `endFrame`) → `Uint16Array` (2 bytes each) - Float fields (`x`, `y`, `z`, `elapsed`, `fps`, `current`, `max`, `width`, `height`) → `Float32Array` (4 bytes each) - Sprite sheet layout (`columns`, `rows`) → `Uint8Array`
- [x] **AC3**: `string[]` fields (`Sprite.texture`, `Sprite.name`) remain as plain arrays (strings can't live in SAB).
- [x] **AC4**: Player entity gets `Active` component with `isActive=1`.
- [x] **AC5**: `createRenderSystem` query includes `Active` (instead of the `undefined` check).
- [x] **AC6**: `createAnimationSystem` query includes `Active` (instead of the `undefined` check).
- [x] **AC7**: All existing functionality continues working (player movement, enemy pool, rendering, animation).
- [x] **AC8**: All validations pass (lint, typecheck, depcruise, knip, complexity, format).

## Details

### Why

SAB-backed TypedArrays allow true shared memory between the main thread and Web Workers. Component data is a single `postMessage` away from being usable in workers — no serialization, no copying, no transfer costs. Once the arrays are SAB-backed, adding workers is purely about partitioning queries and setting up command queues.

### Design

```
// Before (schema-less, dynamic arrays)
export const Position = {
  x: [] as number[],
  y: [] as number[],
  z: [] as number[]
}

// After (SAB-backed, fixed capacity)
const B = (bytes: number) => new SharedArrayBuffer(bytes)
const F32 = (sab: SharedArrayBuffer) => new Float32Array(sab)
const U8 = (sab: SharedArrayBuffer) => new Uint8Array(sab)
const U16 = (sab: SharedArrayBuffer) => new Uint16Array(sab)

export const Position = {
  x: F32(B(MAX_ENTITIES * 4)),
  y: F32(B(MAX_ENTITIES * 4)),
  z: F32(B(MAX_ENTITIES * 4))
}
```

### Memory Budget (100K entities)

| Component    | Fields        | Bytes/entity | Total       |
| ------------ | ------------- | ------------ | ----------- |
| Active       | 1 × U8        | 1            | ~98 KB      |
| Animation    | 2×U16 + 3×F32 | 16           | ~1.6 MB     |
| AnimationRow | 1 × U8        | 1            | ~98 KB      |
| Enemy        | 1 × U8        | 1            | ~98 KB      |
| Health       | 2 × F32       | 8            | ~782 KB     |
| Player       | 1 × U8        | 1            | ~98 KB      |
| Position     | 3 × F32       | 12           | ~1.2 MB     |
| Renderable   | 1 × U8        | 1            | ~98 KB      |
| Sprite       | 4×F32 + 2×U8  | 18           | ~1.8 MB     |
| Velocity     | 2 × F32       | 8            | ~782 KB     |
| **Total**    |               | **67**       | **~6.7 MB** |

### Active Component Requirement

With SAB-backed arrays, every slot is zero-initialized. The previous trick (`Active.isActive[eid] === 0` skipping entities without the component) no longer works because `undefined` is never returned — it's always `0`. Solution: **all game-loop entities get Active**. Systems include `Active` in their query, so only entities with the component are processed.

### Out of Scope

- No Web Workers created yet — just the data preparation.
- No `asBuffer` query usage yet.
- No command queues yet.
- No string-to-index table for `Sprite.texture`.

## Dependencies

### Feature Dependencies

- All existing component definitions.
- `createRenderSystem`, `createAnimationSystem`.

### External Dependencies

- None (SharedArrayBuffer is a Web API).

## Technical Considerations

### Performance

- TypedArrays are faster than JS arrays for numeric access (no boxing/unboxing).
- Fixed-size means no dynamic growth overhead.
- SAB zero-fill is a one-time cost at allocation.

### Security

- `SharedArrayBuffer` requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers. Next.js config may need updating.

### Backward Compatibility

- Read/write API unchanged: `Position.x[eid] = 5` works identically.
- `addComponent`/`removeComponent` API unchanged.
- Query API unchanged.

---

## API Contract (if applicable)

```text
MAX_ENTITIES = 100000  // shared constant

// Every component follows this pattern:
const Component = {
  field1: new Float32Array(new SharedArrayBuffer(MAX_ENTITIES * 4)),
  field2: new Uint8Array(new SharedArrayBuffer(MAX_ENTITIES * 1))
}
```

## Glossary

| Location                                      | Type     | Description                                    |
| --------------------------------------------- | -------- | ---------------------------------------------- |
| `src/game/core/shared/constants.ts`           | file     | `MAX_ENTITIES = 100000`                        |
| `src/game/core/shared/components/*.ts`        | 11 files | All numeric fields migrated to SAB TypedArrays |
| `src/game/core/player/components.ts`          | file     | Player component migrated                      |
| `src/game/core/enemies/components/Enemy.ts`   | file     | Enemy component migrated                       |
| `src/game/core/player/entity.ts`              | file     | Added `Active` component + `isActive=1`        |
| `src/game/rendering/createRenderSystem.ts`    | file     | Query includes `Active`                        |
| `src/game/rendering/createAnimationSystem.ts` | file     | Query includes `Active`                        |
