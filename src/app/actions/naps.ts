"use server";

import Database from "better-sqlite3";
import path from "path";
import { revalidatePath } from "next/cache";

const DB_PATH = path.join(process.cwd(), "data", "garmin.db");
const TZ = "America/Chicago";

/** Convert a "YYYY-MM-DD" + "HH:MM" in CT to UTC ms */
function ctToUtcMs(date: string, time: string): number {
  // Build an ISO string and use the Temporal-free approach:
  // Parse by constructing a date at UTC midnight, then adjust for CT offset
  const naive = new Date(`${date}T${time}:00`);
  // Get what CT thinks the offset is at this moment using Intl
  // We'll use a trick: format the naive UTC date in CT and compare
  const utcMs = naive.getTime();
  // Approximate CT offset by formatting a nearby UTC time
  const offsetMin = getCtOffsetMinutes(utcMs);
  return utcMs - offsetMin * 60_000;
}

/** Returns CT offset from UTC in minutes (e.g. -360 for CST, -300 for CDT) */
function getCtOffsetMinutes(utcMs: number): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(utcMs));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value);
  const ctDate = new Date(
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ),
  );
  return (ctDate.getTime() - utcMs) / 60_000;
}

export async function addNap(formData: FormData) {
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!date || !startTime || !endTime) return;

  const start_gmt = ctToUtcMs(date, startTime);
  const end_gmt = ctToUtcMs(date, endTime);

  if (end_gmt <= start_gmt) return;

  const db = new Database(DB_PATH);
  db.prepare(
    "INSERT INTO naps (date, start_gmt, end_gmt) VALUES (?, ?, ?)",
  ).run(date, start_gmt, end_gmt);
  db.close();

  revalidatePath("/dashboard");
}
