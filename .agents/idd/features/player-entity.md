# Feature: Player Entity Factory

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Create a player BitECS entity with all required components (Health, Position, Velocity, Renderable, Sprite, Animation, AnimationRow, Player tag) and default values.

## Acceptance Criteria

- [x] **AC1**: `createPlayer(world)` creates a new entity via `addEntity`.
- [x] **AC2**: Adds `Player`, `Health`, `Position`, `Velocity`, `Renderable`, `Sprite`, `Animation`, `AnimationRow` components.
- [x] **AC3**: Defaults: Health 20/20, Position (30,5,0), Velocity (0,0), Renderable=1.
- [x] **AC4**: Sprite points to `/player/spritesheet.png`, 4 cols × 4 rows, frame 4×8 units.
- [x] **AC5**: Animation defaults: currentFrame=0, fps=8, loop frames 0-3.
- [x] **AC6**: `AnimationRow.row` initialized to 0 (idle left).

## Details

### Constraints

- Must use BitECS array-based component API.
- All component setup functions grouped by domain (health, position, etc.).
- `setupAnimation` and `setupAnimationRow` called separately.

### Out of Scope

- No multiple player instances.
- No player-specific behavior (movement logic lives in character controller).

---

## Dependencies

### Feature Dependencies

- All shared components under `src/game/core/shared/components/`.
- BitECS `addComponent`, `addEntity` from `bitecs`.

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- Negligible — called once per player.

### Security

- Not applicable.

### Backward Compatibility

- Adding new components to `PLAYER_COMPONENTS` array automatically adds them during creation.

---

## Glossary

| Location                                          | Type   | Description                                                      |
| ------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `src/game/core/player/entity.ts`                  | file   | Player entity factory with all setup functions.                  |
| `src/game/core/player/components.ts`              | file   | `Player` tag component definition.                               |
| `src/game/core/bootstrap/setup.ts`                | module | Calls `createPlayer()` and stores `eid` on world.                |
| `src/game/core/shared/components/AnimationRow.ts` | file   | Component: spritesheet row selection (0-3).                      |
| `src/game/core/shared/components/Animation.ts`    | file   | Component: frame loop (currentFrame, fps, startFrame, endFrame). |
