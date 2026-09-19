# Feature: First-Person Camera Playability

> **Status**: `complete`

> **Implemented**: 2026-09-19. See Implementation Notes at the end.

This file is the primary execution and maintenance contract for the feature.

## What

Fix first-person (FP) camera playability: the player-hands overlay must never
paint above the pause/level-up/game-over menus, and mouse look must behave like
a mainstream FPS (reliable pointer lock + full yaw **and** pitch with clamped
vertical rotation).

## Code Conventions (Mandatory)

These are not suggestions. Any implementation of this feature MUST comply:

- **No POO, no classes.** No `new` for game logic, no class declarations, no
  inheritance. Factories returning object literals (the existing
  `createXxx()` pattern) are the only allowed shape.
- **No `let`.** `functional/no-let` is an ESLint **error**. Use `const` plus
  field mutation on a `const` object, exactly like
  `src/game/gameplay/cameraMouseController.ts` already does.
- **ECS-first.** Live game state that a system reads must live in a
  `sab`-backed component under `src/game/core/shared/components/` and be read
  through its typed arrays. Closure state in a _controller_ is only for raw
  device accumulation before it is handed to a system.
- **Layers are law** (`eslint-plugin-boundaries`, `learned.md`):
  `gameplay → gameplay|core`, `ui → ui|core|gameplay`, `core → core`.
  `main.ts` orchestrates. Never import `rendering` from `core`/`gameplay`.
- **Complexity gates**: `complexity ≤ 8`, `max-lines-per-function ≤ 50`,
  `max-params ≤ 5`, `max-statements ≤ 25`, `max-depth ≤ 3`,
  `sonarjs/cognitive-complexity ≤ 12`, `max-lines ≤ 500`.
- **Prettier**: 2 spaces, single quotes, no semicolons, `printWidth 80`.
- **Do not touch player movement math.** `createCharacterController`'s axis
  rotation / normalization / animation-row logic is explicitly out of scope;
  only the _source_ of the yaw angle changes (see Change Plan 6).
- After every change: `pnpm validate:full` and fix everything it reports.

## Acceptance Criteria

- [x] **AC1 — Hands never cover menus.** When `GameState.status !== PLAYING`,
      the player-hands overlay is hidden, and when it is visible it renders
      below every HUD/menu layer (pause, level-up, game-over, victory).
- [x] **AC2 — Hands still render in FP gameplay.** In FP + `PLAYING` the hands
      overlay is visible and above the game canvas.
- [x] **AC3 — Pointer lock is requested only from a user gesture** (canvas
      click / FP toggle click), never from the `requestAnimationFrame` loop.
- [x] **AC4 — Pointer-lock failures are handled**: a rejected
      `requestPointerLock()` / `pointerlockerror` never throws or spams.
- [x] **AC5 — Look input is ignored while unlocked** (desktop): moving the
      mouse over the page or menus no longer rotates the camera.
- [x] **AC6 — Full yaw + pitch.** Vertical mouse movement rotates the FP camera
      up and down; horizontal rotation keeps working.
- [x] **AC7 — Pitch is clamped** to roughly ±83° so the camera cannot flip over.
- [x] **AC8 — Yaw and pitch are stored in an ECS component** (`CameraLook`),
      not in ad-hoc closures on `world`.
- [x] **AC9 — Top-down camera is unchanged**, and pitch never affects it.
- [x] **AC10 — Player movement is unchanged**; FP strafing/forward still uses
      the camera yaw only.
- [x] **AC11 — Touch controllers expose the same look contract** (`consumeLook`)
      and support vertical drag as well as horizontal.
- [x] **AC12 — One Esc pauses.** While pointer-locked in FP, a single `Esc`
      both releases the mouse and pauses the game. **Root cause:** the browser
      consumes `Esc` to exit pointer lock and never delivers the `keydown` to
      the page, so the game's own `Esc` handler only fired on the second press.
      **Fix:** pause on `pointerlockchange` (unlocked + FP + `PLAYING`).
- [x] **AC13 — Resuming relocks in the same click.** The HUD Resume button and
      the level-up card click are user gestures, so they re-request pointer
      lock in the same click (no extra click needed to look again).
