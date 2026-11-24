# BE-13 — QR code generator

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 5.1 | BE-03 | ☐ Todo |

## Goal
Printable QR codes that point to the team domain.

## Read first
- product/user-flows.md Flow 8
- product/technical-architecture.md §2.2

## Do
- Script producing PNG + A5 PDF per cafeteria with `https://<domain>/r/{code}` and a 4-language instruction

## Do not
- Never encode a hosting-provider URL

## Acceptance criteria
- [ ] QR scanned with iPhone and Android camera opens the right route

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-13-qr-code-generator`
