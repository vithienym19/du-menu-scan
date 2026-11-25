# UI-06 — S2 Today's menu

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | L | neon | P0 | 3.2, 3.6, 4.4 | UI-03, UI-04, UI-05, BE-09 | ☐ Todo |

## Goal
The core screen: decide what to eat in under 10 seconds.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/screen-specification.md § S2
- product/user-flows.md Flow 2, 3, 5
- packages/shared/src/warning.ts (use, do not change)

## Do
- Sections per corner; cards sorted OK → Caution → Not verified → Avoid via `sortByStatus` (D-017)
- Filters via `applyFilters` (session only)
- States: loading skeleton, empty (menu not available + hours), closed, offline (last menu + “may be outdated”), error
- ⚙ button to S4

## Do not
- Do not re-implement warning, sorting or filtering logic

## Acceptance criteria
- [ ] Every state reachable with fixtures
- [ ] Interactive ≤ 2 s on throttled 4G (Lighthouse)
- [ ] Avoid dishes are visually distinct with text, not colour only

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-06-s2-todays-menu`
