# BE-08 — Shared types, API client and mock fixtures

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 3.1–3.4 | BE-01 | ✅ Done 2026-11-25 |

## Goal
Give the UI a typed data layer it can build against before the backend is live.

## Read first
- product/data-specification.md
- product/technical-architecture.md §3

## Do
- `packages/shared/src/types.ts`: Cafeteria, Corner, DishView, MenuView, Prefs, WarningStatus …
- `packages/shared/src/api.ts`: `getCafeteria(code)`, `getTodayMenu(code)`, `getDish(id)`, `logScan(…)`
- `packages/shared/src/fixtures/`: realistic mock menu (≥ 3 corners, ≥ 8 dishes incl. hidden ingredients, unverified dish, missing vi translation, closed day, empty day)
- Mock switch: `VITE_USE_MOCK=true` makes `api.ts` return fixtures

## Do not
- No UI code

## Acceptance criteria
- [x] UI can render every screen state from fixtures alone
- [x] Types compile in strict mode

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-08-shared-types-api-client`