- [ ] **AC14 — `pnpm validate:full` passes** with zero errors. **Blocked by a
      pre-existing, unrelated failure** (`src/game/core/player/meta.test.ts:80`,
      `addMoney` clamps to 0 but the test expects 30). Reproduces on `HEAD`
      without this feature's changes. All other gates pass.

## Details

### Constraints

- Pointer lock is a browser-gesture-gated API. Chrome/Firefox require the call
  to happen inside a user-activation task; a call from `requestAnimationFrame`
  is rejected and (Firefox) never succeeds.
- Escape always exits pointer lock and cannot be intercepted. After Escape the
  user must click the canvas again — this is standard FPS behaviour and is the
  intended UX (do not try to auto-relock).
- `#hud-container` (`app/scenes/phase-1/page.tsx`) is `position:absolute; z-10`
  and therefore **creates a stacking context**. Every menu inside it is trapped
  at effective root level 10 regardless of its own `z-index: 100/1001`.
- `CameraLook` must use `sab.f32(MAX_ENTITIES)` and `addComponent` on
  `world.cameraEid` (`setupWorld`), matching `CameraMode`.

### Out of Scope

- No change to `createCharacterController` movement/rotation math.
- No change to the top-down camera framing or `TOPDOWN_*` constants.
- No head-bob, sprint FOV kick, aim-down-sights, recoil, or weapon logic.
- No sensitivity/config UI (`/config`) work.
- No new dependency; no Pointer Lock polyfill.
- No refactor of the existing `PlayerHUD` class into something else — it is
  existing UI code and is left as-is (only the overlay's stacking/visibility
  is fixed).

---

## Root Cause Analysis

### Bug A — Hands sprite renders above pause/level-up overlays

| Evidence                               | Finding                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `app/scenes/phase-1/page.tsx:18-22`    | `#hud-container` is `absolute inset-0 z-10` → creates a stacking context.                           |
| `src/game/ui/FirstPersonOverlay.ts:12` | Hands `img` is appended to `document.body` with `position: fixed; z-index: 100`.                    |
| `src/game/ui/PlayerHUD.ts:101`         | Pause / game-over / victory overlays use `zIndex: '100'` **inside** the `#hud-container` context.   |
| `src/game/ui/LevelUpModal.ts:63`       | Level-up modal uses `zIndex: '1001'` **inside** the same context.                                   |
| `src/game/main.ts:142`                 | `fpOverlay.update(systems.camera.isFirstPerson())` — visibility tracks camera mode only, not state. |

**Conclusion (two independent defects):**

1. **Stacking**: hands at body-level `z-index: 100` beat the whole
   `#hud-container` subtree, which is capped at root level `10`. No `z-index`
   inside the HUD can win.
2. **Visibility**: the hands never hide on pause / level-up / game-over /
   victory because their `visible` flag is derived solely from camera mode.

### Bug B — Mouse look is unreliable and has no vertical axis

| Evidence                                          | Finding                                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/game/main.ts:120-127`                        | `handlePointerLock()` calls `void systems.pointerLock.lock()` **every frame** from the render loop while unlocked.      |
| `src/game/gameplay/cameraMouseController.ts:1-21` | Only `angle` (yaw) is tracked. `movementY` is never read → "moves sideways but not up/down".                            |
| `src/game/gameplay/cameraMouseController.ts:10`   | `mousemove` is bound on `document` unconditionally → camera rotates while the pointer is over menus / unlocked.         |
| `src/game/main.ts:310-339`                        | The only lock trigger is the loop; the 🎥 FP toggle (`cameraSwitcher`) click does not request lock, losing the gesture. |
| `src/game/systems/cameraSystem.ts:20-45`          | `getLookDir()` is 2-D yaw only; `lookAt` uses a fixed eye height → pitch is structurally impossible.                    |

**Conclusion:** three independent defects — (1) lock requested outside a user
gesture, (2) no pitch plumbing at all, (3) look input applied even when not
locked.

---

## Change Plan (what, where, how)

> Nothing below is implemented yet. Order matters: 1 → 2 are independent of the
> rest and can ship alone as the "hands" hotfix.

### 1. `src/game/ui/FirstPersonOverlay.ts` — lower the hands below the HUD

Change the CSS `z-index: 100` to a value **below** `#hud-container`'s `10`
(e.g. `5`), and document why in a `ponytail:` comment so it is not "fixed" back:

