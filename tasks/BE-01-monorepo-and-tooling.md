# BE-01 — Monorepo and tooling

| Owner | Size | Model | Priority | Stories | Depends on | Status |
|---|---|---|---|---|---|---|
| Claude (lead engineer) | S | — | P0 | 0.1 | none | ☐ Todo |

## Goal
Create the npm-workspaces monorepo that every other task builds on.

## Read first
- product/technical-architecture.md §2, §5

## Do
- Root `package.json` with workspaces `apps/*`, `packages/*`
- `packages/shared` (TypeScript library, Vitest) and an empty `apps/web` placeholder
- TypeScript strict base config, ESLint, Prettier, `.editorconfig`
- Root scripts: `dev`, `build`, `lint`, `typecheck`, `test`

## Do not
- Do not build any UI (that is UI-01)

## Acceptance criteria
- [ ] `npm install` and `npm run lint && npm run typecheck && npm test` pass on a clean clone

## Report back (in the pull request description)
- Changed files and why
- How you tested (commands + results)
- Screens/states covered (UI tasks: screenshots at 375 px)
- Open questions or spec gaps

Branch: `feat/be-01-monorepo-and-tooling`
