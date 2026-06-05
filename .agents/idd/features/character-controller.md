# Feature: Character Movement Controller

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Drive player position, velocity, and animation row based on keyboard input axis each frame.

## Acceptance Criteria

- [x] **AC1**: `createCharacterController(world, input, speed?)` returns `{ update(delta) }`.
- [x] **AC2**: `update()` reads axis from `input.getAxis()`, normalizes diagonal input.
- [x] **AC3**: `movePlayer()` adds `axis * speed * delta` to `Position`, resets `Velocity` to 0.
- [x] **AC4**: `updateFacing()` stores last non-idle facing direction on world.
- [x] **AC5**: `setAnimationRowFromAxis()` sets `AnimationRow.row` based on movement:
  - Moving left → row 1 (walk left)
  - Moving right → row 3 (walk right)
  - Idle → row 0 or 2 (idle left/right based on last walk row)
  - Vertical-only → keep last horizontal walk row
- [x] **AC6**: Returns velocity `THREE.Vector3` for external animation hooks.
- [x] **AC7**: No-op when `world.playerEid` is undefined.

## Details

### Constraints

- Player entity must already exist (`world.playerEid` set by `setupWorld`).
- `AnimationRow` component must be on player entity.
- Must keep per-function complexity ≤ 8 (lizard rule).
- Pure ECS — no direct Three.js object manipulation.

### Out of Scope

- No collision detection.
- No acceleration/deceleration (instant velocity).
- No jump, dash, or special movement.

---

## Dependencies

### Feature Dependencies

- `Position`, `Velocity`, `AnimationRow` components.
- Input handler (`createInput`).

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- One function call per frame — trivial.

### Security

- Not applicable.

### Backward Compatibility

- `updateAnimation` hook on `playerObject` preserved for backward compat with old animation code.

---

## Glossary

| Location                                                            | Type     | Description                                               |
| ------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `src/game/gameplay/characterController.ts`                          | file     | Controller module: `createCharacterController()` factory. |
| `src/game/gameplay/characterController.ts::normalizeAxis`           | function | Clamps diagonal axis magnitude to ≤1.                     |
| `src/game/gameplay/characterController.ts::updateFacing`            | function | Stores last movement direction on world.                  |
| `src/game/gameplay/characterController.ts::setAnimationRowFromAxis` | function | Picks walk/idle spritesheet row from input.               |
| `src/game/gameplay/characterController.ts::resetToIdleRow`          | function | Walk → idle (row 1→0, row 3→2).                           |
| `src/game/gameplay/characterController.ts::movePlayer`              | function | Applies axis × speed × delta to position.                 |
