# Development Backlog

Priority: **P0** = MVP must-have · **P1** = Phase 2 · **P2** = later. Size: S (≤ ½ day), M (1–2 days), L (3+ days).

## Epic 0 — Setup

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 0.1 ✅ 2026-11-25 | As a developer, I want a monorepo with `apps/web`, `packages/shared`, `directus/` | `npm run dev` starts the web app; TypeScript strict; lint passes | P0 | S |
| 0.2 ✅ 2026-11-25 | As a developer, I want Directus + PostgreSQL running | Local via Docker Compose; schema matches `data-specification.md`; snapshot committed | P0 | M |
| 0.3 ✅ 2026-11-25 | As a developer, I want public/staff roles configured | Public can read published items only and create scan_event; Staff can edit menus and dishes | P0 | S |
| 0.4 | As a team, we want staging deployed | Web on Vercel/Netlify, Directus on Railway/VPS, HTTPS | P0 | M |

## Epic 1 — Dish dictionary & data

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 1.1 | As staff, I can create a dish with ingredients, hidden flags, allergens, spice, photo | All fields in `data-specification.md`; cannot publish unless BR1 passes | P0 | M |
| 1.2 | As the team, we seed ~30 frequent dishes | Seed CSVs imported; each dish verified by the Korean team member | P0 | L |
| 1.3 ✅ 2026-11-25 | As the system, dish diet tags are derived from ingredients | Adding an ingredient tagged pork makes the dish show 🐷 | P0 | S |
| 1.4 | As a reviewer, I approve AI translations per language | Only approved translations reach students; fallback per BR2 | P1 | M |
| 1.5 | As the system, AI drafts translations for new dishes | Directus Flow calls a translation API, saves `source=ai, status=draft` | P1 | M |

## Epic 2 — Daily menu (staff)

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 2.1 | As staff, I publish today's menu per corner by picking dictionary dishes | Search by Korean name; set price; publish ≤ 5 min for a known menu | P0 | M |
| 2.2 ✅ 2026-11-25 | As staff, I copy yesterday's/last week's menu as a starting point | One click duplicates into a draft | P1 | S |
| 2.3 | As admin, I import the weekly menu published on the school website | Names matched to dictionary; unmatched listed for creation | P2 | L |

## Epic 3 — Student menu (S1–S3)

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 3.1 ✅ 2026-11-25 | As a student, scanning the QR opens today's menu | `/r/{code}` resolves; invalid code shows error state | P0 | S |
| 3.2 ✅ 2026-11-25 (closed state unreachable until the schema has a closed flag, D-024; photo sizing in UI-11) | As a student, I see dishes grouped by corner with photo, names, icons, price | Matches S2 spec; loading/empty/closed states | P0 | M |
| 3.3 ✅ 2026-11-25 | As a student, I see hidden ingredients flagged | ⚠ label on card; listed on S3 | P0 | S |
| 3.4 ✅ 2026-11-25 | As a student, I open a dish detail | Matches S3 spec incl. safety footer and last verified date | P0 | M |
| 3.5 ✅ 2026-11-25 | As a student, I switch language | All languages in `languages.json`; remembered; dish fallback per BR2 | P0 | M |
| 3.6 ✅ 2026-11-25 | As a student, I use quick filters | Not spicy / No pork / Vegetarian; session only; Not verified dishes hidden while a filter is on | P0 | S |
| 3.7 | As a student offline, I still see the last loaded menu | Marked "may be outdated" | P1 | S |

## Epic 4 — Personal warnings (S0, S4)

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 4.1 ✅ 2026-11-25 | As a first-time student, I choose language and optionally set my diet | S0 shown once; skip works | P1 | S |
| 4.2 ✅ 2026-11-25 | As a student, I set what I avoid, spice tolerance, diet type | Saved in localStorage; halal/vegetarian auto-expand | P0 | M |
| 4.3 ✅ 2026-11-25 | As a student, dishes are labelled OK / Caution / Avoid / Not verified | `warning.ts` per architecture § 4; ≥ 95% branch coverage | P0 | M |
| 4.4 ✅ 2026-11-25 | As a student, Avoid dishes sort below OK dishes in each corner | Order OK → Caution → Not verified → Avoid | P1 | S |

## Epic 5 — QR & analytics

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 5.1 ✅ 2026-11-25 (phone scan test after domain) | As admin, I download a printable QR per cafeteria | PNG + A5 PDF with 4-language instruction | P0 | S |
| 5.2 ✅ 2026-11-25 (logged on QR entry S1, not on direct S2 visits) | As the team, we count scans | scan_event logged on S2 load (no personal data) | P0 | S |
| 5.3 ✅ 2026-11-25 | As staff, I see scans per day and language | Simple dashboard (Directus Insights) | P1 | S |

## Epic 6 — Quality & launch

| ID | Story | Acceptance criteria | Pri | Size |
|---|---|---|---|---|
| 6.1 | Accessibility check | Contrast AA, icons with text, 44 px targets | P0 | S |
| 6.2 | Performance check | S2 ≤ 2 s on throttled 4G (Lighthouse) | P0 | S |
| 6.3 | Usability test with 5 international students | Each finds a suitable dish in ≤ 10 s; issues logged and fixed | P0 | M |
| 6.4 | Pilot feedback form | Link on S2 footer; 3 questions | P1 | S |
