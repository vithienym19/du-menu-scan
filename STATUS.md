# STATUS

> Living progress log. **Every agent updates this file at the end of each session** (see `AGENTS.md` §2).

**Last updated:** 2026-11-25 (evening) by Claude (lead engineer)

**Local path:** `~/Antigravity/du-menu-scan` (moved out of `~/Documents` on 2026-11-25 — see D-016)

## Where we are

**Phase 1 — MVP build**, wave 4 of 6. Foundation, design system, i18n (7 languages), shared data layer, warning logic (BE-09) and local Docker backend (BE-02) are done. No UI code yet; Directus schema is in `directus/snapshots/schema.yaml` (BE-03); no roles or seed yet.

## Branches

| Branch | Contains | On GitHub? | Next action |
|---|---|---|---|
| `main` | Specs, DS-01, BE-01/02/03/08/09/10/14/18, UI-01 | ✅ pushed | Start new task branches from here |
| `feat/wave-1-foundation`, `feat/wave-2-languages-data`, `feat/be-09-…`, `feat/be-02-…` | Merged into `main` on 2026-11-25 (owner delegated review + merge to Claude) | ✅ | Can be deleted |
| `claude/doc-project-progress-*` | Leftovers from Claude sessions, already in `main` | local only | Safe to delete |

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

Checks on the latest commit: format ✅ lint ✅ typecheck ✅ tests 77/77 ✅ (`main`) i18n 87 keys × 7 languages ✅

## In progress

Nothing half-done. Working tree clean after the handoff-docs commit.

## Next

| Who | Task | Notes |
|---|---|---|
| Claude / lead engineer | **BE-04**, **BE-05**, **BE-06** | Built on branches `feat/be-04-…`, `feat/be-05-…`, `feat/be-06-…` (local worktrees); in review |
| Antigravity (`hydrogen`, via `agy`) | UI-02, UI-03, UI-04, UI-05 | Unblocked (UI-01 merged) |
| Antigravity | UI-06 (`neon`), UI-07 (`neon`), UI-08 (`argon`) | BE-09 done; prompts ready in `tasks/DISPATCH.md`; wait for UI-02..05 |

Note: port 8055 on the owner's Mac is used by another project's Directus (`translate-realtime-ai-directus-1`). Set `DIRECTUS_PORT=8056` and `PUBLIC_URL=http://localhost:8056` in `.env`, or stop that container.

## Blockers and waiting on humans

| Item | Who | Blocks |
|---|---|---|
| Native-speaker review of zh, uz, mn, ne strings | International students | Pilot launch (not development) |
| Korean teammate verifies dish ingredients/allergens | Korean teammate | BE-07 |
| Check current MFDS allergen list | Team | BE-06 |
| Team domain + hosting account | Thiện | BE-15 |

## Open questions

- Which cafeteria(s) and meal times does the pilot cover? (assumed: one cafeteria, lunch)
- Exact Antigravity model names/tiers — assumed S `hydrogen`, M `argon`, L `neon`; change in `tasks/README.md` if different.
