# Dispatch — Antigravity

How to start a UI task in Antigravity:

1. Open the repository root as the workspace (Antigravity then loads `GEMINI.md` automatically).
2. Create the branch named in the task file.
3. Select the model from the table, start a new agent conversation and paste the prompt.
4. When the agent has opened its pull request, tell Claude: "review UI-xx".

Only start a task when every dependency on the board is ✅.

## Ready now

### UI-01 — App shell, theme and routing · model `agon`

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

## Later (after Claude delivers BE-09 warning logic)

| Task | Model | Starts when |
|---|---|---|
| UI-06 S2 Today's menu | `nexon` | UI-03, UI-04, UI-05, BE-09 ✅ |
| UI-07 S3 Dish detail | `nexon` | UI-02, BE-09 ✅ |
| UI-08 S4 My diet | `agon` | UI-03, BE-09 ✅ |
| UI-09 S0 Welcome | `hydrogen` | UI-08 ✅ |
| UI-10 PWA and offline | `nexon` | UI-06, UI-07 ✅ |
| UI-11 Accessibility and performance | `agon` | UI-06, UI-07, UI-08 ✅ |
| UI-12 End-to-end tests | `agon` | UI-06, UI-07, UI-08 ✅ |

Prompts for these will be added here when they are unblocked.
