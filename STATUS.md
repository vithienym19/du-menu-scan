# STATUS

> Living progress log. **Every agent updates this file at the end of each session** (see `AGENTS.md` §2).

**Last updated:** 2026-11-25 (night) by Claude (lead engineer) — handoff point

**Local path:** `~/Antigravity/du-menu-scan` (moved out of `~/Documents` on 2026-11-25 — see D-016)

## Handoff — read this first

- **Phase 1 — MVP build, wave 4 of 6.** Backend data layer is complete (schema, permissions, integrity hooks, reference seed). Student UI has the app shell (UI-01), the dish primitives (UI-02), filter chips (UI-03) and the QR entry route (UI-04). No S2/S3/S4 screens yet.
- **Everything is merged into `main` and pushed.** No open branches with unmerged work.
- **How work flows now:** Claude (lead engineer) writes specs/tasks, builds `BE-*`, dispatches `UI-*` to Antigravity through the `agy` CLI (D-021, `tasks/DISPATCH.md`), runs the `reviewer` sub-agent on every branch, and merges into `main` itself after APPROVE + green checks (D-018).
- **Run it locally:**
  - Web (mock data): `VITE_USE_MOCK=true npm run dev -w @du-menu-scan/web` → http://localhost:5173/r/main-hall (also `dorm`, `engineering`, and an invalid code).
  - Backend: `cp .env.example .env` (fill secrets; on this Mac set `DIRECTUS_PORT=8056` because 8055 is taken), then `npm run backend:up && npm run backend:schema:apply && npm run backend:permissions && npm run backend:seed`. Details in `directus/README.md`.
  - Checks: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build -w @du-menu-scan/web`.
- **Next tasks (in order):** UI-05 dish card → UI-06 S2 menu, UI-07 S3 detail, UI-08 S4 diet (prompts ready in `tasks/DISPATCH.md`); backend BE-19 public photos, BE-11 today-menu endpoint, BE-13 QR generator, BE-17 copy menu; BE-07 needs the Korean teammate.

## Branches

| Branch | Contains | On GitHub? | Next action |
|---|---|---|---|
| `main` | Specs, DS-01, BE-01/02/03/04/05/06/08/09/10/14/18, UI-01/02/03/04 | ✅ pushed | Start new task branches from here |
| `feat/*` task branches (wave-1/2, be-02…06, be-09, ui-01…04) | All merged into `main` | ✅ | Can be deleted |
| `claude/doc-project-progress-*`, `worktree-agent-*` | Claude session/agent worktrees, nothing unmerged | local only | Safe to delete with `git worktree prune` after closing sessions |

## Done

| Date | Item |
|---|---|
| 2026-10 → 11 | Design Thinking work for the course: problem, empathy plan, ideas with SIT tools, AI feedback, final idea, Balsamiq prototype plan (outside this repo) |
| 2026-11-16 | Product specs in `product/`, agent roles (`CLAUDE.md`, `.claude/`) |
| 2026-11-23 | Tech stack decided: React PWA + Capacitor later, Directus + PostgreSQL |
| 2026-11-24 | Task board (29 tasks), `GEMINI.md` for Antigravity |
| 2026-11-24 | **DS-01** design system · **BE-01** monorepo · **BE-10** i18n keys · **BE-14** CI |
| 2026-11-25 | Repo moved to `~/Antigravity/du-menu-scan`; verified: git fsck clean, all branches pushed, format/lint/typecheck/tests pass |
| 2026-11-25 | **BE-18** 7 languages (ko en vi zh uz mn ne) · **BE-08** types, `localize()`, API client (HTTP + mock), fixtures · handoff docs (`AGENTS.md`, `STATUS.md`, decision log) |

| 2026-11-25 | **BE-09** warning logic: `evaluate`, `sanitizePrefs`, `dietCompatibility`, `sortByStatus`, `applyFilters`; 100 % branch coverage enforced; decision D-017; reviewer APPROVE (round 2) |
| 2026-11-25 | **BE-02** Docker Compose + `.env.example` + `directus/README.md`; fail-fast env, Directus healthcheck; tested up / down -v / up; reviewer APPROVE |

| 2026-11-25 | Merged wave-2, BE-09 and BE-02 into `main` after review (owner delegated merging to Claude) |

| 2026-11-25 | **BE-03** Directus schema: 13 collections, script `directus/scripts/create-schema.mjs`, snapshot apply verified on an empty DB; ingredient/allergen/dish delete refused while in use; decisions D-019, D-020; reviewer APPROVE (round 2) |

| 2026-11-25 | **UI-01** app shell, routing, i18n, language sheet — built by Antigravity (`gemini-4-argon-medium` via `agy` CLI), 2 review rounds, APPROVE; checked at 375 px in the browser |

| 2026-11-25 | **BE-04** roles/permissions, **BE-05** `du-guards` hooks (derived tags, BR1 publish guard, uniqueness, published menus only hold published dishes), **BE-06** MFDS allergens + 72 ingredients with conservative tags — all reviewed (APPROVE), merged, and smoke-tested together on a live stack |

| 2026-11-25 | **UI-02** icon row, spice meter, badges · **UI-03** filter chips · **UI-04** S1 QR entry (`/r/:code`, invalid-code state, one `logScan` per visit) — Antigravity `gemini-4-hydrogen-medium` via `agy`, reviewer APPROVE, merged |

Checks on `main` (5ed5985): format ✅ lint ✅ typecheck ✅ tests 12 backend + 31 web + 77 shared ✅ build ✅ i18n 89 keys × 7 languages ✅

## In progress

Nothing half-done.

## Next

| Who | Task | Notes |
|---|---|---|
| Antigravity (`hydrogen`) | **UI-04 follow-up** (small): use `entry.errorTitle/errorBody`, QueryClient `retry: 1`, `.catch` on logScan | Prompt in `tasks/DISPATCH.md` |
| Antigravity (`hydrogen`) | **UI-05** dish card | Unblocked; prompt in `tasks/DISPATCH.md` |
| Antigravity | UI-08 (`argon`, needs UI-03 ✅), UI-07 (`neon`, needs UI-02 ✅), UI-06 (`neon`, needs UI-05) | Prompts ready |
| Claude | **BE-19** public dish photos, **BE-11** today-menu endpoint, **BE-13** QR generator, **BE-17** copy menu, **BE-12** scan analytics | All unblocked |
| Claude + Korean teammate | **BE-07** ~30 verified dishes | Needs the teammate to confirm ingredients/allergens and relax conservative tags |

Notes:
- Port 8055 on the owner's Mac is used by another project's Directus (`translate-realtime-ai-directus-1`). Use `DIRECTUS_PORT=8056` in `.env`.
- `agy` headless: run without `--mode` (accept-edits stalls on commands; auto is not available on this account).
- Known non-blocking items: diet-tag recompute is an async action hook (rare stale read for a few ms); uniqueness is hook-only (D-020); empty spice dot contrast is low (decorative, text label carries meaning).

## Blockers and waiting on humans

| Item | Who | Blocks |
|---|---|---|
| Native-speaker review of zh, uz, mn, ne strings | International students | Pilot launch (not development) |
| Korean teammate verifies dish ingredients/allergens | Korean teammate | BE-07 |
| Check current MFDS allergen list | Team | BE-06 |
| Team domain + hosting account | Thiện | BE-15 |

## Open questions

- Which cafeteria(s) and meal times does the pilot cover? (assumed: one cafeteria, lunch)
- Antigravity model ids confirmed with `agy models`: S `gemini-4-hydrogen-medium`, M `gemini-4-argon-medium`, L `gemini-4-neon-high` (D-021).
