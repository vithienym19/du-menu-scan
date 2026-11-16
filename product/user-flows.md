# User Flows

## Overview

```
                ┌──────────────┐
 first visit →  │ S0 Welcome   │──(set diet)──► S4 My diet ──┐
                └──────┬───────┘                              │
                       │ skip                                 │
 QR scan ──► S1 QR entry ──► S2 Today's menu ◄─────────────────┘
                                 │   ▲
                         tap card│   │ back
                                 ▼   │
                             S3 Dish detail

 Staff:  M0 Login ──► M1 Daily menu ──► (pick from) M2 Dish dictionary
                                         M3 Translation review
                                         M4 QR codes
```

All student paths end at **S2 Today's menu**. A returning student goes QR → S2 directly.

## Flow 1 — First-time student

1. Student scans the QR at the cafeteria entrance with the phone camera.
2. Browser opens `/r/{cafeteriaCode}`.
3. No saved settings → **S0 Welcome**. Language is pre-selected from the phone.
4. Student taps "Set my diet" → **S4 My diet**, ticks e.g. Pork, sets spice tolerance, saves.
5. → **S2 Today's menu**. Dishes containing pork are outlined red with "Avoid".
6. Student taps a dish → **S3 Dish detail**, checks hidden ingredients, goes back.
7. Student orders at the kiosk.

**Target:** steps 1–5 under 30 s on first use.

## Flow 2 — Returning student

1. Scan QR → `/r/{cafeteriaCode}` → settings found → **S2** immediately.
2. Scan the list; Avoid / Caution labels already applied.

**Target:** under 10 s to a decision.

## Flow 3 — Using filters

1. On **S2**, tap "No pork" chip.
2. List hides dishes tagged pork (including hidden pork). Chip shows as active.
3. Tap again to clear.

Filters are temporary for the visit; My diet is permanent.

## Flow 4 — Changing language or diet

1. On **S2**, tap ⚙ → **S4**.
2. Change language or avoided items → Save → back to **S2**, re-evaluated instantly.

## Flow 5 — No menu today

1. Scan QR → **S2** shows "Menu not available yet" with opening hours and a link to yesterday's menu (read-only).

## Flow 6 — Staff publishes today's menu

1. Staff logs in → **M1 Daily menu**, date defaults to today.
2. For each corner, search the dish dictionary by Korean name and add dishes, set price.
3. Dish not in dictionary → "Create new dish" → **M2** (minimal form: Korean name, ingredients, allergens, spice, photo). New dish is marked "translation pending".
4. Publish. Students see the menu immediately.

**Target:** ≤ 5 min when all dishes exist in the dictionary.

## Flow 7 — Translation review

1. AI generates en/vi/zh drafts for a new dish.
2. Reviewer (student volunteer) opens **M3**, edits if needed, approves per language.
3. Until approved, students see the English or Korean fallback (BR2).

## Flow 8 — Print QR codes

1. Admin → **M4**, select cafeteria → download PNG/PDF with QR + short multilingual instruction.
2. Place at entrance and next to kiosks (not on tables: students must see it **before** ordering).
