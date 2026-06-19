# Feature: Walk Animation (Spritesheet Row Selection)

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Switch player spritesheet row based on movement direction: idle/walk × facing left/right (rows 0-3).

## Acceptance Criteria

- [x] **AC1**: `AnimationRow` component with `row: number[]`.
- [x] **AC2**: Added to player entity in `createPlayer()`, default row 0 (idle left).
- [x] **AC3**: Character controller sets row: idle→0/2, walk left→1, walk right→3.
- [x] **AC4**: Render system reads `AnimationRow.row` for frame Y (falls back to old behavior).
- [x] **AC5**: `resetToIdleRow()` switches walk→idle when player stops (1→0, 3→2).

## Details

### Constraints

- Row mapping: 0=idle L, 1=walk L, 2=idle R, 3=walk R.
- Spritesheet must be 4 columns × 4 rows.
- `Animation.currentFrame` still cycles 0-3 independently.

### Out of Scope

- No new spritesheet assets.
- No attack/jump/dash animation rows.

---

## Dependencies

### Feature Dependencies

- `AnimationRow` component (`src/game/core/shared/components/AnimationRow.ts`).
- Player entity factory (`src/game/core/player/entity.ts`).
- Character controller (`src/game/gameplay/characterController.ts`).
- Render system (`src/game/rendering/createRenderSystem.ts`).

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- One `number[]` field per entity — negligible.

### Security

- Not applicable.

### Backward Compatibility

- Entities without `AnimationRow` fall back to `Math.floor(currentFrame / columns)`.

---

## Glossary

| Location                                                             | Type     | Description                                      |
| -------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| `src/game/core/shared/components/AnimationRow.ts`                    | file     | New component: `row: number[]`.                  |
| `src/game/gameplay/characterController.ts::setAnimationRowFromAxis`  | function | Sets row from input axis each frame.             |
| `src/game/gameplay/characterController.ts::resetToIdleRow`           | function | Walk→idle transition on stop.                    |
| `src/game/gameplay/characterController.ts::setWalkRowFromHorizontal` | function | Sets row 1 or 3 based on horizontal direction.   |
| `src/game/gameplay/characterController.ts::setVerticalWalkRow`       | function | Keeps last walk row when moving only vertically. |
| `src/game/rendering/createRenderSystem.ts::updateSpriteFrame`        | function | Reads `AnimationRow.row` for frame Y offset.     |
