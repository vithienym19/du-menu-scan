# Technical Architecture

## 1. System overview

```
 Student phone                     Staff browser
 ┌────────────────────┐            ┌────────────────────┐
 │ Student Web (PWA)  │            │ Directus Admin UI  │
 │ React + TS + Vite  │            │ (M0–M4, Phase 1)   │
 │ localStorage prefs │            └─────────┬──────────┘
 └─────────┬──────────┘                      │
           │ HTTPS (read-only, public)       │ HTTPS (auth)
           ▼                                 ▼
        ┌────────────────────────────────────────┐
        │ Directus  (REST API, auth, roles,      │
        │            files, flows)               │
        └───────────────┬────────────────────────┘
                        ▼
                 ┌──────────────┐     ┌──────────────────┐
                 │ PostgreSQL   │     │ File storage      │
                 └──────────────┘     │ (dish photos)     │
                                      └──────────────────┘
```

## 2. Stack (decided 2026-11-23)

**Approach:** web first. One React codebase serves the mobile web (PWA) that students open from the QR code; the same build is wrapped with Capacitor for iOS/Android later. No separate native codebase.

| Layer | Choice | Benefit |
|---|---|---|
| **Database** | **PostgreSQL** | Relational model (dish ↔ ingredient ↔ allergen) with exact filtering; best-supported database for Directus; JSON columns where flexibility is needed |
| **Backend / API** | **Directus** | REST API, admin UI for cafeteria staff, auth, roles and file management out of the box; team already knows it |
| Frontend | React 18 + TypeScript + Vite | Team experience; small, fast bundle for first load after a QR scan |
| Styling | Tailwind CSS | Fast mobile-first UI without custom CSS |
| Routing | React Router | Routes in `screen-specification.md` |
| Data fetching | TanStack Query | Caching, background refresh, offline-friendly |
| i18n | i18next (ko, en, vi, zh) | One JSON file per language; adding a language = adding a file |
| PWA | vite-plugin-pwa | Add to home screen; last loaded menu available offline |
| Mobile apps | **Capacitor** (Phase 4+) | Wraps the same web build as iOS/Android apps; no rewrite |
| Images | Directus file storage → S3-compatible storage later | Directus transforms resize and convert to WebP for mobile data |
| QR | `qrcode` npm package | Generate PNG/PDF in the admin tool |
| Local dev | Docker Compose (PostgreSQL + Directus) | Whole team runs the same backend with one command |
| Testing | Vitest (unit, incl. `warning.ts`), Playwright (QR → menu → detail flow) | Protects the safety-critical warning logic and the main flow |
| CI | GitHub Actions | Lint, typecheck and tests on every pull request |

### 2.1 Why PostgreSQL

| Option | Verdict |
|---|---|
| **PostgreSQL** | ✅ Chosen. Many-to-many relations are explicit; queries such as "dishes with no pork, including hidden broth" are exact and fast |
| MySQL | Would work; no advantage over PostgreSQL here |
| SQLite | Fine for local experiments; not for concurrent writes in production |
| MongoDB | Poor fit: embedding ingredients in each dish duplicates allergen data, so one correction must be repeated in many places |
| Firebase / Firestore | Quick start, but weak multi-condition filtering, no staff admin UI, vendor lock-in |

Deciding factor: **allergen data safety**. Each ingredient is stored once and diet tags are derived from ingredients (BR5), so one correction fixes every dish that uses it.

### 2.2 Deployment

| Component | Staging / test | Pilot / production |
|---|---|---|
| Web (PWA) | Vercel or Cloudflare Pages | Same (HTTPS + CDN included) |
| Directus + PostgreSQL | Team-owned Ubuntu server or small VPS | Managed PostgreSQL with automatic backups (e.g. Railway, Supabase, Neon) |
| Domain | Team domain from day one | Same |

**Rule:** printed QR codes point to the team's own domain (e.g. `https://<domain>/r/{code}`), never to a hosting provider's URL, so hosting can change without reprinting QR codes.

