# BE-06 — Reference data seed

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 1.2, BR4 | BE-03 | ✅ Done 2026-11-25 |

## Goal
Seed allergens, diet tags and the ingredient vocabulary.

## Read first
- product/data-specification.md § allergen, diet_tag, ingredient

## Do
- `directus/seed/allergens.csv` from the current official MFDS allergen labelling list — cite source and date in the file header
- `diet_tags.csv`, `ingredients.csv` (ko name + `names` json for other languages) with ingredient → diet tag mapping
- Idempotent import script

- Allergen codes must match `ALLERGEN_IMPLIES_TAG` in `packages/shared/src/warning.ts` (pork, beef, chicken, shrimp, crab, shellfish, squid, mackerel, oyster, abalone, mussel); update that map in the same PR if a code differs, and add a test that every key of the map exists in the seeded allergen list

## Do not
- Do not invent allergens; use the official list only

## Acceptance criteria
- [x] Import runs twice without duplicates
- [x] Allergen source and date recorded

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-06-reference-data-seed`
