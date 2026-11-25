# Directus + PostgreSQL (local backend)

Runs the DU-Menu Scan backend locally with Docker Compose. The schema (13 collections, see `product/data-specification.md`) lives in `directus/snapshots/schema.yaml`; apply it after the first start (see "Schema" below).

Requires Docker Desktop (or Docker Engine + Compose v2).

## First start

```bash
cp .env.example .env        # then edit .env: replace every CHANGE_ME
npm run backend:up          # same as: docker compose up -d
```

Directus: http://localhost:8055 (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`).
Health check: `curl -s localhost:8055/server/health` returns `{"status":"ok"}`.
The first start takes about 30 seconds while Directus creates its tables.

PostgreSQL is reachable only from your machine at `127.0.0.1:5432` (user, password, database from `.env`).

## Generate SECRET

Directus needs `SECRET` (signs tokens). Generate one value per environment:

```bash
openssl rand -base64 32
```

Paste it into `.env` as `SECRET`. Use different values and strong `ADMIN_PASSWORD` / `DB_PASSWORD` on any shared or deployed server. Never commit `.env`.

## Stop, reset

```bash
npm run backend:down        # stop, keep data (docker compose down)
npm run backend:reset       # delete database + uploads (docker compose down -v), then start clean
docker compose logs -f directus
```

The admin account is created only on the first start of an empty database. If you change `ADMIN_PASSWORD` later, run `backend:reset` or change it in the admin UI.

## Schema (snapshot)

```bash
npm run backend:schema:apply      # empty Directus: create everything from schema.yaml, then restart Directus
npm run backend:schema:snapshot   # after changing the schema: export it to directus/snapshots/schema.yaml
```

Run `backend:schema:apply` once after a first start or `backend:reset`. The restart is needed because the CLI runs in a separate process, so the running server would otherwise keep its old schema cache (new collections would not appear in the API). Commit `schema.yaml` with every schema change.

To rebuild the snapshot from scratch (rarely needed): start an empty stack, run
`ADMIN_EMAIL=... ADMIN_PASSWORD=... DIRECTUS_URL=http://localhost:8055 node directus/scripts/create-schema.mjs`, then `npm run backend:schema:snapshot`.

Notes: relation fields keep the spec names (`dish_id`, `ingredient_id`, ...). Deletes are restricted where data would otherwise be lost silently: a dish used in a menu (`menu_item.dish_id`) and an ingredient used by a dish (`dish_ingredient.ingredient_id`) cannot be deleted; remove the references first. Junction rows of a dish (translations, ingredients, allergens), the diet tags of a deleted ingredient, and the items of a deleted menu are deleted with their parent. `dish_translation.lang` choices are frozen from `packages/shared/src/languages.json` when the schema is generated: to add a language, update that field (choices and validation) in Directus and re-export the snapshot. Roles and permissions come in BE-04, seed data in BE-06. Derived tags, the publish guard and uniqueness are enforced by the `du-guards` extension (next section).

## Data integrity hooks (`du-guards`, BE-05)

`directus/extensions/du-guards/` is a Directus hook extension. It is plain ESM (`dist/index.js` is committed, there is no build step and no npm dependency); `.gitignore` has an exception so `dist/` of extensions is tracked. All violations return HTTP 400 with code `INVALID_PAYLOAD` and a message naming the problem. It enforces:

- **Derived diet tags (BR5):** `dish.diet_tags` (json array, read-only in the admin UI) is the sorted union of the diet tags of every ingredient linked through `dish_ingredient`, hidden ones included. It is recomputed when `dish_ingredient` or `ingredient_diet_tag` rows are created, updated or deleted, for every dish concerned (also the old dish when a link moves). Setting `diet_tags` in a create/update request is rejected. The hook writes the column itself, so it never re-triggers. The recompute runs in a Directus `action` hook, which is not awaited by the request: a read in the same few milliseconds can still see the old value.
- **Publish guard (BR1):** a dish cannot be created or updated to `status = published` (nor stay published after an update) unless `name_ko` is set, an `en` `dish_translation` with `status = approved` and a name exists, `spice_level` is 0-4 and `allergens_confirmed = true`. The approved `en` translation of a published dish cannot be unapproved, emptied, re-languaged, moved or deleted: unpublish first. Create the approved translation before publishing; when creating a dish with nested `translations` in one request, the nested array is accepted.
- **Uniqueness (D-020):** one `daily_menu` per cafeteria + date + meal; one `dish_translation` per dish + lang; no duplicate pairs in `dish_ingredient`, `dish_allergen`, `ingredient_diet_tag`. Checked on create and update (not a database constraint, so concurrent identical requests could race).

Not covered: rows written straight into PostgreSQL, and deleting a dish (which cascades its translations in the database). The warning logic (BR6) stays in the frontend.

Reload after editing the extension: with `EXTENSIONS_AUTO_RELOAD=true` (default in `.env.example`) Directus reloads on file change; otherwise `docker compose restart directus`. Loaded extensions are listed in `docker compose logs directus` ("Loaded extensions: directus-extension-du-guards").

## Folders

- `directus/extensions/` mounted into Directus (custom endpoints, hooks); `du-guards/` is the integrity hook above.
- `directus/snapshots/schema.yaml` schema snapshot (collections, fields, relations).
- `directus/scripts/create-schema.mjs` builds the schema on an empty Directus through the REST API; the snapshot is exported from the result.

## Troubleshooting

- **Port 8055 or 5432 already in use:** set `DIRECTUS_PORT` / `DB_PORT_HOST` in `.env` (and `PUBLIC_URL` to match), or stop the other process (`lsof -i :8055`).
- **Directus restarts or exits:** `docker compose logs directus`. Usually a missing `SECRET`, `ADMIN_EMAIL` or `ADMIN_PASSWORD` in `.env`.
- **"password authentication failed":** `DB_PASSWORD` was changed after the volume was created. Run `npm run backend:reset`.
- **Browser blocks requests from the web app (CORS):** `CORS_ORIGIN` must equal the origin of the dev server (default `http://localhost:5173`). For several origins (e.g. `127.0.0.1:5173` or a LAN IP for phone testing) use a comma-separated list.
