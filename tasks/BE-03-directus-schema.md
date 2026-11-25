# BE-03 — Directus schema

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 0.2, 1.1 | BE-02 | ✅ Done 2026-11-25 |

## Goal
Implement every collection, field and relation in the data specification.

## Read first
- product/data-specification.md

## Do
- Collections: cafeteria, corner, dish, dish_translation, ingredient, dish_ingredient, allergen, dish_allergen, diet_tag, ingredient_diet_tag, daily_menu, menu_item, scan_event
- Enums and defaults exactly as specified
- Export `directus/snapshots/schema.yaml` (`directus schema snapshot`), conventions per data-specification.md (D-019)

## Do not
- Do not add fields that are not in the spec; propose spec changes instead

## Acceptance criteria
- [x] `directus schema apply directus/snapshots/schema.yaml` on an empty database recreates the schema
- [x] Names match `data-specification.md` 1:1

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-03-directus-schema`
