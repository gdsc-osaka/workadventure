import { DatabaseSync } from "node:sqlite";
import { ADMIN_API_DB_PATH } from "../env.js";
import fs from "node:fs";
import path from "node:path";

fs.mkdirSync(path.dirname(ADMIN_API_DB_PATH), { recursive: true });

const db = new DatabaseSync(ADMIN_API_DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
  user_identifier TEXT PRIMARY KEY,
  textures        TEXT,
  name            TEXT,
  companion       TEXT,
  companion_set   INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL
);
`);

export { db };