### 2.3 Translation workflow

- Phase 1–2: drafts produced with Claude or Gemini, pasted into Directus as `source=ai, status=draft`, approved by a student reviewer (BR7). No paid API required.
- Later, if budget allows: a Directus Flow calls a translation API to create drafts automatically (backlog 1.5).

## 3. API (Directus REST, public read role)

| Use | Request |
|---|---|
| Cafeteria by code | `GET /items/cafeteria?filter[code][_eq]={code}` |
| Today's menu | `GET /items/daily_menu?filter[cafeteria_id][_eq]={id}&filter[date][_eq]={today}&filter[status][_eq]=published&fields=*,items.*,items.dish.*,items.dish.translations.*,items.dish.ingredients.*,items.dish.allergens.*` |
| Dish detail | `GET /items/dish/{id}?fields=*,translations.*,ingredients.ingredient.*,allergens.*` |
| Log scan | `POST /items/scan_event` (public create, write-only) |

The public role can **read** only published items and approved translations, and **create** only `scan_event`. Staff roles write through the Directus admin UI.

Optional (Phase 2): a thin endpoint `GET /api/menu/{code}/today` (Directus custom endpoint) returning one pre-shaped JSON to cut payload size.

## 4. Warning logic

Single pure function in `packages/shared/src/warning.ts`, used by S2 and S3, covered by unit tests.

```ts
type Status = 'ok' | 'caution' | 'avoid' | 'unverified';

function evaluate(dish: DishView, prefs: Prefs): { status: Status; reasons: string[] } {
  if (!dish.allergensConfirmed || !dish.verifiedAt) return { status: 'unverified', reasons: [] };

  const avoid = expand(prefs);              // dietType → tags (halal → pork, alcohol …)
  const hits = [
    ...dish.dietTags.filter(t => avoid.tags.includes(t)),
    ...dish.allergens.filter(a => prefs.allergens.includes(a)),
  ];
  if (hits.length) return { status: 'avoid', reasons: hits };

  if (dish.spiceLevel > prefs.spiceTolerance)
    return { status: 'caution', reasons: ['spicy'] };

  return { status: 'ok', reasons: [] };
}
```

Rules: unknown data is never `ok`; hidden ingredients count the same as visible ones.

## 5. Repository layout

```
du-menu-scan/
├── product/                   # product specifications (owned by the PM agent)
├── apps/
│   └── web/                   # Student PWA
│       ├── src/
│       │   ├── pages/         # Welcome, Today, DishDetail, Settings, NotFound
│       │   ├── components/    # DishCard, IconRow, SpiceMeter, FilterChips, WarningBadge
│       │   ├── i18n/          # ko.json, en.json, vi.json, zh.json
│       │   ├── lib/           # api.ts, prefs.ts (localStorage)
│       │   └── main.tsx
│       └── vite.config.ts
├── packages/
│   └── shared/                # types.ts, warning.ts, warning.test.ts
├── directus/
│   ├── snapshot.yaml          # schema snapshot (directus schema snapshot)
│   └── seed/                  # dishes.csv, ingredients.csv, allergens.csv
└── README.md
```

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | S2 interactive in ≤ 2 s on 4G; menu JSON ≤ 100 KB; photos WebP ≤ 60 KB, lazy-loaded |
| Availability | Last loaded menu cached for offline view, marked "may be outdated" |
| Accessibility | WCAG 2.1 AA contrast; icons always with text; touch targets ≥ 44 px; no meaning by colour alone |
| i18n | All UI strings externalised; dish data falls back en → ko (BR2) |
| Privacy | No student accounts, no cookies for tracking; scan events hold no personal data |
| Security | Public role read-only (except scan_event create); staff accounts with strong passwords; HTTPS only |
| Safety | Last verified date and "confirm with staff" on every dish detail |
| Maintainability | TypeScript strict; warning logic unit-tested; schema in version control |
