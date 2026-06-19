# Feature: Game Plugin System

> **Status**: `complete`

This file is the primary execution and maintenance contract for the feature.

## What

Provide a plugin-based architecture for modular game features using `GamePlugin` interface and `SystemRegistry`.

## Acceptance Criteria

- [x] **AC1**: `GamePlugin` interface defines `install(ctx: GameContext)` and optional `uninstall(ctx)`.
- [x] **AC2**: `GameContext` holds `world`, `systems: SystemRegistry`, `resources: Map<string, unknown>`.
- [x] **AC3**: `SystemRegistry` stores named systems, runs all in order on `run(world)`.

## Details

### Constraints

- `System` type is `(world: World) => World` — pure functional.
- Plugins call `ctx.systems.add()` during install to register systems.

### Out of Scope

- No lifecycle hooks beyond install/uninstall.
- No dependency ordering between plugins.

---

## Dependencies

### Feature Dependencies

- BitECS `World` type.

### External Dependencies

- None.

---

## Technical Considerations

### Performance

- O(n) run over registered systems per frame.

### Security

- Not applicable.

### Backward Compatibility

- Currently unused by `main.ts` — prepared for future use.

---

## Glossary

| Location                                         | Type      | Description                                                                   |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------- |
| `src/game/core/plugins/index.ts`                 | module    | Plugin system types: `System`, `SystemRegistry`, `GameContext`, `GamePlugin`. |
| `src/game/core/plugins/index.ts::SystemRegistry` | class     | Named system container with `add`, `remove`, `run`.                           |
| `src/game/core/plugins/index.ts::GamePlugin`     | interface | `install` / `uninstall` contract.                                             |
