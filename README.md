# DU-Menu Scan

A QR-based mobile web service that lets international students at Daegu University check a cafeteria dish's ingredients, spice level, allergens and diet compatibility **in their own language, before they order**.

> Status: design phase. The midterm deliverable (창의문제해결, Design Thinking) is a clickable Balsamiq prototype. Code starts in Phase 1 (see `product/roadmap.md`).

## The problem in one line

International students cannot tell from a Korean menu name — or from a translation app — whether a dish contains something they cannot eat, because many ingredients are hidden (broth, sauces, processed foods) and there is no time to look things up while queuing.

## The solution in one line

Scan the QR code at the cafeteria entrance or kiosk → see today's menu with photos, translated names, icons (spicy, pork, beef, chicken, seafood, vegetarian), hidden-ingredient warnings, and a personal "Avoid" label based on the diet the student set once.

## Documents

| File | What it covers |
|---|---|
| [`product/product-specification.md`](product/product-specification.md) | Problem, users, goals, scope, feature list (MVP vs later), business rules |
| [`product/user-flows.md`](product/user-flows.md) | Step-by-step flows for students and cafeteria staff |
| [`product/screen-specification.md`](product/screen-specification.md) | Every screen: purpose, components, states, behaviour |
| [`product/design-system.md`](product/design-system.md) | Colours, typography, spacing, icons, component specs |
| [`product/data-specification.md`](product/data-specification.md) | Entities, fields, relationships, enums, seed data |
| [`product/technical-architecture.md`](product/technical-architecture.md) | Stack, system diagram, API, warning logic, repo layout, non-functional requirements |
| [`product/development-backlog.md`](product/development-backlog.md) | Epics and user stories with acceptance criteria and priority |
| [`product/roadmap.md`](product/roadmap.md) | Phases, milestones and exit criteria |

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Platform | Mobile web (PWA) first; same build wrapped with Capacitor for iOS/Android later | A QR code opens a URL directly; one codebase for web and apps |
| Student accounts | None; preferences stored on the device | Zero sign-up friction; no personal data on the server |
| Backend | Directus on PostgreSQL | Built-in admin UI, auth, roles, file storage and REST API; relational model keeps allergen data consistent |
| Frontend | React + TypeScript + Vite, Tailwind, TanStack Query, i18next | Team experience; fast first load after a QR scan |
| QR target | Team-owned domain | Hosting can change without reprinting QR codes |
| Data model | Reusable **dish dictionary** + daily menu that references it | Staff pick dishes each day instead of re-translating |
| Languages | ko, en, vi, zh, uz, mn, ne (extensible) | Top origins of international students in Korea: China 30.2%, Vietnam 29.7%, Uzbekistan 6.2%, Mongolia 6.0% (2025), Nepal fast-growing. Untranslated dish data falls back to English |
| Safety | Every dish shows "last verified" date and "confirm with staff" note | Allergen errors can cause harm |

## Team

4 members (3 international students, 1 Korean student). Course: 창의문제해결, Daegu University, 2026 Fall.

## Getting started

```bash
nvm use          # Node 22
npm install
npm run lint && npm run typecheck && npm test
```

## Repository layout

```
du-menu-scan/
├── CLAUDE.md            # Claude: product manager + lead engineer
├── GEMINI.md            # Antigravity: UI developer rules
├── tasks/               # task board + one brief per task
├── .claude/
│   ├── agents/          # frontend-developer, backend-developer, reviewer
│   └── settings.json    # shared tool permissions for all agents
├── product/             # specifications (source of truth)
├── apps/web/            # Student PWA (Phase 1)
├── packages/shared/     # shared types + warning logic (Phase 1)
└── directus/            # schema snapshot + seed data (Phase 1)
```

## Working with the AI agents

| Who | Role | Rules |
|---|---|---|
| Claude (main session) | Product manager + lead engineer: specs, task board, backend, data, shared logic, CI, review | `CLAUDE.md` |
| Antigravity (Gemini) | UI developer for `apps/web` — model by task size: S `hydrogen`, M `agon`, L `nexon` | `GEMINI.md` |
| `reviewer` sub-agent | Read-only review of every pull request | `.claude/agents/reviewer.md` |
| Thiện | Product owner, merges to `main` | — |

The task board with all tasks, owners and dependencies is [`tasks/README.md`](tasks/README.md).
