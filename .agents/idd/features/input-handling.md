# Feature: Keyboard Input Handling

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Capture keyboard (WASD / arrow keys) input and expose a clean axis-based API (`getAxis(): {x, z}`) for game systems.

## Acceptance Criteria

- [x] **AC1**: `createInput()` returns `{ consumePressed, setJoystick, isDown, getAxis }`.
- [x] **AC2**: `getAxis()` returns `{ x: -1|0|1, z: -1|0|1 }` based on WASD and arrow keys.
- [x] **AC3**: Diagonal input returns normalized axis (not >1 magnitude).
- [x] **AC4**: `consumePressed(key)` reads and resets a single-press flag (for actions, not movement).
- [x] **AC5**: `isDown(key)` returns current key hold state.
- [x] **AC6**: Joystick override via `setJoystick(x, z)` — keyboard takes priority when active.

## Details

### Constraints

- Keys normalized to lowercase (Space → `"space"`).
- `KEYBOARD_AXIS_MAP` static array — no dynamic key rebinding.
- Joystick values only used when keyboard axis is idle (0,0).

### Out of Scope

- No gamepad/controller support.
- No touch input.
- No key repeat handling.

---

## Dependencies

### Feature Dependencies

- None (standalone module).

### External Dependencies

- DOM `keydown` / `keyup` events.

---

## Technical Considerations

### Performance

- Reduces keyboard state into a single axis object per frame — negligible overhead.

### Security

- Not applicable (client-side input).

### Backward Compatibility

- Pure additive — no breaking changes expected.

---

## Glossary

| Location                                        | Type     | Description                            |
| ----------------------------------------------- | -------- | -------------------------------------- |
| `src/game/gameplay/input.ts`                    | file     | Input module: `createInput()` factory. |
| `src/game/gameplay/input.ts::KEYBOARD_AXIS_MAP` | constant | Maps key names to axis directions.     |
| `src/game/gameplay/input.ts::getKeyboardAxis`   | function | Reduces key state into axis.           |
| `src/game/gameplay/input.ts::getAxis`           | function | Merges keyboard + joystick axis.       |
| `src/game/gameplay/input.ts::consumePressed`    | function | One-shot press detection.              |
