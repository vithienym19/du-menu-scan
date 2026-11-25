# UI-12 — End-to-end tests

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | M | argon | P0 | 6.3 | UI-06, UI-07, UI-08 | ☐ Todo |

## Goal
Protect the main flows from regressions.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/user-flows.md

## Do
- Playwright with mock fixtures: QR → S2 → S3 → back; first visit → S0 → S4 → S2 with Avoid labels; language switch; invalid code

## Do not
- —

## Acceptance criteria
- [ ] E2E suite passes in CI

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-12-end-to-end-tests`
