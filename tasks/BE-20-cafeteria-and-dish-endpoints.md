# BE-20 — Cafeteria and dish endpoints

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 3.1, 3.4 | BE-11 | ✅ 2026-11-25 |

## Goal
S1 and S3 work against the live backend (`VITE_USE_MOCK=false`), not only on mock fixtures.

## Read first
- packages/shared/src/api.ts (`ENDPOINTS`), packages/shared/src/types.ts
- directus/extensions/du-menu-endpoint (BE-11: raw knex, explicit status filters, pure mapper in `map.js`)
- product/product-specification.md BR1, BR2, BR6; decision D-024

## Do
- Add to the `du` endpoint extension: `GET /du/cafeterias` (active cafeterias), `GET /du/cafeterias/{code}` (404 if unknown or inactive), `GET /du/dishes/{id}` (published dishes only, approved translations only, same `DishView` mapping as BE-11)
- Reuse the BE-11 mapper; unknown values fail towards the strict side
- Tests: unit tests for mapping, plus a handler test with a stub knex that asserts the safety filters (`is_active`, `status=published`, `status=approved`) — also add this test for the BE-11 today-menu handler (BE-11 review follow-up)
- Verify on an isolated live stack (own compose project and ports, env vars inline, no `.env` written)

## Do not
- Never return a draft dish or an unapproved translation

## Acceptance criteria
- [ ] With `VITE_USE_MOCK=false`, S1 lists cafeterias and S3 shows a published dish
- [ ] Draft dish id → 404
- [ ] Handler tests fail if a safety filter is removed

Branch: `feat/be-20-cafeteria-and-dish-endpoints`
