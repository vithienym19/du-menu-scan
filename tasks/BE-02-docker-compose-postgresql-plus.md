# BE-02 — Docker Compose: PostgreSQL + Directus

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 0.2 | BE-01 | ☐ Todo |

## Goal
One command starts the backend locally for the whole team.

## Read first
- product/technical-architecture.md §2, §2.2

## Do
- `docker-compose.yml` with PostgreSQL and Directus (pinned versions, named volumes)
- `.env.example` with every variable and placeholder values
- `directus/README.md`: start, stop, reset, admin login

## Do not
- Never commit a real `.env`

## Acceptance criteria
- [ ] `docker compose up -d` gives a working Directus admin at localhost
- [ ] `docker compose down -v` then up again starts from a clean state

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-02-docker-compose-postgresql-plus`
