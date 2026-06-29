import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const store: Record<string, unknown[]> = {
  investments: [],
  inventory: [],
  budgets: [],
  tasks: [],
};
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const { readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const file = join(process.cwd(), ".data", "store.json");
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, "utf-8"));
      if (parsed.investments) store.investments = parsed.investments;
      if (parsed.inventory) store.inventory = parsed.inventory;
      if (parsed.budgets) store.budgets = parsed.budgets;
      if (parsed.tasks) store.tasks = parsed.tasks;
    }
  } catch {
    /* in-memory only */
  }
}

function persist() {
  import("node:fs")
    .then((fs) => {
      import("node:path").then((path) => {
        try {
          const dir = path.join(process.cwd(), ".data");
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "store.json"), JSON.stringify(store), "utf-8");
        } catch {
          /* skip */
        }
      });
    })
    .catch(() => {});
}

export const pullAll = createServerFn({ method: "GET", strict: false }).handler(async () => {
  await load();
  return { ...store };
});

export const pushEntity = createServerFn({ method: "POST" })
  .validator(z.any())
  .handler(async (ctx) => {
    const { entity, data } = ctx.data as { entity: string; data: unknown[] };
    await load();
    store[entity] = data;
    persist();
    return { ok: true };
  });
