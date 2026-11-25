# Decision Log

Newest first. Each entry: decision, why, alternatives considered. Change a decision only by adding a new entry that supersedes it.

| # | Date | Decision | Why | Alternatives rejected |
|---|---|---|---|---|
| D-016 | 2026-11-25 | Keep the repo at `~/Antigravity/du-menu-scan`, outside `~/Documents` | macOS privacy protection (and possible iCloud sync of Documents) blocked agent access; `node_modules` should not sync to iCloud | Granting Full Disk Access to every tool |
| D-015 | 2026-11-25 | Handoff protocol: every session starts with `AGENTS.md` → `STATUS.md` → task board, and ends by updating `STATUS.md` | Work moves between Claude, Codex and Antigravity; none of them remember previous chats | Relying on chat history |
| D-014 | 2026-11-25 | Support 7 languages: ko, en, vi, zh, uz, mn, ne; single list in `packages/shared/src/languages.json` | Top origins of international students in Korea (2025: China 30.2 %, Vietnam 29.7 %, Uzbekistan 6.2 %, Mongolia 6.0 %; Nepal fast-growing) | Hard-coded 4 languages |
| D-013 | 2026-11-25 | Language picker (bottom sheet, native names) instead of a fixed `KO | EN | VI | 中` switch | Scales to any number of languages | Segmented switch |
| D-012 | 2026-11-25 | Translations keyed by language code (`dish_translation.lang`, `names` json) — no per-language columns | Adding a language needs no schema change | `name_vi`, `name_zh` … columns |
| D-011 | 2026-11-25 | Mock fixtures + `VITE_USE_MOCK` so UI never waits for the backend | UI (Antigravity) and backend (Claude) run in parallel | UI blocked until Directus is live |
| D-010 | 2026-11-24 | TypeScript pinned to 6.0.x | typescript-eslint 8.74 supports `<6.1`; TS 7 breaks linting | TypeScript 7.0 |
| D-009 | 2026-11-24 | Design system: brand blue `#1F4FD1`, warm canvas `#FAF8F5`, Pretendard Variable, status colours reserved for warnings, WCAG AA checked | Calm, trustworthy, readable while queuing; brand colour must not look like a warning | Red/orange brand (clashes with Avoid), dark mode in MVP |
| D-008 | 2026-11-24 | Claude = product manager + lead engineer (backend, data, shared logic, review); Antigravity = UI, model by task size (S `hydrogen`, M `agon`, L `nexon`) | Owner's request; keeps safety-critical logic with one owner | Separate Claude frontend agent for UI |
| D-007 | 2026-11-23 | Printed QR codes point to the team's own domain | QR stickers cannot be changed after printing; hosting may change | Hosting provider URL |
| D-006 | 2026-11-23 | PostgreSQL + Directus | Relational data (dish ↔ ingredient ↔ allergen); one correction fixes every dish; Directus gives admin UI, roles, files, REST; team knows it | MySQL, SQLite, MongoDB, Firebase |
| D-005 | 2026-11-23 | Web first (React + TS + Vite PWA); wrap the same build with Capacitor for app stores later | QR opens a URL instantly — no install while queuing; one codebase | Native apps, React Native/Expo, separate web + native |
| D-004 | 2026-11-23 | Translations: AI drafts (Claude/Gemini, no paid API) + human approval; unapproved → English fallback | No API budget; translation errors can mislead about food | Paid translation API only, unreviewed AI output |
| D-003 | 2026-11-16 | No student accounts; preferences in localStorage; analytics without personal data | Zero friction at the queue; privacy | Login with student ID |
| D-002 | 2026-11-16 | Safety rules: unverified data never OK; "last verified" + "confirm with staff" on every dish | Allergen errors can cause harm | Showing data without verification status |
| D-001 | 2026-10 | Project topic: QR menu for international students (course 창의문제해결) | Real, observed problem: names and translations do not reveal hidden ingredients or spice | Printed multilingual menus, KakaoTalk channel, buddy system, AI photo recognition (see midterm idea matrix) |
