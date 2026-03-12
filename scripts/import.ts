import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "garmin.db");
const SLEEP_PATH = join(process.cwd(), "data", "sleep.json");

const db = new Database(DB_PATH);

// Create the sleep_stages table if it doesn't exist.
// One row per stage block per night.
// stage: -1=unmeasurable, 0=deep, 1=light, 2=awake, 3=rem
db.exec(`
  CREATE TABLE IF NOT EXISTS sleep_stages (
    date       TEXT NOT NULL,
    start_gmt  INTEGER NOT NULL,
    end_gmt    INTEGER NOT NULL,
    stage      INTEGER NOT NULL,
    PRIMARY KEY (date, start_gmt)
  )
`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO sleep_stages (date, start_gmt, end_gmt, stage)
  VALUES (@date, @start_gmt, @end_gmt, @stage)
`);

const sleep: { date: string; data: Record<string, unknown> }[] = JSON.parse(
  readFileSync(SLEEP_PATH, "utf-8"),
);

let inserted = 0;
let skipped = 0;

const importAll = db.transaction(() => {
  for (const record of sleep) {
    const date = record.date;
    const levels =
      (record.data?.sleepLevels as {
        startGMT: string;
        endGMT: string;
        activityLevel: number;
      }[]) ?? [];

    for (const level of levels) {
      // startGMT and endGMT come as strings like "2026-03-11T06:28:03.0"
      // Convert to ms timestamps for easy math later
      const start_gmt = new Date(level.startGMT).getTime();
      const end_gmt = new Date(level.endGMT).getTime();
      const stage = level.activityLevel;

      const result = insert.run({ date, start_gmt, end_gmt, stage });
      if (result.changes > 0) inserted++;
      else skipped++;
    }
  }
});

importAll();

console.log(
  `Done — inserted ${inserted} rows, skipped ${skipped} already existing`,
);
db.close();
