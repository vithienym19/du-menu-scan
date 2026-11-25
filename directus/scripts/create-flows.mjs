// Creates the Directus Flow "Copy menu to another date" (BE-17, user-flows Flow 6).
// A manual-trigger button on daily_menu: open a menu (any date) -> run the flow -> enter the target
// date (and optionally the meal) -> a NEW DRAFT menu is created with copies of all menu items
// (corner, dish, price, sort). The flow runs with the permissions of the user who clicks it
// (Staff: create/read daily_menu + menu_item), so Public cannot use it. Events are emitted, so
// the du-guards hooks apply: a menu for the same cafeteria+date+meal is refused (D-020) and the
// copy is always status draft; a draft may reference unpublished dishes, publishing is still
// guarded (BR1).
// Idempotent: finds the flow by name and replaces it (and its operations).
//
// Usage: npm run backend:flows   (ADMIN_EMAIL / ADMIN_PASSWORD / DIRECTUS_PORT from .env)
// Order: schema apply -> create-permissions -> create-flows.

const URL_BASE = (
  process.env.DIRECTUS_URL ?? `http://localhost:${process.env.DIRECTUS_PORT ?? 8055}`
).replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

const NAME = "Copy menu to another date";

let token;
async function api(method, path, body) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text).data : null;
}

// Run Script operation body (isolated sandbox, no database access).
// Throwing here aborts the flow with this message before anything is written.
const BUILD_PAYLOAD = `module.exports = function (data) {
  const source = data.read_source;
  const form = data.$trigger.body ?? {};
  const date = String(form.date ?? "").slice(0, 10);
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw new Error("Choose a target date (YYYY-MM-DD).");
  const parsed = new Date(date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(date)) {
    throw new Error("Choose a real calendar date.");
  }
  if (!source) throw new Error("Source menu not found or not readable.");
  const meal = form.meal || source.meal;
  if (meal !== "lunch" && meal !== "dinner") throw new Error("Meal must be lunch or dinner.");
  const items = (source.items ?? []).map((it) => ({
    corner_id: it.corner_id,
    dish_id: it.dish_id,
    price: it.price,
    sort: it.sort,
  }));
  return {
    cafeteria_id: source.cafeteria_id,
    date,
    meal,
    status: "draft",
    items,
  };
};`;

async function main() {
  const auth = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  token = auth.access_token;

  // remove the previous version (operations cascade with the flow)
  const existing = await api(
    "GET",
    `/flows?filter[name][_eq]=${encodeURIComponent(NAME)}&limit=-1`,
  );
  for (const f of existing) await api("DELETE", `/flows/${f.id}`);

  const flow = await api("POST", "/flows", {
    name: NAME,
    icon: "content_copy",
    color: "#6644FF",
    description:
      "Copies a daily menu with all its items into a new draft menu for another date (BE-17).",
    status: "active",
    trigger: "manual",
    accountability: "all",
    options: {
      collections: ["daily_menu"],
      location: "item",
      requireSelection: true,
      async: false,
      // a failed step returns an HTTP error (and an error toast in the app) instead of 200
      error_on_reject: true,
      requireConfirmation: true,
      confirmationDescription:
        "Creates a new DRAFT menu with the same dishes, corners, prices and order. Review it, then publish.",
      fields: [
        {
          field: "date",
          type: "date",
          name: "Target date",
          meta: {
            interface: "datetime",
            width: "half",
            required: true,
            note: "Date of the new menu",
          },
        },
        {
          field: "meal",
          type: "string",
          name: "Meal (optional)",
          meta: {
            interface: "select-dropdown",
            width: "half",
            note: "Leave empty to keep the meal of the source menu",
            options: {
              allowNone: true,
              choices: [
                { text: "Lunch", value: "lunch" },
                { text: "Dinner", value: "dinner" },
              ],
            },
          },
        },
      ],
    },
  });

  const read = await api("POST", "/operations", {
    flow: flow.id,
    name: "Read source menu",
    key: "read_source",
    type: "item-read",
    position_x: 19,
    position_y: 1,
    options: {
      collection: "daily_menu",
      key: ["{{$trigger.body.keys[0]}}"],
      query: {
        fields: [
          "cafeteria_id",
          "date",
          "meal",
          "items.corner_id",
          "items.dish_id",
          "items.price",
          "items.sort",
        ],
        // Nested o2m reads are capped by default; copy every item.
        deep: { items: { _limit: -1 } },
      },
      permissions: "$trigger",
    },
  });
  const build = await api("POST", "/operations", {
    flow: flow.id,
    name: "Build draft copy",
    key: "build_copy",
    type: "exec",
    position_x: 37,
    position_y: 1,
    options: { code: BUILD_PAYLOAD },
  });
  const create = await api("POST", "/operations", {
    flow: flow.id,
    name: "Create draft menu",
    key: "create_copy",
    type: "item-create",
    position_x: 55,
    position_y: 1,
    options: {
      collection: "daily_menu",
      payload: "{{build_copy}}",
      permissions: "$trigger",
      emitEvents: true,
    },
  });

  await api("PATCH", `/operations/${read.id}`, { resolve: build.id });
  await api("PATCH", `/operations/${build.id}`, { resolve: create.id });
  await api("PATCH", `/flows/${flow.id}`, { operation: read.id });
  console.log(`Flow "${NAME}" ready (id ${flow.id}).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
