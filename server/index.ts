import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";
import { getDb } from "./db";

const app = new Hono();
app.use("/*", cors({ origin: "*" }));

/* Each entity has two endpoints:
   GET  /api/:entity → return full array
   PUT  /api/:entity → receive full array, replace all rows in a transaction */

const TABLES: Record<string, { cols: string[]; placeholders: string }> = {
  investments: {
    cols: ["id", "amount", "notes", "date"],
    placeholders: "(?, ?, ?, ?)",
  },
  inventory: {
    cols: ["id", "name", "category", "qty", "cost", "image"],
    placeholders: "(?, ?, ?, ?, ?, ?)",
  },
  budgets: {
    cols: ["id", "client", "project", "investment", "amount", "delivery", "notes", "image", "status"],
    placeholders: "(?, ?, ?, ?, ?, ?, ?, ?, ?)",
  },
  tasks: {
    cols: [
      "id", "title", "project", "assignee", "priority",
      "status", "due", "notes", '"order"',
    ],
    placeholders: "(?, ?, ?, ?, ?, ?, ?, ?, ?)",
  },
};

app.get("/api/:entity", (c) => {
  const entity = c.req.param("entity");
  const info = TABLES[entity];
  if (!info) return c.json({ error: "unknown entity" }, 404);

  const order =
    entity === "investments" ? "date DESC" :
    entity === "inventory" ? "name" :
    entity === "budgets" ? "delivery DESC" :
    entity === "tasks" ? '"order" ASC' : "rowid";

  const rows = getDb().query(`SELECT * FROM ${entity} ORDER BY ${order}`).all();
  return c.json(rows);
});

app.put("/api/:entity", async (c) => {
  const entity = c.req.param("entity");
  const info = TABLES[entity];
  if (!info) return c.json({ error: "unknown entity" }, 404);

  const items: Record<string, unknown>[] = await c.req.json();
  const db = getDb();
  const quoted = info.cols.map((c) => (c === '"order"' ? c : `"${c}"`)).join(", ");

  const tx = db.transaction(() => {
    db.run(`DELETE FROM ${entity}`);
    if (items.length === 0) return;
    const stmt = db.prepare(`INSERT INTO ${entity} (${quoted}) VALUES ${info.placeholders}`);
    for (const item of items) {
      stmt.run(...info.cols.map((col) => {
        const val = item[col.replace(/"/g, "")];
        return val ?? null;
      }));
    }
  });

  tx();
  return c.json({ ok: true });
});

const PORT = Number(process.env.API_PORT || 3001);
serve({ fetch: app.fetch, port: PORT });
console.log(`🌐 API server running on http://localhost:${PORT}`);
