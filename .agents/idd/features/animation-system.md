# Feature: Spritesheet Animation (Frame Cycling)

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Cycle sprite frame index over time using a standalone BitECS system, advancing `Animation.currentFrame` at a configurable FPS.

## Acceptance Criteria

- [x] **AC1**: `createAnimationSystem(world)` returns a system function `(dt: number) => void`.
- [x] **AC2**: Queries entities with both `Animation` and `Velocity` components.
- [x] **AC3**: Accumulates `elapsed` by `dt`.
- [x] **AC4**: When `elapsed ≥ 1/fps`, resets `elapsed` and increments `currentFrame`.
- [x] **AC5**: Wraps `currentFrame` back to `startFrame` when exceeding `endFrame`.

## Details

### Constraints

- Only entities with both `Animation` + `Velocity` get animated frame updates.
- Frame rate per-entity via `Animation.fps[eid]`.
- Loop range per-entity via `Animation.startFrame[eid]` and `Animation.endFrame[eid]`.

### Out of Scope

- No sprite row selection (handled by `AnimationRow` in render system).
- No blending, easing, or interpolation.
- No animation state machine.

---

## Dependencies

### Feature Dependencies

- BitECS `Animation` component (`src/game/core/shared/components/Animation.ts`).
- BitECS `Velocity` component (`src/game/core/shared/components/Velocity.ts`).

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- `query` returns all matching entities each frame — O(n) where n = animated entities.
- No allocations after creation.

### Security

- Not applicable.

### Backward Compatibility

- Pure additive — no breaking changes.

---

## Glossary

| Location                                       | Type | Description                                                            |
| ---------------------------------------------- | ---- | ---------------------------------------------------------------------- |
| `src/game/rendering/createAnimationSystem.ts`  | file | Animation system factory.                                              |
| `src/game/core/shared/components/Animation.ts` | file | Component: `currentFrame`, `elapsed`, `fps`, `startFrame`, `endFrame`. |
