# BE-10 — i18n key catalogue

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 3.5 | none | ☐ Todo |

## Goal
Define every user-facing string once, so UI work never hard-codes text.

## Read first
- product/screen-specification.md

## Do
- `apps/web/src/i18n/{ko,en,vi,zh}.json` with the same keys for S0–S4, states, badges, safety footer
- ko, en, vi filled; zh drafted and listed for review

## Do not
- No component code

## Acceptance criteria
- [ ] Key sets identical in all four files (checked by a test)

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-10-i18n-key-catalogue`
