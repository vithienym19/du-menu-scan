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

## 2. Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Team experience |
| Routing | React Router | Routes in `screen-specification.md` |
| Data fetching | TanStack Query | Caching, offline-friendly |
| i18n | i18next (ko, en, vi, zh) | Standard, JSON resource files |
| Styling | Tailwind CSS | Fast mobile-first UI |
| PWA | vite-plugin-pwa | Add to home screen, cache last menu |
| Backend | Directus | Admin UI, roles, REST, files out of the box |
| Database | PostgreSQL | |
| Hosting | Frontend: Vercel / Netlify · Directus + DB: Railway or a small VPS | Free/low-cost tiers |
| QR | `qrcode` npm package | Generate PNG/PDF in admin tool |

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
