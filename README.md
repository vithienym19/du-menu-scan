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
| [`product/data-specification.md`](product/data-specification.md) | Entities, fields, relationships, enums, seed data |
| [`product/technical-architecture.md`](product/technical-architecture.md) | Stack, system diagram, API, warning logic, repo layout, non-functional requirements |
| [`product/development-backlog.md`](product/development-backlog.md) | Epics and user stories with acceptance criteria and priority |
| [`product/roadmap.md`](product/roadmap.md) | Phases, milestones and exit criteria |

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Platform | Mobile web (PWA), not a native app | A QR code opens a URL directly; no install barrier |
| Student accounts | None; preferences stored on the device | Zero sign-up friction; no personal data on the server |
| Backend | Directus on PostgreSQL | Built-in admin UI, auth, roles, file storage and REST API |
| Data model | Reusable **dish dictionary** + daily menu that references it | Staff pick dishes each day instead of re-translating |
| Languages | ko, en, vi, zh | Top origins of international students in Korea (China 30.2%, Vietnam 29.7%, 2025) |
| Safety | Every dish shows "last verified" date and "confirm with staff" note | Allergen errors can cause harm |

## Team

4 members (3 international students, 1 Korean student). Course: 창의문제해결, Daegu University, 2026 Fall.

## Repository layout

```
du-menu-scan/
├── CLAUDE.md            # Product Manager agent: how work is planned and delegated
├── .claude/
│   ├── agents/          # frontend-developer, backend-developer, reviewer
│   └── settings.json    # shared tool permissions for all agents
├── product/             # specifications (source of truth)
├── apps/web/            # Student PWA (Phase 1)
├── packages/shared/     # shared types + warning logic (Phase 1)
└── directus/            # schema snapshot + seed data (Phase 1)
```

## Working with the AI agents

This repo is set up for Claude Code. The main session acts as **Product Manager**: it talks with the product owner, keeps `product/` up to date, splits work into tasks, and delegates them to sub-agents:

| Agent | Owns | Can change |
|---|---|---|
| Product Manager (main session) | Scope, specs, backlog, task breakdown | `product/`, `README.md`, `CLAUDE.md` |
| `frontend-developer` | Student PWA | `apps/web/`, `packages/shared/` |
| `backend-developer` | Directus, database, seed data, infra | `directus/`, `docker-compose.yml`, `packages/shared/` types |
| `reviewer` | Code review against the specs | Nothing (read-only, reports findings) |

See `CLAUDE.md` and `.claude/agents/` for the full rules.
