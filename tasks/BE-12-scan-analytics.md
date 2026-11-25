# BE-12 — Scan analytics

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 5.2, 5.3, BR8 | BE-04 | ✅ 2026-11-25 |

## Goal
Count usage without collecting personal data.

## Read first
- product/data-specification.md § scan_event
- product/product-specification.md BR8

## Do
- Public create on scan_event (cafeteria, time, lang, entry only)
- Directus Insights panel: scans per day and per language

## Do not
- No IP, device id or user agent stored

## Acceptance criteria
- [ ] Dashboard shows today's scans

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-12-scan-analytics`
