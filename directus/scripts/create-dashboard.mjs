// Creates the Directus Insights dashboard "Scans" (BE-12): scans today, scans per day,
// scans per language. Idempotent: finds the dashboard by name and replaces its panels.
// Needs the schema applied. Reads only counts of scan_event (no personal data exists there, BR8).
//
// Usage: npm run backend:dashboard   (ADMIN_EMAIL / ADMIN_PASSWORD / DIRECTUS_PORT from .env)

const URL_BASE = (
  process.env.DIRECTUS_URL ?? `http://localhost:${process.env.DIRECTUS_PORT ?? 8055}`
).replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

const NAME = "Scans";

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

// Grid: 24 columns. position/size in grid units.
const panels = (dashboard) => [
  {
    dashboard,
    type: "metric",
    name: "Scans today (last 24 h)",
    icon: "qr_code_scanner",
    color: "#6644FF",
    position_x: 1,
    position_y: 1,
    width: 12,
    height: 6,
    options: {
      collection: "scan_event",
      field: "id",
      function: "count",
      filter: { created_at: { _gte: "$NOW(-1 day)" } },
    },
  },
  {
    dashboard,
    type: "metric",
    name: "Scans, all time",
    icon: "functions",
    position_x: 13,
    position_y: 1,
    width: 12,
    height: 6,
    options: { collection: "scan_event", field: "id", function: "count" },
  },
  {
    dashboard,
    type: "time-series",
    name: "Scans per day (last month)",
    icon: "show_chart",
    position_x: 1,
    position_y: 7,
    width: 24,
    height: 12,
    options: {
      collection: "scan_event",
      dateField: "created_at",
      function: "count",
      valueField: "id",
      precision: "day",
      range: "1 month",
      color: "#6644FF",
    },
  },
  {
    dashboard,
    type: "bar-chart",
    name: "Scans per language",
    icon: "translate",
    position_x: 1,
    position_y: 19,
    width: 24,
    height: 12,
    options: {
      collection: "scan_event",
      xAxis: "lang",
      yAxis: "id",
      function: "count",
      horizontal: false,
    },
  },
];

async function main() {
  token = (await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD })).access_token;

  const found = await api("GET", `/dashboards?filter[name][_eq]=${NAME}&limit=1`);
  const dashboard = found.length
    ? found[0]
    : await api("POST", "/dashboards", {
        name: NAME,
        icon: "analytics",
        note: "Usage counts only (BR8): scan_event holds no personal data",
        color: "#6644FF",
      });

  const old = await api("GET", `/panels?filter[dashboard][_eq]=${dashboard.id}&limit=-1&fields=id`);
  if (old.length)
    await api(
      "DELETE",
      "/panels",
      old.map((o) => o.id),
    );
  const created = await api("POST", "/panels", panels(dashboard.id));
  console.log(`dashboard "${NAME}" (${dashboard.id}): ${created.length} panels`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
