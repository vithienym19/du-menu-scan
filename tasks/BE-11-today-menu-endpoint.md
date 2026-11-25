# BE-11 — Today-menu endpoint

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P1 | 3.2 | BE-05 | ✅ 2026-11-25 |

## Goal
One small, pre-shaped response for S2 to keep first load fast after a QR scan.

## Read first
- product/technical-architecture.md §3, §6

## Do
- Directus custom endpoint `GET /menu/{code}/today` returning MenuView (matches `types.ts`)
- Includes only published dishes and approved translations; fallback info per BR2

## Do not
- —

## Acceptance criteria
- [ ] Response ≤ 100 KB for a typical day
- [ ] `api.ts` uses it when `VITE_USE_MOCK=false`

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-11-today-menu-endpoint`
