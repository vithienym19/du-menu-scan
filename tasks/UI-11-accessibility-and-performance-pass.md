# UI-11 — Accessibility and performance pass

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | M | agon | P0 | 6.1, 6.2 | UI-06, UI-07, UI-08 | ☐ Todo |

## Goal
Meet the non-functional requirements before the usability test.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/technical-architecture.md §6

## Do
- Audit and fix contrast, labels, focus order, 44 px targets, alt text
- Image sizes/WebP, lazy-loading, bundle size check

## Do not
- —

## Acceptance criteria
- [ ] Lighthouse accessibility ≥ 95, performance ≥ 90 on mobile
- [ ] S2 interactive ≤ 2 s on throttled 4G

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-11-accessibility-and-performance-pass`
