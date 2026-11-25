# UI-02 — Icon row, spice meter and badges

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | S | hydrogen | P0 | 3.2, 3.3 | UI-01 | ✅ Done 2026-11-25 |

## Goal
Reusable visual building blocks for dish information.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md

## Do
- `IconRow` (pork, beef, chicken, seafood, vegetarian) — each icon with a text label
- `SpiceMeter` (0–4), `HiddenIngredientTag` (⚠ + name), `WarningBadge` (OK / Caution / Avoid / Not verified)

## Do not
- Do not compute warning status inside components — take it as a prop

## Acceptance criteria
- [x] Meaning never relies on colour alone
- [x] Contrast WCAG AA
- [x] Storybook-style demo page or test renders each variant

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-02-icon-row-spice-meter`
