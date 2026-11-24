# i18n resources

Owner: Claude (lead engineer). UI code reads these keys; it never adds or renames them. Ask for new keys in the PR.

| File | Status |
|---|---|
| `en.json` | Source language for the key set |
| `ko.json` | Done — Korean teammate to proofread |
| `vi.json` | Done — Vietnamese teammate to proofread |
| `zh.json` | **Draft** — needs review by a Chinese-speaking student before the pilot |

Rules

- All four files must have exactly the same keys and the same `{{placeholders}}` (checked by `npm run check:i18n`).
- Interpolation uses i18next syntax: `{{date}}`, `{{item}}`, `{{name}}`.
- Format dates and prices with `Intl`, not in these strings.
