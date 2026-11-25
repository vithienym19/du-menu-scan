# UI-01 — App shell, theme and routing

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | M | argon | P0 | 3.x | BE-01, BE-10 | ☐ Todo |

## Goal
Create the student PWA skeleton every screen lives in.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/design-system.md (colours, type, spacing, components — decided, do not change)
- product/technical-architecture.md §2, §5

## Do
- Vite + React + TypeScript app in `apps/web` (extend the existing `apps/web/package.json`); Tailwind CSS v4 via `@tailwindcss/vite`
- `src/index.css`: `@import "tailwindcss"; @import "@du-menu-scan/shared/design/theme.css";` plus the Pretendard dynamic-subset CSS from the `pretendard` package — do not define new colours or font sizes
- React Router routes: `/r/:code`, `/r/:code/today`, `/dish/:id`, `/welcome`, `/settings`, 404
- i18next wired to `src/i18n/*.json`, language auto-detect + persisted choice
- Header component with back button, title and a language button (globe icon + native name)
- `LanguagePicker` bottom sheet listing `LANGUAGES` from `@du-menu-scan/shared` by native name; set `<html lang>` on change

## Do not
- Do not edit `packages/shared` (incl. `theme.css`) or the i18n key set (ask for new keys)
- Do not use raw hex colours or Tailwind default palette colours (`bg-blue-500` …); use the tokens (`bg-brand`, `text-ink-muted`, `bg-avoid-soft` …)

## Acceptance criteria
- [ ] Uses only design tokens; Pretendard loads with `font-display: swap`
- [ ] All routes render placeholder pages on a 375 px screen
- [ ] Switching language updates header text instantly and survives reload

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-01-app-shell-theme-and`