```css
/* ponytail: below #hud-container (z-10 stacking context) so pause/level-up
   overlays always paint on top. */
z-index: 5;
```

This is the root-cause fix for AC1's stacking half: no menu `z-index` is
touched, and the hands stay above the bare canvas.

### 2. `src/game/main.ts` — hide hands whenever the run is not PLAYING

In `tickVisuals` (currently `main.ts:141-142`), derive visibility from camera
mode **and** `GameState`:

```ts
const playing = GameState.status[stateEid] === STATES.PLAYING
fpOverlay.update(systems.camera.isFirstPerson() && playing)
```

`GameState`/`STATES` are already imported and `stateEid` is already in scope.
Covers AC1's visibility half + AC2.

### 3. NEW `src/game/core/shared/components/CameraLook.ts` — ECS look state

Mirror `CameraMode.ts` exactly (same directory, same `sab` pattern):

```ts
import { MAX_ENTITIES, sab } from '../constants'

/** First-person look angles in radians. yaw = horizontal, pitch = vertical. */
export const CameraLook = {
  yaw: sab.f32(MAX_ENTITIES),
  pitch: sab.f32(MAX_ENTITIES)
}
```

### 4. `src/game/core/bootstrap/setup.ts` — register `CameraLook`

Add the component to `cameraEid` next to `CameraMode`, and zero both arrays.
`cameraEid` already exists on `WorldSetup`; no new world field, no `world.*`
look state. Covers AC8.

### 5. Controllers — gesture-safe lock + yaw+pitch deltas

#### 5a. `src/game/gameplay/cameraMouseController.ts`

- Accumulate **both** axes into a `const delta = { yaw: 0, pitch: 0 }`.
- Guard accumulation with `if (document.pointerLockElement !== canvas) return`
  so look input is dead while unlocked (AC5).
- Sign convention: `pitch -= e.movementY * SENSITIVITY` (mouse up = look up,
  matching mainstream FPS; yaw unchanged: `+=`).
- Replace `getAngle()` with `consumeLook(): { yaw: number; pitch: number }`
  that reads-and-resets the accumulator (same one-shot idea as
  `createInput().consumePressed`).
- Make `lock()` gesture-safe and non-throwing:

```ts
lock: () => {
  const request = canvas.requestPointerLock() as unknown
  if (request && typeof (request as Promise<void>).catch === 'function')
    (request as Promise<void>).catch(() => {})
}
```

(Keeps AC4: no unhandled rejection, works where `requestPointerLock`
returns `undefined`.)

- Optional: add a `pointerlockerror` listener that no-ops so the browser does
  not surface console noise.
- `destroy()` stays: exit lock + remove listeners.

#### 5b. `src/game/gameplay/cameraTouchController.ts`

- Extend `TouchState` with `lastY` and read `touch.clientY` in the move handler.
- Return `consumeLook()` with the same `{ yaw, pitch }` shape. Reuse the
  existing normalization style for pitch, e.g.
  `pitch -= (dy / window.innerHeight) * (Math.PI / 2)`.
- Keep `getAngle` removed (single contract, no dead API). Covers AC11.

### 6. `src/game/systems/cameraSystem.ts` — integrate look, clamp pitch, aim

- Change the factory signature from `getAngle: () => number` to
  `consumeLook: () => { yaw: number; pitch: number } = () => ({ yaw: 0, pitch: 0 })`.
- Add pure helpers (module scope, complexity ≤ 8):

```ts
const FP_PITCH_LIMIT = Math.PI / 2 - 0.15
const clampPitch = (p: number) =>
  Math.max(-FP_PITCH_LIMIT, Math.min(FP_PITCH_LIMIT, p))

const applyLook = (world: CameraWorld, delta: LookDelta, enabled: boolean) => {
  const eid = world.cameraEid
  if (eid === undefined) return { yaw: 0, pitch: 0 }
  const yaw = CameraLook.yaw[eid] + (enabled ? delta.yaw : 0)
  const pitch = clampPitch(CameraLook.pitch[eid] + (enabled ? delta.pitch : 0))
  CameraLook.yaw[eid] = yaw
  CameraLook.pitch[eid] = pitch
  return { yaw, pitch }
}
```

