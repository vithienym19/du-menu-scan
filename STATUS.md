# STATUS

> Living progress log. **Every agent updates this file at the end of each session** (see `AGENTS.md` §2).

**Last updated:** 2026-11-25 (evening) by Claude (lead engineer)

**Local path:** `~/Antigravity/du-menu-scan` (moved out of `~/Documents` on 2026-11-25 — see D-016)

## Where we are

**Phase 1 — MVP build**, wave 3 of 6. Foundation, design system, i18n (7 languages), shared data layer, warning logic (BE-09) and local Docker backend (BE-02) are done. No UI code yet; Directus has no schema yet (BE-03 next).

## Branches

| Branch | Contains | On GitHub? | Next action |
|---|---|---|---|
| `main` | Specs, agent roles, tech-stack decision, task board (`73c58cb`) | ✅ pushed | Merge `feat/wave-2-languages-data` into it |
| `feat/wave-1-foundation` | BE-01, DS-01, BE-10, BE-14 | ✅ pushed | Nothing — included in wave-2 |
| `feat/wave-2-languages-data` | wave-1 + BE-18, BE-08, handoff docs | ✅ pushed up to `c056986`; later commits are local until the owner pushes | Owner: open a PR into `main` and merge; then `git push` for any newer commits |
| `feat/be-09-warning-logic-safety-critical` | wave-2 + BE-09 warning logic, D-017, spec alignment, UI-06/07/08 dispatch prompts, this STATUS | local only | Owner: push + PR into `main` after wave-2 is merged |
| `feat/be-02-docker-compose-postgresql-plus` | wave-2 + BE-02 Docker Compose (Postgres 16.16 + Directus 11.17.4) | local only (in worktree `.claude/worktrees/agent-ae760ad1d3c27d632`) | Owner: push + PR into `main` |
| `claude/doc-project-progress-*` (4) | Leftovers from earlier Claude sessions, identical to `main` | local only | Safe to delete: `git branch -d claude/doc-project-progress-103cea claude/doc-project-progress-4cc341 claude/doc-project-progress-914bc0 claude/doc-project-progress-bb00a0` |

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

Checks on the latest commit: format ✅ lint ✅ typecheck ✅ tests 77/77 ✅ (BE-09 branch) i18n 87 keys × 7 languages ✅

## In progress

Nothing half-done. Working tree clean after the handoff-docs commit.

## Next

| Who | Task | Notes |
|---|---|---|
| Antigravity (`agon`) | **UI-01** app shell, theme, routing, language picker | Unblocked. Prompt in `tasks/DISPATCH.md` |
| Claude / lead engineer | **BE-03** Directus schema (then BE-04, BE-05, BE-06) | Needs BE-02 branch merged or rebased in |
| Antigravity (`hydrogen`) | UI-02, UI-03, UI-04, UI-05 | After UI-01 is merged |
| Antigravity | UI-06 (`nexon`), UI-07 (`nexon`), UI-08 (`agon`) | BE-09 done; prompts ready in `tasks/DISPATCH.md`; wait for UI-02..05 |

Note: port 8055 on the owner's Mac is used by another project's Directus (`translate-realtime-ai-directus-1`). Set `DIRECTUS_PORT=8056` and `PUBLIC_URL=http://localhost:8056` in `.env`, or stop that container.

## Blockers and waiting on humans

| Item | Who | Blocks |
|---|---|---|
| Merge `feat/wave-2-languages-data`, then `feat/be-09-…` and `feat/be-02-…` into `main` (PRs on GitHub) | Thiện | Antigravity starting UI-01 from `main`; BE-03 |
| Native-speaker review of zh, uz, mn, ne strings | International students | Pilot launch (not development) |
| Korean teammate verifies dish ingredients/allergens | Korean teammate | BE-07 |
| Check current MFDS allergen list | Team | BE-06 |
| Team domain + hosting account | Thiện | BE-15 |

## Open questions

- Which cafeteria(s) and meal times does the pilot cover? (assumed: one cafeteria, lunch)
- Exact Antigravity model names/tiers — assumed S `hydrogen`, M `agon`, L `nexon`; change in `tasks/README.md` if different.
