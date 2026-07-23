# Feature: Crawler Enemy Entity

> **Status**: `draft`

This file is the primary execution and maintenance contract for the feature.

## What

Create the Crawler enemy type — a ground-level melee enemy with a 4-frame walk animation — following the same entity/pool pattern as Apparition.

## Acceptance Criteria

- [ ] **AC1**: `CRAWLER` constants definition in `src/game/core/enemies/definitions/crawler.ts` (texture path, columns, rows, frame dims, health, speed, XP).
- [ ] **AC2**: `setupCrawler(eid, x, z, facingLeft)` resets all components on an existing entity (for pool reuse).
- [ ] **AC3**: `createCrawler(world, x, z, facingLeft)` factory creates a new entity with all required components.
- [ ] **AC4**: Crawler sprite uses `/crawler.png`, 4 columns × 2 rows:
  - Row 0 = walking right (4 frames, frames 0-3)
  - Row 1 = walking left (4 frames, frames 0-3)
  - Each frame: 3 units wide × 2 units tall (~1.76:1 ratio matching sprite 65×37px).
- [ ] **AC5**: Animation defaults: `startFrame=0`, `endFrame=3`, `fps=0.15`.
- [ ] **AC6**: `AnimationRow.row` set based on spawn facing direction (0 for right, 1 for left) — note: opposite of Apparition.
- [ ] **AC7**: Health: `current=3`, `max=3` (lower than Apparition — crawlers are faster but weaker).
- [ ] **AC8**: Speed multiplier: 0.35 (faster than Apparition's 0.2).
- [ ] **AC9**: XP value: 7 (less than Apparition's 10).
- [ ] **AC10**: Rendering: crawler geometry added to the InstancedMesh system via a separate mesh or shared texture atlas approach.
- [ ] **AC11**: `spawnEnemies` in `main.ts` updated to spawn a mix of Apparitions and Crawlers.

## Details

### Constraints

- Must reuse the existing `setupX` / `createX` pattern from Apparition.
- Uses the same entity components: `Enemy`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow`, `Boids`, `Billboard`.
- Reuses the same enemy pool (`createEnemyPool`) — no per-type pool needed.
- Row mapping is **opposite** of Apparition: row 0 = right, row 1 = left (apparition: row 0 = left, row 1 = right).
- Spritesheet is at `public/enemies/crawler.png` (same folder as Apparition).
- Frame aspect ratio 65:37 ≈ 1.76:1 → world units 3:2 (slightly squished horizontally for gameplay readability).

### Out of Scope

- No unique AI behavior per enemy type — both use same boids system.
- No per-enemy-type pool — single homogeneous pool.
- No damage/attack differences between enemy types (health and speed only).
- No crawler-specific animations beyond walk cycle.

---

## Dependencies

### Feature Dependencies

- Existing enemy components: `Enemy`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow`, `Boids`, `Billboard`.
- Existing `createEnemyPool` (reused as-is).
- Existing render system `createRenderSystem` + `createEnemyInstancedMesh` (may need changes for multi-texture).
- Existing animation system.

### External Dependencies

- `/public/enemies/crawler.png` — spritesheet asset (exists, 260×74px, 4×2 grid).

---

## Technical Considerations

### Performance

- `setupCrawler()` is called during pool acquisition — O(1) field writes, no allocation.
- Second InstancedMesh adds one draw call for crawlers (2 total for enemies).
- No per-frame overhead beyond component field reads.

### Security

- Not applicable.

### Backward Compatibility

- New definition file and setup functions are additive.
- Existing `setupApparition` and Apparition rendering unchanged.
- `spawnEnemies` behavior changes from Apparition-only to mixed spawn — existing phases still work correctly.

---

## API Contract (if applicable)

```text
// Crawler constants
export const CRAWLER = {
  TEXTURE: '/enemies/crawler.png',
  COLUMNS: 4,
  ROWS: 2,
  WIDTH: 3,
  HEIGHT: 2,
  HEALTH: 3,
  MAX_HEALTH: 3,
  SPEED: 0.35,
  START_FRAME: 0,
  END_FRAME: 3,
  XP_VALUE: 7
}

// Setup (for pool reuse)
function setupCrawler(eid: number, x: number, z: number, facingLeft: boolean): void

// Factory (for new entities)
function createCrawler(world: World, x: number, z: number, facingLeft?: boolean): number
```

---

## Glossary

| Location                                         | Type  | Description                                                      |
| ------------------------------------------------ | ----- | ---------------------------------------------------------------- |
| `src/game/core/enemies/definitions/crawler.ts`   | file  | Crawler constants (texture, grid, dimensions, health, speed).    |
| `src/game/core/enemies/entity.ts`                | file  | Add `setupCrawler()` and `createCrawler()` alongside Apparition. |
| `src/game/rendering/createEnemyInstancedMesh.ts` | file  | Add second InstancedMesh for crawler texture.                    |
| `src/game/main.ts`                               | file  | Import crawler setup, mixed spawn in `spawnEnemies`.             |
| `public/crawler.png`                             | asset | Crawler spritesheet: 260×74px, 4 cols × 2 rows.                  |