- `update()`: **always** call `consumeLook()` (so deltas never pile up), but
  only accumulate when `getMode(world) === 1` (FP). Then branch as today.
- `updateFirstPerson` takes `look: { yaw, pitch }` and converts to a 3-D
  direction, replacing `getLookDir`'s 2-D form:

```ts
const updateFirstPerson = (
  playerEid: number,
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3,
  look: LookDelta
) => {
  const cosPitch = Math.cos(look.pitch)
  targetPos.set(
    Position.x[playerEid],
    Position.y[playerEid] + FP_EYE_Y,
    Position.z[playerEid]
  )
  camera.position.copy(targetPos)
  camera.lookAt(
    targetPos.x + Math.sin(look.yaw) * cosPitch * FP_LOOK_AHEAD,
    targetPos.y + Math.sin(look.pitch) * FP_LOOK_AHEAD,
    targetPos.z - Math.cos(look.yaw) * cosPitch * FP_LOOK_AHEAD
  )
}
```

The forward vector `(sin yaw, -cos yaw)` is preserved. **Implementation
correction**: with pitch 0 the camera now aims exactly horizontal, whereas the
legacy code looked slightly _down_ (`Position.y + FP_EYE_Y * 0.5`). That legacy
tilt was an FP hack; horizontal-at-zero is the intended FPS behaviour. Covers
AC6, AC7, AC9.

- Add `cameraEid?: number` to the local `CameraWorld` type.
- Expose `getYaw: () => CameraLook.yaw[world.cameraEid ?? -1] ?? 0` on the
  returned system so movement can read the ECS value (replaces `getAngle`).
- `updateTopDown` is untouched.

### 7. `src/game/main.ts` — rewire look + gesture-based lock

- `setupCameraAndInput`: build the camera system with
  `createCameraSystem(world, camera, () => cameraCtrl.consumeLook())` and build
  the controller with
  `() => (cameraSystem.isFirstPerson() ? cameraSystem.getYaw() : 0)`.
  **Movement math is untouched** — only the angle source moves into ECS.
- `handlePointerLock`: make it **unlock-only** (remove the per-frame `lock()`
  call that causes the rejection spam and never succeeds):

```ts
function handlePointerLock(systems: GameSystems, stateEid: number) {
  if (!systems.pointerLock) return
  const isFP = systems.camera.isFirstPerson()
  const isPlaying = GameState.status[stateEid] === STATES.PLAYING
  if ((!isFP || !isPlaying) && systems.pointerLock.isLocked())
    systems.pointerLock.unlock()
}
```

- Add the gesture lock in `createGameSystems` (has `world`, `cameraSystem`,
  `pointerLock`, `gameState` in scope), and register its removal in
  `destroyables`:

```ts
const canvas = document.querySelector('#game-canvas')
const onCanvasClick = () => {
  if (
    cameraSystem.isFirstPerson() &&
    GameState.status[world.stateEid] === STATES.PLAYING
  )
    void pointerLock?.lock()
}
canvas?.addEventListener('click', onCanvasClick)
destroyables.push(() => canvas?.removeEventListener('click', onCanvasClick))
```

- In the `createCameraSwitcher` callback, request lock inside the click
  handler when switching _into_ FP (preserves user activation):

```ts
createCameraSwitcher(() => {
  cameraSystem.toggle()
  if (cameraSystem.isFirstPerson()) void pointerLock?.lock()
})
```

- Keep `handlePointerLock(systems, stateEid)` in `tickVisuals` for the unlock
  path. Covers AC3, AC4, AC5, AC10.

### 8. Tests (one runnable check, per project rules)

Add a colocated Vitest spec for the pure logic — no DOM, no mocks of pointer
lock:

- `src/game/systems/cameraSystem.test.ts` (or a small exported pure helper):
  - `clampPitch` clamps at `±(π/2 - 0.15)` and passes values in range through.
  - With `look.pitch = 0`, the FP target equals the legacy yaw-only target
    (regression guard for AC9).
  - Negative pitch aims the target below the camera, positive above (AC6).
- Reuse the existing `*.test.ts` pattern already present under
  `src/game/core/player/` and `src/game/systems/`.

---

## Dependencies

### Feature Dependencies

