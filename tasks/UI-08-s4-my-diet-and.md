# UI-08 — S4 My diet and local preferences

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Antigravity (Gemini) | M | argon | P0 | 4.2, BR8 | UI-03, BE-09 | ✅ 2026-11-25 |

## Goal
Students set what they avoid once; it stays on their phone.

## Read first
- GEMINI.md (your rules)
- product/screen-specification.md
- product/screen-specification.md § S4
- product/data-specification.md § Client-side data

## Do
- `lib/prefs.ts`: read/write prefs in localStorage (schema from `types.ts`). Always read through `sanitizePrefs()` and start from `DEFAULT_PREFS`; if it returns `onboarded: false` for stored data, send the student to S4 to check their diet
- Language: the source of truth is `du-menu-scan:lang` owned by `src/lib/i18n.ts` (UI-01). `lib/prefs.ts` is the only writer of `du-menu-scan:prefs`; when the student changes language in S4 call `changeAppLanguage()` and keep `prefs.lang` as a mirror only
- Form: language, avoid checkboxes, spice tolerance, diet type; halal/vegetarian auto-tick via `expandDietType`
- Privacy note “Your settings stay on this phone.”

## Do not
- Never send prefs to the server

## Acceptance criteria
- [ ] Saving updates S2 warnings immediately
- [ ] Prefs survive reload; clearing storage resets to onboarding

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/ui-08-s4-my-diet-and`
