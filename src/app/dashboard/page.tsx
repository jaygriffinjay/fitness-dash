import Database from "better-sqlite3";
import path from "path";
import { SleepPieChart } from "@/components/sleep-pie-chart";
import { SleepTimeline } from "@/components/sleep-timeline";
import { AddNapForm } from "@/components/add-nap-form";

const DB_PATH = path.join(process.cwd(), "data", "garmin.db");

interface SleepStage {
  date: string;
  start_gmt: number;
  end_gmt: number;
  stage: number;
}

interface Nap {
  id: number;
  date: string;
  start_gmt: number;
  end_gmt: number;
}

const STAGE_LABELS: Record<number, string> = {
  [-1]: "Unmeasurable",
  0: "Deep",
  1: "Light",
  2: "REM",
  3: "Awake",
};

function loadNight(date: string): SleepStage[] {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db
    .prepare("SELECT * FROM sleep_stages WHERE date = ? ORDER BY start_gmt ASC")
    .all(date) as SleepStage[];
  db.close();
  return rows;
}

function loadNaps(date: string): Nap[] {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db
    .prepare("SELECT * FROM naps WHERE date = ? ORDER BY start_gmt ASC")
    .all(date) as Nap[];
  db.close();
  return rows;
}

function loadLatestDate(): string {
  const db = new Database(DB_PATH, { readonly: true });
  const row = db
    .prepare("SELECT date FROM sleep_stages ORDER BY date DESC LIMIT 1")
    .get() as { date: string } | undefined;
  db.close();
  return row?.date ?? "2026-03-11";
}

export default function DashboardPage() {
  const date = loadLatestDate();
  const stages = loadNight(date);
  const naps = loadNaps(date);

  // Totals per stage and overall
  const totalMs = stages.reduce((s, r) => s + (r.end_gmt - r.start_gmt), 0);
  const totalsPerStage: Record<number, number> = {};
  for (const r of stages) {
    totalsPerStage[r.stage] =
      (totalsPerStage[r.stage] ?? 0) + (r.end_gmt - r.start_gmt);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1 className="mb-2 text-2xl font-bold">Sleep — {date}</h1>

      <div className="mb-8 flex gap-6 text-sm">
        <div>
          <span className="text-zinc-400">Total: </span>
          <span className="tabular-nums">
            {Math.round(totalMs / 60000)} min
          </span>
        </div>
        {Object.entries(totalsPerStage).map(([stage, ms]) => (
          <div key={stage}>
            <span className="text-zinc-400">
              {STAGE_LABELS[Number(stage)] ?? stage}:{" "}
            </span>
            <span className="tabular-nums">{Math.round(ms / 60000)} min</span>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <SleepTimeline stages={stages} naps={naps} />
      </div>

      <div className="mb-8">
        <AddNapForm defaultDate={date} />
      </div>

      <SleepPieChart
        data={Object.entries(totalsPerStage)
          .filter(([stage]) => Number(stage) !== -1)
          .map(([stage, ms]) => ({
            name: STAGE_LABELS[Number(stage)] ?? String(stage),
            minutes: Math.round(ms / 60000),
          }))}
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-zinc-400">
            <th className="pr-8 pb-2">Stage</th>
            <th className="pr-8 pb-2">Start (GMT)</th>
            <th className="pr-8 pb-2">End (GMT)</th>
            <th className="pb-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s) => {
            const durationMin = Math.round((s.end_gmt - s.start_gmt) / 60000);
            return (
              <tr key={s.start_gmt} className="border-b border-zinc-800">
                <td className="py-2 pr-8">
                  {STAGE_LABELS[s.stage] ?? s.stage}
                </td>
                <td className="py-2 pr-8 text-zinc-400 tabular-nums">
                  {new Date(s.start_gmt).toISOString()}
                </td>
                <td className="py-2 pr-8 text-zinc-400 tabular-nums">
                  {new Date(s.end_gmt).toISOString()}
                </td>
                <td className="py-2 tabular-nums">{durationMin} min</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
