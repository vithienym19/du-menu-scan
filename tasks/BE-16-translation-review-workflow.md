# BE-16 — Translation review workflow

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P1 | 1.4, BR7 | BE-04 | ☐ Todo |

## Goal
Make AI-drafted translations visible only after human approval.

## Read first
- product/product-specification.md BR2, BR7

## Do
- Reviewer view/filter in Directus for `status=draft` translations
- Approve/reject flow and audit fields

## Do not
- —

## Acceptance criteria
- [ ] A draft translation never appears to the public role

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-16-translation-review-workflow`
