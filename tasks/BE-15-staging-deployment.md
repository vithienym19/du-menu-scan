# BE-15 — Staging deployment

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | M | — | P0 | 0.4 | BE-04, BE-14 | ☐ Todo |

## Goal
A shareable staging URL for testing on real phones.

## Read first
- product/technical-architecture.md §2.2

## Do
- Directus + PostgreSQL on the team server/VPS with HTTPS
- Web on Vercel or Cloudflare Pages
- Team domain and DNS
- Deployment notes in `directus/README.md`

## Do not
- No secrets in the repository

## Acceptance criteria
- [ ] Staging menu opens on a phone over mobile data via QR

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-15-staging-deployment`
