# BE-09 — Warning logic (safety-critical)

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 4.3, BR6 | BE-08 | ✅ Done 2026-11-25 |

## Goal
Single source of truth for OK / Caution / Avoid / Not verified.

## Read first
- product/technical-architecture.md §4
- product/product-specification.md BR6

## Do
- `packages/shared/src/warning.ts`: `evaluate(dish, prefs)` and `expandDietType(prefs)` (halal, vegetarian)
- `sortByStatus` and `applyFilters` helpers for S2
- Unit tests incl. hidden ingredients, unknown data, halal expansion, spice tolerance

## Do not
- Never return `ok` when data is unverified or incomplete

## Acceptance criteria
- [x] ≥ 95% branch coverage (100 %; enforced by `vitest.config.ts` thresholds)
- [x] All BR6 cases have a named test (`BR6-*` in `warning.test.ts`)

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-09-warning-logic-safety-critical`
