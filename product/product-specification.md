# Product Specification

## 1. Problem

International students at Daegu University struggle to choose food in the student cafeteria:

- Menu boards are in Korean only; dish names do not describe the dish.
- Translation apps translate the **name** but not the **contents**. Many ingredients are hidden: anchovy broth in 된장찌개, beef in 미역국, pork or beef in 잡채, fish cake (어묵) in 떡볶이, salted seafood (젓갈) in 김치.
- Students queue in front of the kiosk with people behind them, so they have seconds, not minutes.

Observed coping behaviour: picking only familiar dishes, copying the person in front, picking at random and leaving food uneaten, or skipping the cafeteria.

**Problem statement:** International students cannot tell which cafeteria dishes they can eat, so they stick to familiar dishes or skip meals.

## 2. Users

| Persona | Profile | Need | Severity |
|---|---|---|---|
| Mai | Vietnam, 1st year, TOPIK 3, avoids very spicy food | Understand dish and spice level quickly | Inconvenience |
| Aziz | Uzbekistan, 1st year, TOPIK 2, Muslim (no pork, no alcohol) | Be certain a dish has no pork, including in broth or sauce | Can / cannot eat |
| Cafeteria staff | Manages daily menu | Provide information without extra daily work | Workload |

## 3. Goals and success metrics

| Goal | Metric | Target (pilot) |
|---|---|---|
| Fast decision | Time from scan to finding a suitable dish | ≤ 10 s |
| Trust | Students who say they trust the information | ≥ 70% in pilot survey |
| Adoption | Scans per lunch at the pilot corner | Measured weekly; baseline in week 1 |
| Low staff effort | Staff time to publish daily menu | ≤ 5 min/day |

## 4. Scope

**In scope (MVP):** one cafeteria, its corners, daily lunch/dinner menu, 7 languages (ko, en, vi, zh, uz, mn, ne — more can be added), icons, hidden ingredients, allergens, personal warnings, staff menu entry, QR codes.

**Out of scope (for now):** ordering or payment, nutrition/calories, reviews, user accounts for students, native apps, other universities.

## 5. Features

### MVP

| ID | Feature | Description |
|---|---|---|
| F1 | QR entry | QR at entrance/kiosk opens that cafeteria's menu for today |
| F2 | Language | ko, en, vi, zh, uz, mn, ne (list in `packages/shared/src/languages.json`); auto-detected from phone, changeable, remembered. Adding a language = one i18n file + one list entry |
| F3 | Today's menu | Dish cards grouped by corner: photo, Korean name, translated name, icons, price |
| F4 | Dish detail | Description, spice level (0–4), main ingredients, allergens, diet info, hidden ingredients, last verified date |
| F5 | Hidden-ingredient warning | Ingredients flagged as hidden are shown with ⚠ on card and detail |
| F6 | My diet | One-time setup: items to avoid, spice tolerance, diet type (none / vegetarian / halal) |
| F7 | Personal warning | Each dish evaluated as OK / Caution / Avoid against My diet |
| F8 | Filters | Quick filters: not spicy, no pork, vegetarian |
| F9 | Staff menu entry | Staff pick today's dishes per corner from the dish dictionary |
| F10 | Dish dictionary | Staff create/edit dishes once; reused every day |
| F11 | QR generation | Printable QR per cafeteria |

### Later

| ID | Feature |
|---|---|
| E1 | Weekly menu view |
| E2 | Multiple cafeterias and dormitory cafeteria |
| E3 | Favourites |
| E4 | Notifications when a favourite is served (KakaoTalk channel or push) |
| E5 | Ratings and short reviews in any language |
| E6 | Usage dashboard for staff |

## 6. Business rules

| ID | Rule |
|---|---|
| BR1 | A dish is shown to students only if it has a Korean name, at least an English translation, spice level, and allergen list (may be empty but must be explicitly confirmed). |
| BR2 | Missing translation for the selected language falls back to English, then Korean, and shows a "translation pending" marker. |
| BR3 | Every dish detail shows "Last verified: {date}" and "Please confirm with staff if you have a severe allergy." |
| BR4 | Allergens follow Korea's mandatory food-allergen labelling list (MFDS). Verify the list before launch. |
| BR5 | Diet tags (pork, beef, chicken, seafood) are derived from ingredients, including hidden ones. |
| BR6 | Personal warning, in this order: any avoided item present (hidden ingredients and allergens included) → Avoid, even if the rest of the data is unverified; unverified or incomplete data → "Not verified"; spice level above tolerance → Caution; otherwise OK. Unknown data never shows OK. Corrupt saved preferences fall back to the strictest setting (D-017). |
| BR7 | AI-generated translations must be approved by a reviewer before they are shown. |
| BR8 | No student personal data is stored on the server. Scan analytics store only cafeteria, time and language. |
| BR9 | If no menu is published for today, show the cafeteria's opening hours and "Menu not available yet". |
