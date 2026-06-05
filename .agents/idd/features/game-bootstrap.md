# Feature: Game Bootstrap & Main Loop

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Initialize the BitECS world, Three.js renderer, game systems, input, and character controller, then run the main loop.

## Acceptance Criteria

- [x] **AC1**: `setupWorld()` creates a BitECS world, calls `createPlayer()`, stores `world.playerEid`.
- [x] **AC2**: `start()` finds canvas, creates render + scene + camera, creates scenario (level-1 with ground + road).
- [x] **AC3**: Creates `renderSystem`, `animationSystem`, `input`, `characterController`.
- [x] **AC4**: Main loop runs `controller.update(dt)`, `animationSystem(dt)`, `renderSystem()`, `renderer.render()`.
- [x] **AC5**: Frame delta clamped to max 0.1s to prevent spiral-of-death.

## Details

### Constraints

- Canvas element must have `id="game-canvas"`.
- `start()` returns early if canvas not found or `window` undefined (SSR guard).
- Renderer uses `PCFSoftShadowMap`, SRGB color space, no tone mapping.
- Scene has `Fog(fogColor, 0, 300)`.

### Out of Scope

- No game state machine (pause, game over).
- No loading screen.
- No HUD/UI integration.

---

## Dependencies

### Feature Dependencies

- All game features: input, controller, rendering, animation, scenarios.
- Three.js renderer and scene setup (`createRender`).

### External Dependencies

- DOM canvas element.

---

## Technical Considerations

### Performance

- `requestAnimationFrame` loop — no fixed timestep.
- `delta` clamped to 0.1s to prevent physics blowup on tab-away.

### Security

- Not applicable.

### Backward Compatibility

- Adding new systems to `start()` is straightforward.

---

## Glossary

| Location                               | Type   | Description                                              |
| -------------------------------------- | ------ | -------------------------------------------------------- |
| `src/game/main.ts`                     | module | Entry point: `start()` function.                         |
| `src/game/core/bootstrap/setup.ts`     | module | `setupWorld()`: creates world + player.                  |
| `src/game/rendering/createRender.ts`   | module | Creates renderer, scene, camera, fog, ambient light.     |
| `src/game/scenarios/createScenario.ts` | module | `createScenario()`: populates scene with level geometry. |
