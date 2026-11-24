# Design System

Decided by the lead engineer on 2026-11-24. Tokens live in `packages/shared/src/design/theme.css` (Tailwind CSS v4 `@theme`). UI code uses these tokens only — no raw hex colours, no new font sizes.

## 1. Principles

1. **Decide in 10 seconds.** The menu is read while queuing. Big names, few words, icons with labels.
2. **Safety is visible, never decorative.** Warning status always uses icon + text + colour together.
3. **Calm and trustworthy.** Warm off-white background, one blue brand colour, no gradients or heavy shadows.
4. **Many scripts, one layout.** Hangul, Latin (incl. Vietnamese and Uzbek), Chinese, Cyrillic (Mongolian) and Devanagari (Nepali) must fit without truncating important words. Never set fixed widths on text.

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `brand` | `#1F4FD1` | Primary buttons, links, active chip, focus ring |
| `brand-strong` | `#183FA8` | Pressed/hover state of brand |
| `brand-soft` | `#EAF0FF` | Active chip background, selected language |
| `canvas` | `#FAF8F5` | Page background |
| `surface` | `#FFFFFF` | Cards, header, sheets |
| `surface-muted` | `#F3F1ED` | Image placeholder, inactive chips |
| `line` | `#E4E0D9` | Dividers and card borders (decorative) |
| `ink` | `#1C1A17` | Main text |
| `ink-muted` | `#57524C` | Secondary text (translated name, labels) |
| `ink-subtle` | `#736D66` | Meta text (price, dates) on white only |

**Warning status** — never use these colours for anything else.

| Status | Text | Background | Border | Icon (lucide) | Label key |
|---|---|---|---|---|---|
| Avoid | `avoid` `#B42318` | `avoid-soft` `#FEF3F2` | `avoid-line` `#D92D20` (2 px card outline) | `ban` | `status.avoid` |
| Caution | `caution` `#B54708` | `caution-soft` `#FFFAEB` | `caution-line` `#DC6803` | `triangle-alert` | `status.caution` |
| OK | `ok` `#067647` | `ok-soft` `#ECFDF3` | — | `circle-check` (detail page only) | `status.ok` |
| Not verified | `unverified` `#475467` | `unverified-soft` `#F2F4F7` | `unverified-line` `#667085` | `circle-help` | `status.unverified` |

**Spice** uses `spice` `#E04F16` (filled) and `spice-empty` `#E4E0D9` — orange, so it is never confused with Avoid red.

Contrast (WCAG 2.1 AA) verified: body text 16.4:1, muted 7.3:1, white on brand 6.8:1, every status text ≥ 5.2:1 on its background, status borders and spice ≥ 3.5:1. Dark mode is out of scope for the MVP.

## 3. Typography

**Font:** Pretendard Variable (Korean + Latin incl. Vietnamese), loaded as a dynamic subset from the `pretendard` npm package with `font-display: swap`. Chinese, Mongolian (Cyrillic) and Nepali (Devanagari) fall back to the phone's system fonts to keep the download small. Devanagari needs extra line height: use `leading-relaxed` on body text when `lang=ne`.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `text-2xl` | 24 / 32 | 700 | Dish name on S3 |
| `text-xl` | 20 / 28 | 700 | Screen titles, S0 heading |
| `text-lg` | 18 / 26 | 700 | Korean dish name on cards, section (corner) headings |
| `text-base` | 16 / 24 | 400–500 | Body, translated dish name, buttons (600) |
| `text-sm` | 14 / 20 | 400–500 | Labels, chips, badges, price |
| `text-xs` | 12 / 16 | 500 | Only meta text such as "Last verified" date; never for warnings |

Rules: minimum 16 px for body text (prevents iOS zoom on inputs); weights 400, 500, 600, 700 only; Korean uses `word-break: keep-all` (set globally); numbers and prices use `Intl.NumberFormat` (e.g. `₩5,500`); dates use `Intl.DateTimeFormat` in the selected language.

## 4. Layout and spacing

- 4 px grid. Common steps: 4, 8, 12, 16, 24, 32.
- App column max width `container-app` (480 px), centred; page side padding 16 px.
- Header: 56 px, sticky, `surface` with bottom `line`.
- Touch targets ≥ 44 × 44 px everywhere (chips may look 36 px tall but get a 44 px hit area).
- Radius: `sm` 8 px (badges, inputs), `md` 12 px (cards, buttons), `lg` 16 px (sheets, banners), full for chips.
- Shadow: `shadow-card` on cards only; `shadow-sheet` for bottom sheets.

## 5. Icons

| Kind | Source | Rule |
|---|---|---|
| Food categories | Emoji 🐷 🐄 🐔 🐟 🥬 inside a 28 px `surface-muted` circle | Always followed by its text label (`tags.*`) |
| Hidden ingredient | `triangle-alert` (lucide) in `caution` colour + ingredient name | Text label required |
| Spice | 4 dots (`spice` / `spice-empty`) + text label (`dish.spice.*`) | Never dots alone |
| UI | `lucide-react` (chevron-left, settings, wifi-off, refresh-cw, x) | 24 px, stroke 2, `aria-hidden` when a label exists |

## 6. Components

| Component | Spec |
|---|---|
| **Button** | Height 48 px, radius `md`, text-base/600. Primary: `brand` bg, white text, `brand-strong` pressed. Secondary: `surface` bg, `line` border, `ink` text. Ghost: no border, `brand` text. Full width on mobile. |
| **Chip** (filters, settings) | Visual 36 px, hit area 44 px, radius full, text-sm/500. Off: `surface` + `line` border. On: `brand-soft` bg, `brand` border and text, check icon. `aria-pressed`. |
| **WarningBadge** | Radius `sm`, padding 4 × 8, text-sm/600, icon 16 px + label, colours from the status table. OK shows no badge on cards. |
| **DishCard** | `surface`, radius `md`, `shadow-card`, padding 12. Row: 72 px photo (radius `sm`) · content (Korean name text-lg/700, translated name text-base `ink-muted`, icon row, hidden-ingredient line) · price text-sm `ink-subtle` top-right. Avoid: 2 px `avoid-line` outline + badge. Caution: badge only. Unverified: badge only, never OK styling. |
| **Section header** (corner) | text-lg/700, 24 px top margin, 8 px bottom. |
| **Banner** | Radius `lg`, padding 12–16, icon + text, colour by meaning (status colours, or `surface-muted` for info such as offline). |
| **Safety footer** (S3) | `surface-muted`, radius `md`, text-sm `ink-muted`: last verified date + confirm-with-staff note. Always visible, never collapsed. |
| **Skeleton** | `surface-muted` blocks with a gentle pulse (disabled under reduced motion). |

## 7. Motion

150–200 ms with `ease-out-soft` for chip toggles and sheet opening. No motion is required to understand anything. `prefers-reduced-motion` removes animations.

## 8. Copy style

- Short and plain: "Contains pork", not "This dish may potentially include pork products".
- Speak to the student: "You chose to avoid pork".
- Never promise safety: always "Please confirm with staff if you have a severe allergy."
- All strings come from `apps/web/src/i18n/*.json`.
