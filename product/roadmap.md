# Roadmap

| Phase | When | Goal | Exit criteria |
|---|---|---|---|
| **0. Design (midterm)** | Now → week 15 presentation | Validate the problem and the concept | Empathy evidence, problem statement, idea selection with SIT tools, AI feedback reflected, clickable Balsamiq prototype (S1–S3) tested with 3–5 students |
| **1. MVP** | ~4 weeks after the course | A working menu for one cafeteria | Backlog P0 done; 30 dishes seeded and verified; ko/en/vi; QR printed |
| **2. Complete** | +3 weeks | Personal warnings and operations | S0/S4, warning logic, zh, translation review, menu copy, offline cache, scan dashboard |
| **3. Pilot** | 1 month | Real use at one corner | ≥ 4 weeks of daily menus published; weekly scan counts; survey of users; staff time ≤ 5 min/day |
| **4. Expand** | After pilot review | More cafeterias | Dormitory cafeteria, weekly view, favourites, notifications (backlog P2) |

## Milestones

- **M0** Balsamiq prototype linked and tested (midterm)
- **M1** Staging online: Directus schema + empty web shell
- **M2** First real menu visible on a phone via QR
- **M3** Personal warnings live
- **M4** Pilot start (QR posted at entrance and kiosk)
- **M5** Pilot report: scans, survey, decision to expand

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong allergen/ingredient data | High (health) | Verified-by/date fields, "confirm with staff" note, unknown never shows OK |
| Cafeteria does not publish daily | Service stops | Dictionary makes entry ≤ 5 min; team member as backup publisher during pilot |
| Low adoption | No impact | QR at entrance and kiosk (before ordering), orientation promotion, KakaoTalk channel later |
| Translation quality | Trust | Human approval of AI drafts (BR7) |
| Team time | Delay | Phase 1 limited to P0; Directus admin UI instead of a custom admin |
