# Data Specification

Backend: Directus collections on PostgreSQL. Field names are snake_case. `id` is UUID unless noted.

## Entity overview

```
cafeteria 1──n corner
cafeteria 1──n daily_menu 1──n menu_item n──1 dish
dish 1──n dish_translation
dish n──n ingredient     (via dish_ingredient, with is_hidden)
dish n──n allergen       (via dish_allergen)
ingredient n──n diet_tag (via ingredient_diet_tag)
scan_event n──1 cafeteria
```

## Collections

### cafeteria
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| code | string, unique | Used in QR URL `/r/{code}` (e.g. `main-hall`) |
| name_ko, name_en | string | |
| opening_hours | json | `{ "lunch": "11:30-13:30", "dinner": "17:00-18:30" }` |
| is_active | boolean | |

### corner
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| cafeteria_id | fk | |
| name_ko, name_en | string | e.g. 한식 / Korean |
| sort | int | Display order |

### dish (the dish dictionary)
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name_ko | string | Source of truth |
| description_ko | text | One line |
| photo | file | Directus file |
| spice_level | int 0–4 | 0 none, 1 mild, 2 medium, 3 hot, 4 very hot |
| allergens_confirmed | boolean | True once allergens were checked, even if none |
| verified_by | string | Person/role who confirmed ingredients |
| verified_at | date | Shown to students |
| status | enum | `draft`, `published` (BR1 must pass to publish) |

### dish_translation
| Field | Type | Notes |
|---|---|---|
| dish_id | fk | |
| lang | string | Any code in `packages/shared/src/languages.json` except `ko` (en, vi, zh, uz, mn, ne …) |
| name | string | |
| description | text | |
| source | enum | `ai`, `human` |
| status | enum | `draft`, `approved` (only approved is shown) |

### ingredient
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name_ko | string | Source |
| names | json | Other languages, e.g. `{ "en": "Anchovy broth", "vi": "Nước dùng cá cơm" }`; missing keys fall back per BR2 |

### dish_ingredient
| Field | Type | Notes |
|---|---|---|
| dish_id, ingredient_id | fk | |
| is_main | boolean | Shown in "Main ingredients" |
| is_hidden | boolean | Not obvious from the name (broth, sauce, processed food) → ⚠ |

### allergen
| Field | Type | Notes |
|---|---|---|
| code | string pk | e.g. `egg`, `milk`, `soy`, `wheat`, `pork`, `beef`, `chicken`, `shrimp`, `crab`, `mackerel`, `shellfish`, `peanut`, `walnut`, `peach`, `tomato`, `buckwheat`, `squid`, `sulfite`, `pine_nut` |
| name_ko | string | Source |
| names | json | Other languages, as for ingredient |

Seed from Korea's mandatory allergen labelling list (MFDS). Verify the current official list before launch.

### dish_allergen
`dish_id`, `allergen_code`.

### diet_tag
| code | Meaning | Icon |
|---|---|---|
| pork | Contains pork (incl. ham, sausage, pork broth, lard) | 🐷 |
| beef | Contains beef (incl. beef broth) | 🐄 |
| chicken | Contains chicken | 🐔 |
| seafood | Fish, shellfish, anchovy broth, fish sauce, 젓갈, 어묵 | 🐟 |
| alcohol | Cooking wine, 미림 | — (used for halal) |

### ingredient_diet_tag
`ingredient_id`, `diet_tag_code`. Dish tags are derived: union of tags of all its ingredients (BR5).

### daily_menu
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| cafeteria_id | fk | |
| date | date | |
| meal | enum | `lunch`, `dinner` |
| status | enum | `draft`, `published` |

### menu_item
| Field | Type | Notes |
|---|---|---|
| daily_menu_id | fk | |
| corner_id | fk | |
| dish_id | fk | |
| price | int | KRW |
| sort | int | |

### scan_event (analytics, no personal data)
| Field | Type | Notes |
|---|---|---|
| id | bigint | |
| cafeteria_id | fk | |
| created_at | timestamp | |
| lang | string | UI language |
| entry | enum | `qr`, `direct` |

## Client-side data (student phone, localStorage)

```json
{
  "lang": "vi",
  "avoid": ["pork", "seafood"],
  "allergens": ["peanut"],
  "spiceTolerance": 1,
  "dietType": "halal",
  "onboarded": true
}
```

Diet type expands automatically: `halal` → avoid `pork`, `alcohol`; `vegetarian` → avoid `pork`, `beef`, `chicken`, `seafood`.

## Derived values

| Value | Rule |
|---|---|
| dish.diet_tags | Union of ingredient diet tags |
| dish.halal_ok | No `pork` and no `alcohol` tag |
| dish.vegetarian_ok | No `pork`, `beef`, `chicken`, `seafood` tag |
| warning status | See `technical-architecture.md` § Warning logic |

## Seed data (Phase 1)

About 30 most frequent dishes from 4–6 weeks of the school's published menus, with ingredients confirmed by the Korean team member (and cafeteria staff where possible). Example rows:

| name_ko | spice | hidden ingredients | tags |
|---|---|---|---|
| 된장찌개 | 1 | 멸치 육수 (anchovy broth) | seafood |
| 미역국 | 0 | 소고기 (beef) | beef |
| 잡채 | 0 | 돼지고기 or 소고기, 간장 | pork/beef |
| 떡볶이 | 3 | 어묵 (fish cake), 멸치 육수 | seafood |
| 김치 | 2 | 젓갈 (salted shrimp/anchovy) | seafood |
| 제육볶음 | 3 | — | pork |
