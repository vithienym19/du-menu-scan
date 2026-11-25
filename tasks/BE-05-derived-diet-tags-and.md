# BE-05 — Derived diet tags and publish guard

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 1.3, BR1, BR5 | BE-03 | ☐ Todo |

## Goal
Make the safety rules enforced by the backend, not by people remembering them.

## Read first
- product/product-specification.md BR1, BR5
- product/data-specification.md § Derived values

## Do
- Compute dish diet tags from its ingredients (incl. hidden) — Directus hook extension or database view
- Block `status=published` unless BR1 passes (ko name, approved en translation, spice level, allergens_confirmed)

- Hook validation (D-020): reject a second `daily_menu` for the same cafeteria + date + meal, a second `dish_translation` for the same dish + lang, and duplicate junction pairs (`dish_ingredient`, `dish_allergen`, `ingredient_diet_tag`), with a clear 400 message

## Do not
- Diet tags are never edited by hand

## Acceptance criteria
- [ ] Adding a pork ingredient to a dish makes `pork` appear in its tags without manual edits
- [ ] Publishing an incomplete dish fails with a clear message

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-05-derived-diet-tags-and`
