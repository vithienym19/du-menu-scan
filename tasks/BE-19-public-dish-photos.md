# BE-19 — Public dish photos

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 3.2, 3.4 | BE-04 | ✅ 2026-11-25 |

## Goal
Students can see photos of published dishes, and nothing else in file storage.

## Read first
- directus/README.md (Roles and permissions, known gap)
- product/technical-architecture.md §3, §6

## Do
- Add an O2M alias on `directus_files` for the `dish.photo` relation (`one_field`) via `create-schema.mjs`, re-export the snapshot
- Public read on `directus_files` filtered to files used as photo of a published dish; `/assets/<id>` works for those only
- Image transforms for mobile (WebP, width 400/800) documented for UI-05/UI-07

## Do not
- Never grant public read on all files

## Acceptance criteria
- [ ] Anonymous `/assets/<id>` returns the photo of a published dish and 403 for any other file

Branch: `feat/be-19-public-dish-photos`
