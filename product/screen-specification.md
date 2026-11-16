# Screen Specification

Student screens S0–S4 are mobile-first (360–430 px wide). Staff screens M0–M4 are desktop/tablet-first. All student text comes from i18n files (ko, en, vi, zh); icons always appear with a text label.

## Common elements

| Element | Spec |
|---|---|
| Header | Back (◀) where applicable, title, language switch `KO | EN | VI | 中` |
| Icon set | 🌶 spice (0–4), 🐷 pork, 🐄 beef, 🐔 chicken, 🐟 seafood, 🥬 vegetarian, ⚠ hidden ingredient |
| Warning status | OK (no badge) · Caution (amber badge "Caution") · Avoid (red outline + "Avoid") · Not verified (grey badge) |
| Safety footer | On S3: "Last verified {date} · Please confirm with staff if you have a severe allergy." |

---

## S0 Welcome (first visit only)

| | |
|---|---|
| Route | `/welcome?next=/r/{code}` |
| Purpose | Choose language; offer diet setup |
| Components | Logo · 4 language buttons (pre-selected from browser) · primary button "Set my diet" · text button "Skip" |
| Behaviour | Language saved immediately. "Set my diet" → S4; "Skip" → S2. Never shown again once settings exist. |

## S1 QR entry

| | |
|---|---|
| Route | `/r/{cafeteriaCode}` |
| Purpose | Landing point of every QR code |
| Behaviour | Resolve cafeteria → if no settings, go to S0, else S2. Invalid code → error state with list of cafeterias. |
| Optional in-app scanner | `/scan`: camera view, scan frame, instructions in 3 lines (ko/en/selected), button "See today's menu" (fallback when camera unavailable). Normally students use the phone's own camera. |

## S2 Today's menu (core screen)

| | |
|---|---|
| Route | `/r/{cafeteriaCode}/today` |
| Purpose | Decide what to eat in under 10 s |
| Header | ◀, cafeteria name, date, ⚙ (→ S4) |
| Filter chips | Not spicy · No pork · Vegetarian (toggle, session only) |
| Body | Sections per corner (e.g. Korean, Noodles, Special). Each **dish card**: photo (64×64), Korean name, translated name, icon row, ⚠ hidden ingredient label, price, warning status |
| Sorting | Within a corner: OK first, then Caution, then Avoid |
| Tap | Card → S3 |
| States | Loading skeleton · Empty ("Menu not available yet" + opening hours) · Closed today · Offline (last loaded menu with "may be outdated") |

## S3 Dish detail

| | |
|---|---|
| Route | `/dish/{dishId}?date=` |
| Components | Large photo · names (ko + selected language, other languages collapsible) · one-line description · spice meter 0–4 · Main ingredients · ⚠ Hidden ingredients · Allergens · Diet info (Halal ✕/✓, Vegetarian ✕/✓) · personal warning banner if Caution/Avoid (e.g. "Contains pork — you chose to avoid pork") · safety footer · button "Back to menu" |
| States | Translation pending (shows fallback language with marker) · Not verified (grey banner, no OK) |

## S4 My diet

| | |
|---|---|
| Route | `/settings` |
| Components | Language selector · "I avoid" checkboxes: pork, beef, chicken, seafood, nuts, milk & egg, wheat · Spice tolerance: Not spicy only / A little / Any · Diet type: None / Vegetarian / Halal · Save |
| Behaviour | Saved to localStorage. Halal auto-ticks pork. Vegetarian auto-ticks pork, beef, chicken, seafood. Save → previous screen. |
| Privacy note | "Your settings stay on this phone." |

---

## M0 Staff login

Directus login (email + password). Roles: Staff, Reviewer, Admin.

## M1 Daily menu

| | |
|---|---|
| Purpose | Publish today's menu in ≤ 5 min |
| Components | Date picker · meal (lunch/dinner) · per corner: dish search (Korean name, autocomplete from dictionary), added dishes list with price, remove · "Create new dish" · Publish / Unpublish |
| Validation | Warn if a dish fails BR1 (incomplete) — it is saved but hidden from students |

## M2 Dish dictionary

| | |
|---|---|
| List | Search, filter by "translation pending", "not verified" |
| Form | Korean name · photo · description (ko) · ingredients (each with "hidden" toggle) · allergens (checklist) · spice level 0–4 · verified by · verified at |
| Derived | Diet tags computed from ingredients; shown read-only |

## M3 Translation review

Queue of dish × language with status Draft (AI) / Approved. Side-by-side Korean source and editable translation. Approve / Reject.

## M4 QR codes

Select cafeteria → preview → download PNG and printable A5 PDF with QR + "Scan to see today's menu" in ko/en/vi/zh.

---

## Prototype scope (midterm, Balsamiq)

Required: S1 (scanner variant), S2, S3 with working links. Optional: S0, S4. Staff screens are not needed for the midterm.
