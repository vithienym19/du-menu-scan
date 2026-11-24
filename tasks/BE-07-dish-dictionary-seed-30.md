# BE-07 — Dish dictionary seed (~30 dishes)

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 1.2 | BE-05, BE-06 | ☐ Todo |

## Goal
Load the most frequent cafeteria dishes so the app has real content.

## Read first
- product/data-specification.md § Seed data

## Do
- Collect frequent dishes from 4–6 weeks of the school's published menus
- `directus/seed/dishes.csv`: ingredients with hidden flags, allergens, spice level, ko/en/vi/zh names
- Mark each dish `verified_by` / `verified_at` only after the Korean teammate confirms it

## Do not
- Do not mark a dish verified without human confirmation

## Acceptance criteria
- [ ] ≥ 30 dishes imported; every published dish passes BR1
- [ ] List of dishes still waiting for verification is in the PR description

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-07-dish-dictionary-seed-30`
