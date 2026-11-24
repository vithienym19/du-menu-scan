# UI-01 — App shell, theme and routing

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | M | agon | P0 | 3.x | BE-01, BE-10 | ☐ Todo |

## Goal
Create the student PWA skeleton every screen lives in.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/technical-architecture.md §2, §5

## Do
- Vite + React + TypeScript app in `apps/web`, Tailwind with design tokens (colours incl. status colours, type scale, spacing)
- React Router routes: `/r/:code`, `/r/:code/today`, `/dish/:id`, `/welcome`, `/settings`, 404
- i18next wired to `src/i18n/*.json`, language auto-detect + persisted choice
- Header component with back button, title and `KO | EN | VI | 中` switch

## Do not
- Do not edit `packages/shared` or the i18n key set (ask for new keys)

## Acceptance criteria
- [ ] All routes render placeholder pages on a 375 px screen
- [ ] Switching language updates header text instantly and survives reload

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-01-app-shell-theme-and`
