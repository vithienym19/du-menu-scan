# i18n resources

Owner: Claude (lead engineer). UI code reads these keys; it never adds or renames them. Ask for new keys in the PR.

| File | Status |
|---|---|
| `en.json` | Source language for the key set |
| `ko.json` | Done — Korean teammate to proofread |
| `vi.json` | Done — Vietnamese teammate to proofread |
| `zh.json` | **Draft** — needs review by a Chinese-speaking student before the pilot |
| `uz.json` | **Draft** — needs an Uzbek-speaking reviewer |
| `mn.json` | **Draft** — needs a Mongolian-speaking reviewer |
| `ne.json` | **Draft** — needs a Nepali-speaking reviewer |

## Adding a language

1. Add an entry to `packages/shared/src/languages.json` and its code to `SUPPORTED_LANGUAGES` in `packages/shared/src/languages.ts`.
2. Copy `en.json` to `<code>.json` and translate every value.
3. Run `npm test` — the check fails until keys and placeholders match.
4. Dish data needs no change: missing dish translations fall back to English (BR2) until a reviewer approves them.

Rules

- All files must have exactly the same keys and the same `{{placeholders}}` (checked by `npm run check:i18n`).
- Interpolation uses i18next syntax: `{{date}}`, `{{item}}`, `{{name}}`.
- Format dates and prices with `Intl`, not in these strings.
