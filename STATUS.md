# STATUS

> Living progress log. **Every agent updates this file at the end of each session** (see `AGENTS.md` §2).

**Last updated:** 2026-11-25 by Claude (lead engineer)

## Where we are

**Phase 1 — MVP build**, wave 2 of 6. Foundation, design system, i18n (7 languages) and the shared data layer are done. The UI can start now on mock data; the real backend (Directus) is not built yet.

## Branches

| Branch | Contains | On GitHub? | Next action |
|---|---|---|---|
| `main` | Specs, agent roles, tech-stack decision, task board | ⚠️ 2 commits not pushed (`39b47ca`, `73c58cb`) | Owner: `git push origin main` |
| `feat/wave-1-foundation` | BE-01, DS-01, BE-10, BE-14 | ❌ not pushed | Owner pushes; merge into `main` (or merge wave-2, which includes it) |
| `feat/wave-2-languages-data` | Everything in wave-1 + BE-18, BE-08, handoff docs | ❌ not pushed | Owner pushes and merges into `main` |

Push all at once: `git push origin main feat/wave-1-foundation feat/wave-2-languages-data`

## Done

| Date | Item |
|---|---|
| 2026-10 → 11 | Design Thinking work for the course: problem, empathy plan, ideas with SIT tools, AI feedback, final idea, Balsamiq prototype plan (outside this repo) |
| 2026-11-16 | Product specs in `product/`, agent roles (`CLAUDE.md`, `.claude/`) |
| 2026-11-23 | Tech stack decided: React PWA + Capacitor later, Directus + PostgreSQL |
| 2026-11-24 | Task board (29 tasks), `GEMINI.md` for Antigravity |
| 2026-11-24 | **DS-01** design system · **BE-01** monorepo · **BE-10** i18n keys · **BE-14** CI |
| 2026-11-25 | **BE-18** 7 languages (ko en vi zh uz mn ne) · **BE-08** types, `localize()`, API client (HTTP + mock), fixtures · handoff docs (`AGENTS.md`, `STATUS.md`, decision log) |

Checks on the latest commit: format ✅ lint ✅ typecheck ✅ tests 16/16 ✅ i18n 87 keys × 7 languages ✅

## In progress

Nothing half-done. Working tree clean after the handoff-docs commit.

## Next

| Who | Task | Notes |
|---|---|---|
| Antigravity (`agon`) | **UI-01** app shell, theme, routing, language picker | Unblocked. Prompt in `tasks/DISPATCH.md` |
| Claude / lead engineer | **BE-09** warning logic + tests (≥ 95 % branches) | Unblocks UI-06, UI-07, UI-08 |
| Claude / lead engineer | **BE-02** Docker Compose, then **BE-03** Directus schema | Needs Docker on the owner's Mac |
| Antigravity (`hydrogen`) | UI-02, UI-03, UI-04, UI-05 | After UI-01 is merged |

## Blockers and waiting on humans

| Item | Who | Blocks |
|---|---|---|
| Push the 3 branches to GitHub and merge | Thiện | CI on GitHub, Antigravity working from the remote |
| Native-speaker review of zh, uz, mn, ne strings | International students | Pilot launch (not development) |
| Korean teammate verifies dish ingredients/allergens | Korean teammate | BE-07 |
| Check current MFDS allergen list | Team | BE-06 |
| Team domain + hosting account | Thiện | BE-15 |

## Open questions

- Which cafeteria(s) and meal times does the pilot cover? (assumed: one cafeteria, lunch)
- Exact Antigravity model names/tiers — assumed S `hydrogen`, M `agon`, L `nexon`; change in `tasks/README.md` if different.
