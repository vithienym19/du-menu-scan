# BE-04 — Roles and permissions

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 0.3 | BE-03 | ☐ Todo |

## Goal
Lock down what the public can see and what staff can change.

## Read first
- product/technical-architecture.md §3
- product/product-specification.md BR7, BR8

## Do
- Public: read published cafeteria/menu/dish data and approved translations only; create scan_event only
- Roles: Staff (menus, dishes), Reviewer (translations), Admin (all)

## Do not
- Public must not read draft dishes, draft translations or scan_event

## Acceptance criteria
- [ ] Anonymous API call for a draft dish or draft translation returns nothing
- [ ] Anonymous POST to any collection except scan_event is rejected

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-04-roles-and-permissions`
