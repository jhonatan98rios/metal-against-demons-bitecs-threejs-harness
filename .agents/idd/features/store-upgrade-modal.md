# Feature: Store Upgrade Confirmation Modal

> **Status**: `draft`

This file is the primary execution and maintenance contract for the feature.

## What

Show an intermediate modal with the item's description before spending coins, so a click on a shelf item confirms instead of auto-upgrades.

## Acceptance Criteria

- [x] **AC1**: Clicking a store item opens a modal showing `item.name`, `item.description`, current level (`level/max`), and price.
- [x] **AC2**: A confirm action spends the coins, upgrades the item, persists levels, and closes the modal. Implemented: `UpgradeModal.onConfirm → upgrade(selected.id)` (see below).
- [x] **AC3**: A cancel/close action dismisses the modal without spending or upgrading.
- [x] **AC4**: Maxed items still open the modal (for info) but cannot be upgraded further — no spend possible.
- [x] **AC5**: Insufficient coins disables confirm and shows the price in the disabled state, matching existing shelf behavior.

## Details

### Constraints

- Modal is a client component; navigation stays full-page (`useState` + `useEffect`, as today).
- Reuse the exact pricing path: `upgradeCost(totalUpgrades(levels))` — one shared cost source for shelf and modal.
- Portuguese copy only (item names/descriptions are PT-BR); no i18n scaffolding.

### Out of Scope

- No animated transitions beyond a single Tailwind class.
- No sound, no multi-item selection, no "recently viewed" history.
- No server-side purchase flow — coins come from `player.money` only.

---

## Dependencies

### Feature Dependencies

- Store shelf UI (`app/store/page.tsx`) — the click entry point and pricing logic live here today; the modal replaces the inline upgrade button.

### External Dependencies

- React state for modal open/close + selected item id.
- `spendMoney(player, cost)` from `@/src/game/core/player/meta`.

---

## Technical Considerations

### Performance

- Modal renders only when open — no per-item overlay, negligible overhead.

### Security

- Confirm handler re-reads the live player state before spending; never trusts a stale coins value captured at click time.

### Backward Compatibility

- Pure UX change: existing `upgradeItem`/`saveItemLevels` and pricing functions are reused unchanged. No data migration.

---

## API Contract (if applicable)

```text
openUpgrade(id): void        — select item, render modal
upgrade(id: string): void     — shared handler (app/store/page.tsx); spend first, then level up. Wired to UpgradeModal.onConfirm.
closeUpgrade(): void         — dismiss without side effects
```

---

## Glossary

| Location                                       | Type     | Description                                                       |
| ---------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `app/store/page.tsx`                           | file     | Store page: shelf UI, pricing, and upgrade entry point.           |
| `app/store/page.tsx::upgrade`                  | function | Current inline handler; becomes the confirm action for the modal. |
| `src/game/core/store/upgrades.ts::STORE_ITEMS` | constant | Item catalog carrying `name`, `description`.                      |
| `src/game/core/store/upgrades.ts::upgradeCost` | function | Soulslike pricing reused by shelf and modal.                      |
| `src/game/core/player/meta.ts::spendMoney`     | function | Deducts coins, returns success flag.                              |
