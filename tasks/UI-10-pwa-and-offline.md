# UI-10 — PWA and offline

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | L | neon | P1 | 3.7 | UI-06, UI-07 | ☐ Todo |

## Goal
Installable app with the last menu available without network.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/technical-architecture.md §2, §6

## Do
- vite-plugin-pwa: manifest, icons, service worker
- Cache last loaded menu + dish details; offline banner “may be outdated”
- Update prompt when a new version is deployed
- Build on `lib/menuCache.ts` (UI-06, D-025) instead of a second cache. Harden it (UI-06 review): reject entries whose `cafeteria.code` differs from the requested code or whose corners/items have the wrong shape; tests for corrupt JSON, other cafeteria, older date; when the cached menu's date is not today, say so (needs an i18n key — ask Claude)

## Do not
- Do not cache API responses forever — menu must refresh when online

## Acceptance criteria
- [ ] Lighthouse PWA installable
- [ ] Airplane mode after one visit still shows the last menu

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-10-pwa-and-offline`