- `CameraMode` component (`src/game/core/shared/components/CameraMode.ts`).
- `GameState` / `STATES` (`src/game/core/shared/components/GameState.ts`).
- `Position` component and `createCharacterController` (movement source only).
- `#hud-container` markup in `app/scenes/phase-1/page.tsx`.

### External Dependencies

- Browser Pointer Lock API (`requestPointerLock`, `pointerlockchange`,
  `pointerlockerror`).
- Three.js `PerspectiveCamera.lookAt`.
- BitECS `addComponent` / `query`.

---

## Technical Considerations

### Performance

- Look integration is O(1) per frame; no allocations added beyond the existing
  per-frame objects. `consumeLook()` returns a small literal — acceptable,
  matching the existing `getAxis()` / `Vector3` allocation pattern.
- No per-frame `requestPointerLock()` calls anymore — strictly fewer browser
  calls and no Promise churn.

### Security

- Not applicable (client-side camera control). Pointer lock is same-origin and
  canvas-scoped.

### Backward Compatibility

- `createCameraMouseController().getAngle()` and
  `createCameraTouchController().getAngle()` are replaced by `consumeLook()`.
  Both are internal; the only caller is `main.ts`, updated in Change Plan 7.
- `createCameraSystem`'s third parameter changes shape; default keeps it
  optional, so any other caller keeps compiling with a no-op look.
- `CameraLook` is additive; existing worlds without it are unaffected because
  look is only applied through `world.cameraEid`.
- Touch feel is preserved for yaw; pitch is new (additive).

---

## API Contract

```text
CameraLook (component, src/game/core/shared/components/CameraLook.ts)
  yaw:   Float32Array   // radians, unbounded
  pitch: Float32Array   // radians, clamped to ±(PI/2 - 0.15)

LookDelta
  { yaw: number; pitch: number }  // radians, per-frame delta

createCameraMouseController(canvas): {
  consumeLook(): LookDelta
  lock(): void
  unlock(): void
  isLocked(): boolean
  destroy(): void
}

createCameraTouchController(): {
  consumeLook(): LookDelta   // pitch from vertical drag
  destroy(): void
}

createCameraSystem(world, camera, consumeLook?): {
  update(): void             // consumes look, writes CameraLook, aims camera
  toggle(): void
  isFirstPerson(): boolean
  getYaw(): number           // ECS-backed, used by character controller
}

Visibility rule (main.tickVisuals)
  hands.visible = isFirstPerson && GameState.status[stateEid] === PLAYING

Stacking rule
  hands z-index (5) < #hud-container z-index (10) < menus (100/1001 inside it)

Lock rule
  lock()   => only inside a user gesture (canvas click / FP toggle click)
  unlock() => whenever !isFirstPerson || status !== PLAYING
```

---

## Verification

1. `pnpm validate:full` → zero errors (lint, typecheck, tests, depcruise, knip,
   complexity, format).
2. Manual (desktop):
   - Toggle to FP. Click the canvas → pointer locks; mouse looks around in
     both axes; pitch stops at ~±83°.
   - Press Escape → lock releases; moving the mouse no longer rotates the
     camera; click canvas → locks again.
   - Pause (Esc key / HUD button) → hands vanish, PAUSED overlay fully covers
     the screen. Trigger a level-up → hands vanish under the modal.
   - Move around in FP → movement is identical to before (no drift, no
     unexpected angle changes).
   - Toggle back to top-down → framing unchanged.
3. Manual (touch): drag on the right side rotates yaw and pitch; the joystick
   is unaffected; pausing hides the hands.

---

## Glossary

