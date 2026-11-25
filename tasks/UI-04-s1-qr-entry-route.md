# UI-04 — S1 QR entry route

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | S | hydrogen | P0 | 3.1 | UI-01, BE-08 | ✅ Done 2026-11-25 |

## Goal
Every QR scan lands here and is routed correctly.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/user-flows.md Flow 1, 2

## Do
- `/r/:code`: resolve cafeteria via `api.getCafeteria`; no saved prefs → `/welcome?next=…`, else → `/r/:code/today`
- Invalid code state with list of cafeterias
- Call `api.logScan` once per visit

- Add a `/` route that redirects to `/welcome` (Header back button falls back to `/` on deep links — UI-01 review)

## Do not
- —

## Acceptance criteria
- [x] Works with mock fixtures
- [x] Invalid code shows the error state, not a blank page

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-04-s1-qr-entry-route`
