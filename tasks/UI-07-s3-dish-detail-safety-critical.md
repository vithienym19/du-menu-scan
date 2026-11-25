# UI-07 — S3 Dish detail (safety-critical)

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | L | neon | P0 | 3.4, BR3, BR6 | UI-02, BE-09 | ☐ Todo |

## Goal
Full dish information with the safety rules always visible.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/screen-specification.md § S3
- product/product-specification.md BR2, BR3, BR6

## Do
- Photo, names (ko + selected, others collapsible), description, SpiceMeter, main ingredients, ⚠ hidden ingredients, allergens, halal/vegetarian info from `dietCompatibility()` (`null` = show "unknown", never ✓)
- Personal warning banner with reasons from `evaluate()`
- Safety footer on every dish: “Last verified {date}” + “Please confirm with staff if you have a severe allergy.”
- Unverified dish: grey banner, never shown as OK. If `evaluate()` returns `avoid` with `unverified: true`, show the Avoid banner **and** the "Not verified" note

## Do not
- Never hide or shorten the safety footer

## Acceptance criteria
- [ ] Footer present on 100% of dishes in fixtures
- [ ] Unverified fixture dish shows Not verified

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-07-s3-dish-detail-safety-critical`