| Location                                        | Type     | Description                                                         |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `src/game/ui/FirstPersonOverlay.ts`             | file     | Player-hands overlay factory; owns the hands `z-index`.             |
| `src/game/core/shared/components/CameraLook.ts` | file     | NEW. SAB-backed `yaw`/`pitch` component on `world.cameraEid`.       |
| `src/game/core/shared/components/CameraMode.ts` | file     | Existing 0=top-down / 1=first-person mode component.                |
| `src/game/core/bootstrap/setup.ts`              | file     | `setupWorld()`; registers `CameraMode` + new `CameraLook`.          |
| `src/game/gameplay/cameraMouseController.ts`    | file     | Mouse yaw/pitch deltas + gesture-safe pointer lock.                 |
| `src/game/gameplay/cameraTouchController.ts`    | file     | Touch yaw/pitch deltas (right-side drag).                           |
| `src/game/gameplay/characterController.ts`      | file     | Player movement; consumes yaw only. NOT otherwise changed.          |
| `src/game/systems/cameraSystem.ts`              | file     | Camera modes; integrates look, clamps pitch, exposes `getYaw()`.    |
| `src/game/main.ts::handlePointerLock`           | function | Unlock-only guard; per-frame lock call removed.                     |
| `src/game/main.ts::tickVisuals`                 | function | Gates hands visibility on camera mode **and** `PLAYING`.            |
| `src/game/main.ts::setupCameraAndInput`         | function | Wires `consumeLook` and ECS yaw into controller.                    |
| `src/game/main.ts::createGameSystems`           | function | Adds the canvas `click` gesture lock + cleanup.                     |
| `app/scenes/phase-1/page.tsx`                   | file     | `#hud-container` stacking context (`z-10`) causing the overlay bug. |
| `src/game/ui/PlayerHUD.ts` / `LevelUpModal.ts`  | files    | Menu overlays (`z 100` / `1001`) that must stay above the hands.    |

---

## Implementation Notes

Delivered in two passes. Files touched:

| File                                            | Change                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `src/game/ui/FirstPersonOverlay.ts`             | `z-index: 100 → 5` (below the `#hud-container` stacking context).       |
| `src/game/main.ts::tickVisuals`                 | Hands visible only when `isFirstPerson() && status === PLAYING`.        |
| `src/game/core/shared/components/CameraLook.ts` | NEW: SAB-backed `yaw`/`pitch`.                                          |
| `src/game/core/bootstrap/setup.ts`              | Registers `CameraLook` on `world.cameraEid`.                            |
| `src/game/gameplay/cameraMouseController.ts`    | `consumeLook()` yaw+pitch, locked-only accumulation, gesture-safe lock. |
| `src/game/gameplay/cameraTouchController.ts`    | `consumeLook()` with vertical drag; `getAngle` removed.                 |
| `src/game/systems/cameraSystem.ts`              | Integrates look into ECS, clamps pitch, exposes `getYaw()`.             |
| `src/game/main.ts`                              | Unlock-only guard, canvas-click + FP-toggle gesture lock, ECS yaw.      |
| `src/game/main.ts::wirePointerLock`             | Pause on `pointerlockchange` (single-Esc pause), gesture-only lock.     |
| `src/game/main.ts::setupHud`                    | Relock on Resume / level-up pick (same click).                          |
| `src/game/systems/cameraSystem.test.ts`         | NEW: 4 tests (horizontal aim, up/down, clamp, top-down untouched).      |

### Deliberate decisions

- **Per-frame `requestPointerLock()` removed.** This was the direct cause of
  `NotAllowedError: Too many pointer lock requests`, `WrongDocumentError`,
  `SecurityError` (re-lock after Esc) and `NotAllowedError: A user gesture is
required`. Lock is now requested only inside the canvas `click` and the FP
  toggle `click`.
- **Escape no longer auto-relocks.** Standard FPS behaviour: after Esc the user
  clicks the canvas to look again. Auto-relocking is impossible (gesture-gated)
  and was the source of the cooldown errors.
- **Hands hidden on pause is intentional** and unrelated to the pointer-lock
  errors — different code path (`tickVisuals` visibility vs. lock guard).
- **Esc → pause is driven by `pointerlockchange`, not `keydown`.** The browser
  swallows the first `Esc` to release the lock; in top-down mode `Esc` still
  reaches the page and the input system handles it.
- **Esc-resume cannot relock** (`Escape` does not grant transient activation),
  so after resuming with `Esc` the player clicks the canvas once. Resuming via
  the HUD button / level-up card relocks in the same click.
- **Pitch 0 is horizontal.** The legacy FP camera tilted slightly down; that
  hack is gone.
- **`getAngle` API removed** from both controllers. `main.ts` is the only
  caller and now reads the ECS yaw via `cameraSystem.getYaw()`.

### Validation

`eslint` ✅ · `tsc --noEmit` ✅ · `depcruise` ✅ · `knip` ✅ · `lizard` ✅ ·
`prettier --check` ✅ · `vitest` 34 pass / 1 pre-existing unrelated failure
(`meta.test.ts:80`).
