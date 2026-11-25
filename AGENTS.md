# AGENTS.md — Start here

Entry point for **any** AI agent working on this repository: Claude Code, OpenAI Codex, Google Antigravity, or a new session of any of them. Read this file completely before doing anything.

## 1. What this project is

**DU-Menu Scan** — a QR-based mobile web app (PWA) for international students at Daegu University (Korea). Scanning the QR code at the cafeteria entrance shows today's menu with photos, translated dish names, icons (spicy, pork, beef, chicken, seafood, vegetarian), **hidden ingredients** (e.g. anchovy broth in 된장찌개) and a **personal warning** (OK / Caution / Avoid / Not verified) based on the diet the student set once on their phone.

- Origin: 4-person team project in the course 창의문제해결 (Creative Problem Solving, Design Thinking), Fall 2026. Team: 3 international students + 1 Korean student. Product owner: **Thiện** (GitHub `vithienym19`).
- The course grades the design process and a Balsamiq prototype; this repository builds the real product after that.

## 2. Session protocol (mandatory)

**At the start of every session**

1. Read [`STATUS.md`](STATUS.md) — current phase, branches, what is done, what is next, blockers.
2. Read [`tasks/README.md`](tasks/README.md) — the task board (owners, dependencies, status).
3. Read your role file (section 3) and the task file you are about to work on.
4. Run `git status` and `git branch -vv`; work on the branch the task names.
5. Skim [`product/decision-log.md`](product/decision-log.md) before proposing changes to stack, scope or rules — most questions are already decided there.

**At the end of every session (or when you stop mid-task)**

1. Update `STATUS.md`: "Last updated", what you finished, what is in progress (branch + next step), new blockers.
2. Tick finished tasks on `tasks/README.md` and in their task file (☐ → ✅ + date).
3. Add any new decision to `product/decision-log.md` (date, decision, why, alternatives).
4. Commit with a conventional message. Leave the working tree clean or say in `STATUS.md` what is uncommitted and why.

If something you need is not written down, ask the product owner and then **write the answer into the repo** — the next session will not remember the conversation.

## 3. Roles — pick yours

| Role | Who usually plays it | Rules file | Owns |
|---|---|---|---|
| Product manager + lead engineer | Claude Code (Codex may take over) | [`CLAUDE.md`](CLAUDE.md) | Specs (`product/`), task board (`tasks/`), backend (`directus/`), shared logic (`packages/shared/`), i18n key set, CI, deployment, code review |
| UI developer | Antigravity (Gemini) — model by task size: S `hydrogen`, M `agon`, L `nexon` | [`GEMINI.md`](GEMINI.md) | `apps/web/**` except the i18n key set |
| Reviewer | Claude `reviewer` sub-agent or any agent asked to review | [`.claude/agents/reviewer.md`](.claude/agents/reviewer.md) | Read-only review |
| Product owner | Thiện (human) | — | Priorities, approvals, merging to `main`, pushing to GitHub |

**Codex:** unless the owner says otherwise, act as the *lead engineer* and follow `CLAUDE.md` (sections Workflow, Non-negotiable rules, Git conventions). Only `BE-*`/`DS-*` tasks are yours; never implement `UI-*` tasks unless the owner reassigns them on the board.

## 4. Repository map

| Path | What |
|---|---|
| `STATUS.md` | Living progress log — **update every session** |
| `tasks/` | Task board (`README.md`), one brief per task, `DISPATCH.md` (ready prompts for Antigravity) |
| `product/` | Specifications — the single source of truth (see table below) |
| `packages/shared/` | Types, `localize()`, API client (HTTP + mock), fixtures, design tokens (`src/design/theme.css`), language list (`src/languages.json`), warning logic (BE-09, next) |
| `apps/web/` | Student PWA. Today only `src/i18n/*.json`; app shell comes with UI-01 |
| `directus/` | Backend schema, seed data (not created yet — BE-02/03) |
| `scripts/check-i18n.mjs` | Fails if any language file misses keys or placeholders |
| `.github/workflows/ci.yml` | Format, lint, typecheck, test on every PR |
| `CLAUDE.md`, `GEMINI.md`, `.claude/` | Role rules and permissions |

| Spec | Read it for |
|---|---|
| `product/product-specification.md` | Problem, users, features F1–F11, business rules **BR1–BR9** |
| `product/user-flows.md` | Student and staff flows |
| `product/screen-specification.md` | Screens S0–S4 (student), M0–M4 (staff), states |
| `product/design-system.md` | Colours, type, spacing, icons, components |
| `product/data-specification.md` | Directus collections and fields |
| `product/technical-architecture.md` | Stack, API, warning logic, deployment, NFRs |
| `product/development-backlog.md` | User stories with acceptance criteria |
| `product/roadmap.md` | Phases, milestones, risks |
| `product/decision-log.md` | Every decision with date and reason |

## 5. Commands

```bash
nvm use                 # Node 22 (.nvmrc)
npm install
npm run lint            # ESLint
npm run typecheck       # tsc in every workspace
npm test                # i18n check + Vitest in every workspace
npm run format          # Prettier write
```

All four checks must pass before a commit. CI runs the same.

## 6. Non-negotiable rules (summary — details in CLAUDE.md / GEMINI.md)

1. **Safety:** unverified or incomplete dish data is never shown as OK; every dish detail shows "Last verified {date}" and "Please confirm with staff if you have a severe allergy". Hidden ingredients count for warnings.
2. **Warning logic** exists only in `packages/shared/src/warning.ts`.
3. **Privacy:** no student accounts; preferences stay in localStorage; analytics store no personal data.
4. **i18n:** no hard-coded user-facing text; all language files have identical keys (`npm run check:i18n`).
5. **Design:** only tokens from `theme.css`; status colours only for warnings; icons always with text.
6. **Fixtures** (`packages/shared/src/fixtures`) are fake data for UI work — never seed them into Directus or show them to real users.
7. **Secrets:** never commit `.env`; only `.env.example`.
8. **Git:** branch per task, conventional commits, never force-push, never rewrite history; only Claude (lead engineer + reviewer) merges to `main`, after review and green checks (D-018).

## 7. Working language

- Files, code, comments, commits, PRs: **English**.
- Talking with the product owner: **Vietnamese**.

## 8. Known environment limits

- **Local path on the owner's Mac:** `~/Antigravity/du-menu-scan` (`/Users/viducthien/Antigravity/du-menu-scan`). Do not use the old `~/Documents/...` path — macOS blocks agent access to Documents.
- Parent folders `~` and `~/Antigravity` contain their own `.git`. Always run git **inside** `du-menu-scan`; never run `git add` in a parent folder (it would embed this repo).

- Claude's Cowork environment can commit locally but **cannot push** to GitHub; the owner pushes. Check `git branch -vv` for unpushed work and mention it in `STATUS.md`.
- TypeScript is pinned to **6.0.x** (typescript-eslint does not support 7 yet) — see decision log.

## 9. Glossary

| Term | Meaning |
|---|---|
| BR1–BR9 | Business rules in `product-specification.md` |
| F1–F11, E1–E6 | MVP and later features |
| S0–S4 / M0–M4 | Student / staff screens |
| BE-xx, UI-xx, DS-xx | Task IDs on the board |
| Wave | Group of tasks that can run in parallel |
| Dish dictionary | Reusable dish records; daily menus only reference them |
| Hidden ingredient | Ingredient not obvious from the dish name (broth, sauce, processed food) |
| Fixtures | Mock data in `packages/shared/src/fixtures` for UI development |
| Fallback (BR2) | Missing translation → English → Korean, with a "translation pending" marker |
