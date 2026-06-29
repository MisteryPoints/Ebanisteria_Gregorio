import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = process.env.DB_DIR || join(import.meta.dir, "..", "data");
const DB_PATH = join(DATA_DIR, "eg.db");

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      qty INTEGER NOT NULL DEFAULT 1,
      cost REAL NOT NULL DEFAULT 0,
      image TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      client TEXT NOT NULL DEFAULT '',
      project TEXT NOT NULL DEFAULT '',
      investment REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      delivery TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      image TEXT,
      status TEXT NOT NULL DEFAULT 'Pendiente'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      project TEXT NOT NULL DEFAULT '',
      assignee TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Media',
      status TEXT NOT NULL DEFAULT 'Pendiente',
      due TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      "order" INTEGER NOT NULL DEFAULT 0
    )
  `);

  return db;
}
