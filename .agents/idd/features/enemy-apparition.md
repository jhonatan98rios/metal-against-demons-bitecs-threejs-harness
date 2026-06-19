# Feature: Apparition Enemy Entity

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Create the Apparition enemy type as a BitECS entity with sprite rendering, walk animation, and configurable spawn position — following the same pattern as `createPlayer()`.

## Acceptance Criteria

- [x] **AC1**: `Enemy` tag component with `isEnemy` flag (like `Player.isPlayer`).
- [x] **AC2**: `createApparition(world, x, z)` factory creates a new entity, adds `Enemy`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow` components.
- [x] **AC3**: Apparition sprite uses `/enemies/apparition.png`, 2 columns × 2 rows:
  - Row 0 = walking left (2 frames, frames 0-1)
  - Row 1 = walking right (2 frames, frames 0-1)
  - Each frame: 3 units wide × 6 units tall (1:2 ratio matching sprite pixels).
- [x] **AC4**: Animation defaults: `startFrame=0`, `endFrame=1`, `fps=6`, `currentFrame=0`.
- [x] **AC5**: `AnimationRow.row` set based on spawn facing direction (0 for left, 1 for right).
- [x] **AC6**: Health defaults to `current=5`, `max=5`.
- [x] **AC7**: Apparition entities are rendered by the existing `createRenderSystem()` (no new render code needed).
- [x] **AC8**: Apparition animation cycles via existing `createAnimationSystem()` (no new animation code needed).

## Details

### Constraints

- Must follow the same entity setup pattern as `createPlayer()` — `addEntity`, then `addComponent` for each component, then set field values.
- Apparition only needs 2 animation frames (frames 0-1) — no startFrame/endFrame change needed from defaults, just on `Animation` component.
- `AnimationRow.row` uses only values 0 (left) and 1 (right) — no idle rows since apparition is always moving.
- Frame width/height in world units must match the sprite pixel aspect ratio (50:100 = 1:2 → 3:6).
- The existing `Animation` system queries `[Animation, Velocity]` — apparition must have `Velocity` component to receive animation updates.

### Out of Scope

- No AI / movement behavior — just the entity definition and static spawn.
- No enemy pooling or recycling (enemies are created once per spawn).
- No collision system or damage dealing.
- No multiple apparition variants or different enemy types yet.
- No spawner system or wave management.

---

## Dependencies

### Feature Dependencies

- All shared components: `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow`.
- `Enemy` component (new, in `src/game/core/enemies/components/`).
- BitECS `addComponent`, `addEntity` from `bitecs`.

### External Dependencies

- `/public/enemies/apparition.png` — spritesheet asset (exists).

---

## Technical Considerations

### Performance

- `createApparition()` is called once per enemy — negligible cost.
- Rendering and animation reuse existing systems — no per-enemy overhead beyond component data.

### Security

- Not applicable.

### Backward Compatibility

- New `Enemy` component is additive — no shared component changes needed.
- Existing `createRenderSystem` queries `[Position, Renderable]` — apparition qualifies automatically.
- Existing `createAnimationSystem` queries `[Animation, Velocity]` — apparition qualifies automatically.

---

## API Contract (if applicable)

```text
// Enemy tag component (analogous to Player)
Enemy.isEnemy[eid] = 0 | 1

// Factory
function createApparition(world: World, x: number, z: number, facingLeft?: boolean): number
// Returns eid, sets Position.x/z, AnimationRow.row based on facingLeft
```

---

## Glossary

| Location                                          | Type      | Description                                                                        |
| ------------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| `src/game/core/enemies/components/Enemy.ts`       | file      | New `Enemy` tag component definition.                                              |
| `src/game/core/enemies/definitions/apparition.ts` | file      | Apparition constants (texture path, columns, rows, frame dimensions, health, fps). |
| `src/game/core/enemies/entity.ts`                 | file      | `createApparition()` factory (or `apparition.ts` under definitions).               |
| `src/game/core/enemies/pool/`                     | directory | (Future) enemy object pooling.                                                     |
| `src/game/core/enemies/systems/`                  | directory | (Future) enemy behavior systems (AI, spawning).                                    |
| `public/enemies/apparition.png`                   | asset     | Apparition spritesheet: 100×200px, 2 cols × 2 rows.                                |
