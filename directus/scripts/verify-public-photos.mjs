// BE-19 check: anonymous /assets/<id> works only for the photo of a published dish.
// Creates throwaway files and dishes (prefix "verify-photo-"), checks, then deletes them.
// Usage: npm run backend:verify:photos  (needs schema + permissions applied)

const URL_BASE = (
  process.env.DIRECTUS_URL ?? `http://localhost:${process.env.DIRECTUS_PORT ?? 8055}`
).replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

let token;
async function api(method, path, body) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text).data : null;
}
async function upload(name) {
  const form = new FormData();
  form.append("title", name);
  form.append("file", new Blob([PNG], { type: "image/png" }), `${name}.png`);
  return (await api("POST", "/files", form)).id;
}
const anon = async (path) => (await fetch(`${URL_BASE}${path}`)).status;

const cleanup = { dishes: [], files: [] };
let failed = 0;
function expect(label, got, want) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${got} (expected ${want})`);
}

async function main() {
  token = (await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD })).access_token;

  const pubFile = await upload("verify-photo-published");
  const draftFile = await upload("verify-photo-draft");
  const freeFile = await upload("verify-photo-unattached");
  cleanup.files.push(pubFile, draftFile, freeFile);

  const mk = async (name, photo, status) => {
    const d = await api("POST", "/items/dish", {
      name_ko: name,
      spice_level: 0,
      allergens_confirmed: true,
      photo,
      status: "draft",
      translations: [{ lang: "en", name, source: "human", status: "approved" }],
    });
    cleanup.dishes.push(d.id);
    if (status === "published") await api("PATCH", `/items/dish/${d.id}`, { status });
  };
  await mk("verify-photo-published", pubFile, "published");
  await mk("verify-photo-draft", draftFile, "draft");

  expect("published dish photo", await anon(`/assets/${pubFile}`), 200);
  expect(
    "published dish photo, webp 400",
    await anon(`/assets/${pubFile}?format=webp&width=400`),
    200,
  );
  expect("draft dish photo", await anon(`/assets/${draftFile}`), 403);
  expect("unattached file", await anon(`/assets/${freeFile}`), 403);

  const list = await (await fetch(`${URL_BASE}/files?limit=-1`)).json();
  const ids = (list.data ?? []).map((f) => f.id);
  expect("anonymous /files lists only the published photo", ids.join(","), pubFile);
  console.log("fields exposed:", Object.keys(list.data?.[0] ?? {}).join(","));
}

main()
  .catch((e) => {
    failed++;
    console.error(e.message);
  })
  .finally(async () => {
    try {
      for (const id of cleanup.dishes) await api("PATCH", `/items/dish/${id}`, { status: "draft" });
      for (const id of cleanup.dishes) await api("DELETE", `/items/dish/${id}`);
      for (const id of cleanup.files) await api("DELETE", `/files/${id}`);
    } catch (e) {
      console.error("cleanup:", e.message);
    }
    process.exit(failed ? 1 : 0);
  });
