# BE-18 — Add uz, mn, ne + single language list

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 3.5, F2 | BE-10 | ✅ Done 2026-11-25 |

## Goal
Support more student languages without changing UI code each time.

## Done
- [x] `packages/shared/src/languages.json` + `LANGUAGES` / `SUPPORTED_LANGUAGES`: ko, en, vi, zh, uz, mn, ne with native names, direction and review status
- [x] `apps/web/src/i18n/{uz,mn,ne}.json` (drafts, 87 keys each)
- [x] `npm run check:i18n` reads the list and fails on a missing or extra language file
- [x] Data spec: translations keyed by language code; ingredient/allergen names as `names` json (no per-language columns)
- [x] Screen spec: language picker bottom sheet instead of a fixed `KO | EN | VI | 中` switch
- [x] Font fallback for Cyrillic and Devanagari

## Open
- Native-speaker review of zh, uz, mn, ne strings
- Dish translations for new languages are optional: missing ones fall back to English (BR2)
