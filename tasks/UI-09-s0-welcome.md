# UI-09 — S0 Welcome

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | S | hydrogen | P1 | 4.1 | UI-08 | ✅ 2026-11-25 |

## Goal
First-visit onboarding in two taps.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/user-flows.md Flow 1

## Do
- Logo, 4 language buttons (pre-selected), “Set my diet” → S4, “Skip” → S2
- Shown only when no prefs exist

- Validate `?next=` before navigating: accept only an in-app path matching `/r/:code/today` (single leading `/`, never `//` or a URL); otherwise go to `/`

## Do not
- —

## Acceptance criteria
- [ ] Returning visitor never sees S0

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-09-s0-welcome`
