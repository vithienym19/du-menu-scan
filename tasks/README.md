# Task Board

Single source for who does what. Specs live in `../product/`; this folder turns them into executable tasks.

## Ownership

| Area | Owner | Rules |
|---|---|---|
| Product, specs, backlog, task breakdown | Claude — PM | `../CLAUDE.md` |
| Backend, data model, shared logic, infra, CI (`BE-*`) | Claude — lead engineer | `../CLAUDE.md` |
| UI in `apps/web` (`UI-*`) | Antigravity (Gemini models) | `../GEMINI.md` |
| Review of every pull request | Claude `reviewer` sub-agent | `../.claude/agents/reviewer.md` |
| Merge to `main` | Thiện (product owner) | — |

## Model per UI task (Antigravity)

| Size | Meaning | Model |
|---|---|---|
| S | One component or simple route, little logic | `hydrogen` |
| M | Several components, state or integration | `agon` |
| L | Full screen with many states, safety rules, PWA/offline | `nexon` |

Edit this table if the model names or tiers change; task files only refer to the size.

## Waves

Tasks in the same wave can run in parallel once their dependencies are done. UI work starts in wave 2 because `BE-08` provides mock fixtures (`VITE_USE_MOCK=true`), so the UI never waits for the live backend.

| Wave | ID | Task | Owner | Size | Model | Pri | Depends on | Done |
|---|---|---|---|---|---|---|---|---|
| 1 | [DS-01](../product/design-system.md) | Design system (colours, type, components) | Claude | M | — | P0 | — | ✅ 2026-11-24 |
| 1 | [BE-01](BE-01-monorepo-and-tooling.md) | Monorepo and tooling | Claude | S | — | P0 | — | ✅ 2026-11-24 |
| 1 | [BE-10](BE-10-i18n-key-catalogue.md) | i18n key catalogue | Claude | S | — | P0 | — | ✅ 2026-11-24 |
| 2 | [BE-02](BE-02-docker-compose-postgresql-plus.md) | Docker Compose: PostgreSQL + Directus | Claude | S | — | P0 | BE-01 | ✅ 2026-11-25 |
| 2 | [BE-18](BE-18-more-languages.md) | Add uz, mn, ne + single language list | Claude | S | — | P0 | BE-10 | ✅ 2026-11-25 |
| 2 | [BE-08](BE-08-shared-types-api-client.md) | Shared types, API client and mock fixtures | Claude | M | — | P0 | BE-01 | ✅ 2026-11-25 |
| 2 | [BE-14](BE-14-ci-pipeline.md) | CI pipeline | Claude | S | — | P0 | BE-01 | ✅ 2026-11-24 |
| 2 | [UI-01](UI-01-app-shell-theme-and.md) | App shell, theme and routing | Antigravity | M | agon | P0 | BE-01, BE-10 | ☐ |
| 3 | [BE-03](BE-03-directus-schema.md) | Directus schema | Claude | M | — | P0 | BE-02 | ☐ |
| 3 | [BE-09](BE-09-warning-logic-safety-critical.md) | Warning logic (safety-critical) | Claude | M | — | P0 | BE-08 | ✅ 2026-11-25 |
| 3 | [UI-02](UI-02-icon-row-spice-meter.md) | Icon row, spice meter and badges | Antigravity | S | hydrogen | P0 | UI-01 | ☐ |
| 3 | [UI-03](UI-03-filter-chips-and-language.md) | Filter chips and language switch | Antigravity | S | hydrogen | P0 | UI-01 | ☐ |
| 3 | [UI-04](UI-04-s1-qr-entry-route.md) | S1 QR entry route | Antigravity | S | hydrogen | P0 | UI-01, BE-08 | ☐ |
| 3 | [UI-05](UI-05-dish-card.md) | Dish card | Antigravity | S | hydrogen | P0 | UI-02 | ☐ |
| 4 | [BE-04](BE-04-roles-and-permissions.md) | Roles and permissions | Claude | S | — | P0 | BE-03 | ☐ |
| 4 | [BE-05](BE-05-derived-diet-tags-and.md) | Derived diet tags and publish guard | Claude | M | — | P0 | BE-03 | ☐ |
| 4 | [BE-06](BE-06-reference-data-seed.md) | Reference data seed | Claude | S | — | P0 | BE-03 | ☐ |
| 4 | [UI-06](UI-06-s2-todays-menu.md) | S2 Today's menu | Antigravity | L | nexon | P0 | UI-03, UI-04, UI-05, BE-09 | ☐ |
| 4 | [UI-07](UI-07-s3-dish-detail-safety-critical.md) | S3 Dish detail (safety-critical) | Antigravity | L | nexon | P0 | UI-02, BE-09 | ☐ |
| 4 | [UI-08](UI-08-s4-my-diet-and.md) | S4 My diet and local preferences | Antigravity | M | agon | P0 | UI-03, BE-09 | ☐ |
| 4 | [UI-09](UI-09-s0-welcome.md) | S0 Welcome | Antigravity | S | hydrogen | P1 | UI-08 | ☐ |
| 5 | [BE-07](BE-07-dish-dictionary-seed-30.md) | Dish dictionary seed (~30 dishes) | Claude | M | — | P0 | BE-05, BE-06 | ☐ |
| 5 | [BE-11](BE-11-today-menu-endpoint.md) | Today-menu endpoint | Claude | M | — | P1 | BE-05 | ☐ |
| 5 | [UI-10](UI-10-pwa-and-offline.md) | PWA and offline | Antigravity | L | nexon | P1 | UI-06, UI-07 | ☐ |
| 5 | [UI-11](UI-11-accessibility-and-performance-pass.md) | Accessibility and performance pass | Antigravity | M | agon | P0 | UI-06, UI-07, UI-08 | ☐ |
| 5 | [UI-12](UI-12-end-to-end-tests.md) | End-to-end tests | Antigravity | M | agon | P0 | UI-06, UI-07, UI-08 | ☐ |
| 6 | [BE-12](BE-12-scan-analytics.md) | Scan analytics | Claude | S | — | P0 | BE-04 | ☐ |
| 6 | [BE-13](BE-13-qr-code-generator.md) | QR code generator | Claude | S | — | P0 | BE-03 | ☐ |
| 6 | [BE-15](BE-15-staging-deployment.md) | Staging deployment | Claude | M | — | P0 | BE-04, BE-14 | ☐ |
| 6 | [BE-16](BE-16-translation-review-workflow.md) | Translation review workflow | Claude | S | — | P1 | BE-04 | ☐ |
| 6 | [BE-17](BE-17-copy-previous-menu.md) | Copy previous menu | Claude | S | — | P1 | BE-03 | ☐ |

## Dispatching to Antigravity

Ready-to-paste prompts for every UI task, in order, are in [`DISPATCH.md`](DISPATCH.md).

## How a task moves

1. Owner picks a task whose dependencies are ✅.
2. Branch `feat/<task-id>-<name>`; work only inside the task's scope.
3. Open a pull request; paste the task's acceptance criteria and the report.
4. Claude reviews (reviewer sub-agent) → APPROVE or CHANGES REQUESTED (max 2 rounds).
5. Thiện merges; Claude ticks the task here (☐ → ✅ + date) and the story in `../product/development-backlog.md`.

## Human-only items

| Item | Who | Needed by |
|---|---|---|
| Confirm dish ingredients and allergens | Korean teammate (+ cafeteria staff if possible) | BE-07 |
| Check the official MFDS allergen list | Team | BE-06 |
| Team domain and hosting account | Thiện | BE-15 |
| Review vi translations | Vietnamese teammates | BE-10 |
| Review zh, uz, mn, ne translations (drafts) | Native-speaking students — ask the international office or student associations | BE-10, BE-18 |
| Usability test with 5 international students | Team | after UI-11 |
