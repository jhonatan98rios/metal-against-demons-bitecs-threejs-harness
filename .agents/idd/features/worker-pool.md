# Feature: Web Worker Pool for Parallel Entity Processing

> **Status**: `complete`

Offload CPU-intensive entity processing (animation, AI, physics) to a pool of Web Workers using SharedArrayBuffer-backed components for zero-copy data sharing.

## Acceptance Criteria

- [x] **AC1**: Worker pool distributes entities across `navigator.hardwareConcurrency - 1` workers (leave 1 for main/render).
- [x] **AC2**: Workers process animations (frame cycling) and movement (velocity integration) via SAB-shared component data.
- [x] **AC3**: Command queues collect structural changes (dead entities, spawn requests) on workers and flush on main thread.
- [x] **AC4**: Main thread sends frame delta, entity partition, and shared component references to workers once per frame.
- [x] **AC5**: Render system and input remain on main thread (Three.js + DOM).
- [x] **AC6**: Falls back to single-threaded processing if `SharedArrayBuffer` or Workers unavailable.
- [x] **AC7**: All validations pass.

## Details

### Architecture

```
┌───────────────────────────────────────────────────┐
│  Main Thread                                       │
│  ┌─────────┐  ┌──────────┐  ┌──────┐  ┌───────┐  │
│  │  Input   │  │  Render  │  │ Pool │  │ Queue │  │
│  │ Handler  │  │  System  │  │Mgr   │  │Flusher│  │
│  └─────────┘  └──────────┘  └──┬───┘  └───┬───┘  │
│                                 │           │      │
│           postMessage (SAB views, partitions)      │
│                                 │           │      │
├───────────────────────────────────────────────────┤
│  Worker Pool (N = hardwareConcurrency - 1)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Worker 0 │ │ Worker 1 │ │ Worker N │          │
│  │ Animation│ │ Animation│ │ Animation│          │
│  │ Movement │ │ Movement │ │ Movement │          │
│  │ AI       │ │ AI       │ │ AI       │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │            │                 │
│  postMessage (command queue subarrays)             │
└───────────────────────────────────────────────────┘
```

### Worker Lifecycle

1. **Init**: Each worker receives SAB-backed component array references once.
2. **Per frame**: Main sends `{ entities: Uint32Array, dt: number }` to each worker.
3. **Process**: Worker reads/writes component arrays directly (shared memory).
4. **Collect**: Worker sends back command queue subarrays (removals, spawns).
5. **Flush**: Main thread processes command queues (structural operations).

### Data Flow

```
// Main → Worker (per frame, per partition)
{
  entities: Uint32Array   // subarray of asBuffer result, SAB-backed
  dt: number              // frame delta
}

// Worker → Main (per frame)
{
  removeQueue: Uint32Array     // entity IDs to remove
  moveQueue: Float32Array      // [eid, dx, dz, ...] movement commands
}
```

### Component Access in Workers

Workers receive component references once at startup. All component arrays are SAB-backed, so workers read/write them directly — no copies.

```
// Worker startup
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    Active = data.components.Active
    Animation = data.components.Animation
    // ... store references
  }
}
```

### Fallback

If `SharedArrayBuffer` or `Worker` is unavailable, the game runs a single-threaded version that processes all entities inline. The API surface is identical.

## Dependencies

### Feature Dependencies

- `MAX_ENTITIES` and SAB-backed component arrays (from SAB Components feature).
- Existing `createAnimationSystem`, `createRenderSystem`.

### External Dependencies

- Web Worker API.
- `SharedArrayBuffer` (requires COOP/COEP headers).

## Technical Considerations

### Performance

- Partitioning: contiguous entity ranges for cache locality.
- Message cost: only metadata (subarray offsets, dt) crossed the boundary — component data is shared memory.
- Target: 10K+ entities with zero per-entity serialization.

### COOP/COEP Headers

SharedArrayBuffer requires:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These must be set in Next.js config → `async headers()`.

## API Contract (if applicable)

```text
// Pool factory
function createWorkerPool(world: World): {
  update(dt: number): void   // dispatch work, collect results, flush queues
  destroy(): void            // terminate all workers
}

// Worker entry
self.onmessage = (e: MessageEvent<WorkerMessage>) => { ... }
```

## Glossary

| Location                               | Type | Description                                |
| -------------------------------------- | ---- | ------------------------------------------ |
| `src/game/systems/createWorkerPool.ts` | file | Worker pool factory                        |
| `src/game/systems/game.worker.ts`      | file | Worker entry point                         |
| `src/game/systems/types.ts`            | file | Shared message type definitions            |
| `src/game/main.ts`                     | file | Uses worker pool instead of direct systems |
