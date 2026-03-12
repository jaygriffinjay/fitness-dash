import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "garmin.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS naps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL,
    start_gmt  INTEGER NOT NULL,
    end_gmt    INTEGER NOT NULL
  )
`);

console.log("naps table ready");
db.close();
