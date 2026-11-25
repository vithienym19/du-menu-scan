// du-menu-endpoint: public read endpoints under /du (BE-11, BE-20):
//   GET /du/menu/{code}/today, GET /du/cafeterias, GET /du/cafeterias/{code}, GET /du/dishes/{id}
// Reads use the raw knex handle, so Directus permissions do NOT apply: every query filters
// explicitly (see handlers.js). Never remove those filters; directus/test/handlers.test.mjs guards them.
import { createHandlers } from "./handlers.js";

export default {
  id: "du",
  handler: (router, { database }) => {
    const h = createHandlers(database);
    router.get("/menu/:code/today", h.todayMenu);
    router.get("/cafeterias", h.cafeterias);
    router.get("/cafeterias/:code", h.cafeteria);
    router.get("/dishes/:id", h.dish);
  },
};
