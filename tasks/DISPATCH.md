# Dispatch — Antigravity

**Default (D-021):** Claude dispatches UI tasks through the Antigravity CLI. A `frontend-developer` sub-agent creates the task branch in its own worktree, runs

```bash
agy -p "<prompt below>" --model <model id from tasks/README.md> --mode accept-edits
```

from the repo root (headless: `--mode accept-edits` stops at the first terminal command and `--mode auto` is not available on this account, so run without `--mode`; it then completes in the default mode — about 7–8 min for an M task), then checks scope, runs format/lint/typecheck/test/build and commits; the `reviewer` reviews before Claude merges. Never `--dangerously-skip-permissions`.

**Manual alternative:**

How to start a UI task in Antigravity:

1. Open the repository root as the workspace (Antigravity then loads `GEMINI.md` automatically).
2. Create the branch named in the task file.
3. Select the model from the table, start a new agent conversation and paste the prompt.
4. When the agent has opened its pull request, tell Claude: "review UI-xx".

Only start a task when every dependency on the board is ✅.

## Ready now

### UI-01 — App shell, theme and routing · model `argon`

```
Implement task UI-01 exactly as described in tasks/UI-01-app-shell-theme-and.md.
Follow every rule in GEMINI.md. Read product/design-system.md and product/screen-specification.md first.
Use only the design tokens from @du-menu-scan/shared/design/theme.css and the LANGUAGES list from @du-menu-scan/shared.
Work only inside apps/web. Run with VITE_USE_MOCK=true.
When done, run npm run lint, npm run typecheck and npm test, then open a pull request titled
"UI-01: App shell, theme and routing" with the acceptance criteria as a checklist, the commands you ran,
375 px screenshots of every route and the language picker, and any open questions.
```

## Next (after UI-01 is merged) — can run in parallel

### UI-02 — Icon row, spice meter and badges · model `hydrogen`

```
Implement task UI-02 as described in tasks/UI-02-icon-row-spice-meter.md, following GEMINI.md and
product/design-system.md §5–§6. Components receive data as props; do not compute warning status.
Add a demo route /dev/components that renders every variant (dev only).
Run lint, typecheck and tests, then open a PR "UI-02: Icon row, spice meter and badges" with screenshots.
```

### UI-03 — Filter chips (+ reuse language picker) · model `hydrogen`

```
Implement task UI-03 as described in tasks/UI-03-filter-chips-and-language.md, following GEMINI.md
and product/design-system.md §6 (Chip). Chips are buttons with aria-pressed and a 44 px hit area.
Reuse the LanguagePicker from UI-01. Open a PR "UI-03: Filter chips" with screenshots of on/off states.
```

### UI-04 — S1 QR entry route · model `hydrogen`

```
Implement task UI-04 as described in tasks/UI-04-s1-qr-entry-route.md, following GEMINI.md and
product/user-flows.md Flows 1–2. Use createApi from @du-menu-scan/shared with VITE_USE_MOCK=true.
Test with codes main-hall, dorm, engineering and an invalid code.
Open a PR "UI-04: S1 QR entry route" with screenshots of the invalid-code state.
```

### UI-05 — Dish card · model `hydrogen` (after UI-02)

```
Implement task UI-05 as described in tasks/UI-05-dish-card.md, following GEMINI.md and
product/design-system.md §6 (DishCard). Use localize() from @du-menu-scan/shared for names and show
"translation pending" when isFallback is true. Render every dish in the fixtures on /dev/components.
Open a PR "UI-05: Dish card" with screenshots in vi, mn and ne.
```

## Ready now (UI-01 to UI-04 merged)

### UI-04 follow-up · model `gemini-4-hydrogen-medium` · branch `fix/ui-04-followups`

