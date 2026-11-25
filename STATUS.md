# STATUS

> Living progress log. **Every agent updates this file at the end of each session** (see `AGENTS.md` §2).

**Last updated:** 2026-11-25 (late night) by Claude (lead engineer)

**Local path:** `~/Antigravity/du-menu-scan` (D-016)

## Handoff — read this first

- **Phase 1 — MVP build, wave 5 of 6.** All student screens exist on mock data: S0 welcome, S1 QR entry, S2 today's menu, S3 dish detail, S4 my diet. Backend has schema, permissions, guards, reference seed, the public read endpoints (`/du/menu/{code}/today`, `/du/cafeterias`, `/du/cafeterias/{code}`, `/du/dishes/{id}`), public dish photos, scan analytics dashboard, copy-menu flow and the QR generator.
- **Everything is merged into `main`.** No task branch holds unmerged work.
- **How work flows:** Claude writes specs/tasks, builds or delegates `BE-*` (to `backend-developer`), dispatches `UI-*` to Antigravity via `agy` from a `frontend-developer` sub-agent (D-021), runs the `reviewer` on every branch, merges after APPROVE + green checks on the merged result (D-018).
- **Run it locally:**
  - Web (mock data): `VITE_USE_MOCK=true npm run dev -w @du-menu-scan/web` → http://localhost:5173/r/main-hall
  - Backend: `cp .env.example .env` (fill secrets; on this Mac `DIRECTUS_PORT=8056`), then `npm run backend:up && npm run backend:schema:apply && npm run backend:permissions && npm run backend:seed && npm run backend:dashboard && npm run backend:flows`. Details in `directus/README.md`.
  - QR posters: `npm run qr -- --domain <team domain> --cafeteria "main-hall=학생회관 식당"`
  - Checks: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build -w @du-menu-scan/web`
- **Next tasks:** UI-10 PWA (then UI-11 a11y/perf), UI-12 e2e — prompts in `tasks/DISPATCH.md`; BE-07 dish seed (needs the Korean teammate); BE-15 staging (needs domain + hosting); BE-16 translation review.

## Branches

| Branch | Contains | On GitHub? | Next action |
|---|---|---|---|
| `main` | Everything below | ✅ pushed (see last line of Done) | Start new task branches from here |
| `feat/*`, `fix/*`, `docs/*` task branches | All merged into `main` | local only (except older ones) | Can be deleted |
| `worktree-agent-*`, `.claude/worktrees/*` | Sub-agent worktrees, nothing unmerged | local only | `git worktree prune` after closing sessions |

## Done

| Date | Item |
|---|---|
| 2026-10 → 11 | Design Thinking course work (outside this repo) |
| 2026-11-16 | Product specs in `product/`, agent roles |
| 2026-11-23 | Stack: React PWA (+ Capacitor later), Directus + PostgreSQL |
| 2026-11-24 | Task board, `GEMINI.md`; DS-01, BE-01, BE-10, BE-14 |
| 2026-11-25 | BE-18, BE-08, BE-09, BE-02, BE-03, BE-04, BE-05, BE-06; UI-01, UI-02, UI-03, UI-04 |
| 2026-11-25 | **UI-04 follow-up** (entry error keys, retry 1, logScan catch) · **UI-05** dish card · **UI-07** S3 dish detail (safety footer on every dish, unknown diet ≠ ✓) · **UI-08** S4 my diet (implied tags locked, D-022; spice 0/2/4 rounded down, D-023) · **UI-09** S0 welcome + cafeteria chooser on `/` · **UI-06** S2 today's menu (sortByStatus/applyFilters, all states, offline cache D-025) — all built by Antigravity via `agy`, reviewer APPROVE (UI-08, UI-09 after one fix round) |
| 2026-11-25 | **BE-13** QR generator (refuses hosting-provider URLs; 1 fix round) · **BE-11** today-menu endpoint (D-024) · **BE-19** public dish photos only · **BE-12** scan analytics, `scan_event` accountability off so no IP/UA stored (BR8) · **BE-20** cafeteria/dish endpoints + handler tests that fail if a safety filter is removed · **BE-17** copy-menu flow (always draft) — reviewer APPROVE, follow-ups applied |
| 2026-11-25 | Lint/format/backend tests now ignore `.claude/worktrees/**` (agent worktrees were linted and tests counted 6×) |

Checks on `main` after the wave-5 merge: format ✅ lint ✅ typecheck ✅ tests 52 backend + 142 web + 78 shared ✅ build ✅ (107 kB gzip JS) i18n 92 keys × 7 languages ✅

## In progress

Nothing half-done.

## Next

| Who | Task | Notes |
|---|---|---|
| Antigravity (`neon`) | **UI-10** PWA and offline | Includes menuCache hardening from the UI-06 review |
| Antigravity (`argon`) | **UI-12** e2e tests (parallel with UI-10) · **UI-11** a11y + Lighthouse (after UI-10) | Lighthouse ≤ 2 s on 4G is still unverified |
| Claude | **BE-16** translation review workflow | Unblocked |
| Claude + Korean teammate | **BE-07** ~30 verified dishes | Needs ingredient/allergen confirmation |
| Claude + Thiện | **BE-15** staging | Needs domain + hosting account |

Not yet verified by a human or a browser (agents could not):
- QR posters scanned with iPhone + Android camera (needs the real domain)
- Directus Insights "Scans" dashboard rendering; copy-menu button clicked in the Directus app
- S1/S3/S2 against the live backend (`VITE_USE_MOCK=false`) in a browser
- 375 px screenshots of S0–S4

Notes:
- Port 8055 on the owner's Mac belongs to another project; use `DIRECTUS_PORT=8056`. Sub-agents use their own compose project and ports (8057+) with env vars inline — writing `.env` is blocked by the owner's permission rules.
- `agy` headless: run without `--mode`; worktrees may start from an old commit, so branch from local `main`.
- Known non-blocking items: diet-tag recompute is async; uniqueness is hook-only (D-020); the hosting-provider check in the QR script is a denylist; flow errors from the Run Script step show as generic 500s; a photo shared by a draft and a published dish is public.

## Blockers and waiting on humans

| Item | Who | Blocks |
|---|---|---|
| Native-speaker review of zh, uz, mn, ne strings | International students | Pilot launch |
| Korean teammate verifies dish ingredients/allergens | Korean teammate | BE-07 |
| Check current MFDS allergen list | Team | BE-06 sign-off |
| Team domain + hosting account | Thiện | BE-15, QR printing |

## Open questions

- Which cafeteria(s) and meal times does the pilot cover? (assumed: one cafeteria, lunch)
- Should Staff see the Insights dashboard (today: Admin only)? Should "scans today" be the calendar day instead of the last 24 h?
