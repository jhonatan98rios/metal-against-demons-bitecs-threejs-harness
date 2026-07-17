# Feature: Phase System & Victory Condition

> **Status**: `draft`

This file is the primary execution and maintenance contract for the feature.

## What

Replace the fixed-100-enemy spawn with a data-driven phase definition system. Each phase specifies a number of enemies to spawn (ramping up). The home page lists available phases for selection. A kill counter tracks progress: when all enemies in the phase are dead, the game transitions to a VICTORY state with a menu that redirects back to the home screen. A new `VICTORY` state is added alongside `PLAYING`, `PAUSED`, `LEVEL_UP`, and `GAME_OVER`.

## Acceptance Criteria

- [ ] **AC1**: Phase definitions exist as a data structure (`src/game/core/phases/definitions.ts`) with at minimum 3 phases. Each entry has `id`, `name`, `description`, `enemyCount`, and `poolSize`. Enemy count starts modest (~20) and ramps per phase (~20, ~50, ~100).
- [ ] **AC2**: `createEnemyPool` is called with `poolSize` from the selected phase (not hardcoded 100). `spawnEnemies` uses `enemyCount` from the phase.
- [ ] **AC3**: `GameState` extended with `VICTORY = 4`. `createGameStateSystem` gains a `setVictory()` method. The HUD knows about the VICTORY state for overlay rendering.
- [ ] **AC4**: `createVictorySystem` system checks every frame: if active enemy count is zero, triggers victory. Enemy count is determined via a `query(world, [Active, Enemy])` filtered by `Active.isActive[eid] === 1`, giving O(n) over the pool. Runs after `deathSystem` in the loop.
- [ ] **AC5**: Victory screen shows a "VICTORY" overlay with the phase name and a button that navigates to `/`. Pressing the button triggers `router.push('/')`. The overlay replaces the game-over/level-up overlays — VICTORY is also a terminal state that pauses the game loop.
- [ ] **AC6**: During VICTORY state, game systems (controller, boids, damage, death, etc.) are NOT updated — only render and HUD. Same pattern as GAME_OVER already follows.
- [ ] **AC7**: Home page (`app/page.tsx`) shows a phase selection list. Each item displays phase name + description (includes enemy count). Has a "Select" button for each phase.
- [ ] **AC8**: Selecting a phase navigates to `/scenes/phase-1?phase=<id>`. The phase-1 page reads `searchParams.phase` and passes it to `start(phaseId)`.
- [ ] **AC9**: `start()` accepts an optional `phaseId: string` parameter. If omitted, defaults to the first phase. The selected phase's `enemyCount` and `poolSize` drive `spawnEnemies` and `createEnemyPool`.
- [ ] **AC10**: Phase definitions are imported by `app/page.tsx` to render the selection list — shared data, no duplication.

## Details

### Constraints

- Phase data is a static array — no JSON loading, no runtime mutation. Defined in `src/game/core/phases/definitions.ts`.
- Victory check uses `query` + `Active.isActive` filter — a single loop over pooled enemies. Not a counter accumulator (avoid drift bugs).
- `VICTORY` state is treated identically to `GAME_OVER` in the game loop guard: only `render`, `camera`, `billboard` update. No input processing beyond the victory button.
- HUD overlay for VICTORY follows the same pattern as PAUSED/GAME_OVER — `createOverlay(text, subtext)`.
- Home page is a server component, but phase data is plain TS objects — works in both server and client contexts.
- Route: `/` → home with phase list. `/scenes/phase-1?phase=<id>` → game scene. No new routes needed.

### Out of Scope

- No phase unlocking/progression. All phases are available immediately from the home screen.
- No difficulty curve beyond enemy count. Enemy stats, spawn patterns, and AI are identical across phases.
- No between-phase transition screen during gameplay (endless runner with end-of-phase victory, not sequential waves).
- No persistent victory state (localStorage, backend) — each phase is a self-contained run.
- No phase deletion callback (phases are static definitions, not runtime entities to be deleted).

---

## Dependencies

### Feature Dependencies

- `GameState` component — needs new `VICTORY` value.
- `gameStateSystem` — needs `setVictory()` method.
- `PlayerHUD` — needs VICTORY overlay rendering and redirect button.
- `enemyPool` and `enemyDeathSystem` — already track Active state, used by victory check.
- `main.ts` / `start()` — needs phase parameter passthrough.
- App router — `app/page.tsx` (home), `app/scenes/phase-1/page.tsx` (game scene, gains `searchParams`).

### External Dependencies

- `next/navigation` `useRouter` on victory button for client-side redirect.
- No new npm packages.

---

## Technical Considerations

### Performance

- Victory check: single `query` per frame over pooled enemies. With a typical pool of <200 entities, negligible cost. This runs only while `PLAYING`, and stops once victory triggers.
- Phase data: static const array, zero runtime allocation.

### Security

- Not applicable. Client-side game only.

### Backward Compatibility

- `start()` signature changes: gains optional `phaseId` parameter. Defaults to first phase when omitted — existing direct calls (e.g., Phase1 page without query param) keep working.
- `GameState` enum extended — existing code checking `STATES.GAME_OVER` is unaffected. Any `switch` without a `default` case may need the VICTORY arm (checked in `gameStateSystem.ts` and `PlayerHUD.ts`).

---

## API Contract (if applicable)

```text
// Phase definition (static)
interface PhaseDef {
  id: string          // e.g. "phase-1"
  name: string        // e.g. "First Contact"
  description: string // e.g. "20 enemies — a gentle start"
  enemyCount: number  // how many enemies to spawn
  poolSize: number    // pool size (>= enemyCount)
}

// Phase definitions array
const PHASES: PhaseDef[]

// Updated start() signature
function start(phaseId?: string): void

// New GameState value
STATES.VICTORY = 4

// New system
function createVictorySystem(world, onVictory: () => void): { update(): void }

// Updated gameStateSystem
createGameStateSystem(...): { ..., setVictory(): void }
```

---

## Glossary

Use glossary anchors to reconnect later maintenance work to the source code that implements this feature.

| Location                                       | Type          | Description                                                                                         |
| ---------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `src/game/core/phases/definitions.ts`          | file (new)    | Static phase data array: id, name, description, enemyCount, poolSize.                               |
| `src/game/core/shared/components/GameState.ts` | file (modify) | Add `VICTORY: 4` to STATES enum.                                                                    |
| `src/game/systems/gameStateSystem.ts`          | file (modify) | Add `setVictory()` method. Handle VICTORY alongside GAME_OVER in terminal state handler.            |
| `src/game/systems/victorySystem.ts`            | file (new)    | `createVictorySystem`: queries active enemies, calls `onVictory` callback when zero remain.         |
| `src/game/main.ts`                             | file (modify) | Accept `phaseId`, use phase data for pool/spawn, wire `createVictorySystem`, guard loop on VICTORY. |
| `src/game/ui/PlayerHUD.ts`                     | file (modify) | Add VICTORY overlay with phase name + "Return to Menu" button wired to `router.push('/')`.          |
| `app/page.tsx`                                 | file (modify) | Phase selection list: name, description, select button → navigates with `phase` query param.        |
| `app/scenes/phase-1/page.tsx`                  | file (modify) | Read `searchParams.phase`, pass to `start(phaseId)`.                                                |