```
Small follow-up to UI-04 in apps/web only, following GEMINI.md: (1) QrEntryPage uses entry.errorTitle / entry.errorBody (keys already exist) instead of menu.errorTitle / menu.errorBody, including the cafeteria-list error; update tests. (2) main.tsx: new QueryClient({ defaultOptions: { queries: { retry: 1 } } }). (3) add .catch(() => {}) to the api.logScan call. Run npm run format, lint, typecheck, test and build -w @du-menu-scan/web and fix every failure. Do not commit.
```

### UI-05 — Dish card · model `gemini-4-hydrogen-medium` · branch `feat/ui-05-dish-card`

```
Implement task UI-05 as described in tasks/UI-05-dish-card.md, following GEMINI.md and product/design-system.md §6 (DishCard). Work only in apps/web. Reuse WarningBadge, IconRow, SpiceMeter, HiddenIngredientTag from UI-02. Status comes from evaluate(dish, readPrefs()) and vegetarian from dietCompatibility(dish).vegetarian (both from @du-menu-scan/shared); never compute them yourself. Names via localize() and show "translation pending" when isFallback is true. Render every fixture dish on /dev/components. Run npm run format, lint, typecheck, test and build -w @du-menu-scan/web and fix every failure. Do not commit. Report missing i18n keys.
```

## After UI-02 to UI-05 are merged (BE-09 warning logic is ready)

Shared API for all three: `evaluate`, `sortByStatus`, `applyFilters`, `NO_FILTERS`, `dietCompatibility`,
`expandDietType`, `sanitizePrefs`, `DEFAULT_PREFS` from `@du-menu-scan/shared` (see product/technical-architecture.md §4).

### UI-08 — S4 My diet and local preferences · model `argon` (needs UI-03)

```
Implement task UI-08 as described in tasks/UI-08-s4-my-diet-and.md, following GEMINI.md and product/screen-specification.md § S4.
lib/prefs.ts must read localStorage only through sanitizePrefs() and start from DEFAULT_PREFS; never send prefs to any server.
Halal/vegetarian auto-tick comes from expandDietType(); do not hard-code the tag lists.
Test: corrupt localStorage values (bad JSON, "Halal", missing spiceTolerance) must not crash and must route to S4.
Open a PR "UI-08: S4 My diet" with screenshots of halal and vegetarian auto-tick.
```

### UI-07 — S3 Dish detail (safety-critical) · model `neon` (needs UI-02)

```
Implement task UI-07 as described in tasks/UI-07-s3-dish-detail-safety-critical.md, following GEMINI.md and
product/screen-specification.md § S3. Warning banner reasons come only from evaluate(); render each reason kind
(tag / allergen / spice) with i18n keys, never string logic. Diet info from dietCompatibility(): null = "unknown", never ✓.
If evaluate() gives status "avoid" with unverified: true, show the Avoid banner and the Not verified note.
The safety footer (Last verified + confirm with staff) is always visible. Test with every fixture dish, incl. dish-sundubu-jjigae.
Open a PR "UI-07: S3 Dish detail" with 375 px screenshots of ok, caution, avoid, unverified and translation-pending.
```

### UI-06 — S2 Today's menu · model `neon` (needs UI-03, UI-04, UI-05)

```
Implement task UI-06 as described in tasks/UI-06-s2-todays-menu.md, following GEMINI.md and product/screen-specification.md § S2.
Sort each corner with sortByStatus() (OK → Caution → Not verified → Avoid) and filter with applyFilters(); do not re-implement either.
Filters are session-only state. Build loading, empty, closed, offline and error states from the fixtures (main-hall, dorm, engineering).
Open a PR "UI-06: S2 Today's menu" with 375 px screenshots of each state and of each filter chip on.
```

## Later

| Task | Model | Starts when |
|---|---|---|
| UI-09 S0 Welcome | `hydrogen` | UI-08 ✅ |
| UI-10 PWA and offline | `neon` | UI-06, UI-07 ✅ |
| UI-11 Accessibility and performance | `argon` | UI-06, UI-07, UI-08 ✅ |
| UI-12 End-to-end tests | `argon` | UI-06, UI-07, UI-08 ✅ |

Prompts for these will be added here when they are unblocked.
