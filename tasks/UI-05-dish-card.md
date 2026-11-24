# UI-05 — Dish card

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | S | hydrogen | P0 | 3.2 | UI-02 | ☐ Todo |

## Goal
The card students scan in the menu list.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/screen-specification.md § S2

## Do
- `DishCard`: 64×64 photo (lazy), Korean name, translated name, IconRow, hidden-ingredient tag, price, WarningBadge, red outline for Avoid
- Translation-pending marker when falling back (BR2)

## Do not
- —

## Acceptance criteria
- [ ] Renders every fixture dish correctly, incl. unverified and missing translation

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-05-dish-card`
