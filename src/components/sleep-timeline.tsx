"use client";

interface Stage {
  start_gmt: number;
  end_gmt: number;
  stage: number;
}

interface Nap {
  id: number;
  start_gmt: number;
  end_gmt: number;
}

interface Props {
  stages: Stage[];
  naps?: Nap[];
}

const TZ = "America/Chicago";

const STAGE_COLORS: Record<number, string> = {
  [-1]: "#3f3f46",
  0: "#1e3a8a",
  1: "#38bdf8",
  2: "#e879f9",
  3: "#f87171",
};

const STAGE_LABELS: Record<number, string> = {
  [-1]: "Unmeasurable",
  0: "Deep",
  1: "Light",
  2: "REM",
  3: "Awake",
};

function fmtCT(ms: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function fmtDur(ms: number) {
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function SleepTimeline({ stages, naps = [] }: Props) {
  if (stages.length === 0) return null;

  const sleepStart = stages[0].start_gmt;
  const sleepEnd = stages[stages.length - 1].end_gmt;
  const sleepMs = sleepEnd - sleepStart;

  const napsBefore = naps.filter((n) => n.end_gmt <= sleepStart);
  const napsAfter = naps.filter((n) => n.start_gmt >= sleepEnd);

  const stageTotals: Record<number, number> = {};
  for (const s of stages) {
    stageTotals[s.stage] =
      (stageTotals[s.stage] ?? 0) + (s.end_gmt - s.start_gmt);
  }
  const napTotalMs = naps.reduce((s, n) => s + (n.end_gmt - n.start_gmt), 0);

  return (
    <div className="w-full space-y-1">
      {/* Naps before */}
      {napsBefore.map((n) => (
        <div key={n.id} className="flex items-center gap-2">
          <div
            className="h-5 rounded-sm bg-amber-500"
            style={{ width: `${((n.end_gmt - n.start_gmt) / sleepMs) * 100}%` }}
            title={`Nap · ${fmtCT(n.start_gmt)} – ${fmtCT(n.end_gmt)}`}
          />
          <span className="text-xs text-zinc-500">
            {fmtCT(n.start_gmt)} – {fmtCT(n.end_gmt)}
          </span>
        </div>
      ))}

      {/* Main sleep bar */}
      <div className="flex h-10 w-full overflow-hidden rounded-md">
        {stages.map((s, i) => (
          <div
            key={i}
            title={`${STAGE_LABELS[s.stage] ?? s.stage} · ${fmtCT(s.start_gmt)} – ${fmtCT(s.end_gmt)}`}
            style={{
              width: `${((s.end_gmt - s.start_gmt) / sleepMs) * 100}%`,
              backgroundColor: STAGE_COLORS[s.stage] ?? "#52525b",
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{fmtCT(sleepStart)}</span>
        <span>{fmtCT(sleepEnd)}</span>
      </div>

      {/* Naps after */}
      {napsAfter.map((n) => (
        <div key={n.id} className="flex items-center gap-2">
          <div
            className="h-5 rounded-sm bg-amber-500"
            style={{ width: `${((n.end_gmt - n.start_gmt) / sleepMs) * 100}%` }}
            title={`Nap · ${fmtCT(n.start_gmt)} – ${fmtCT(n.end_gmt)}`}
          />
          <span className="text-xs text-zinc-500">
            {fmtCT(n.start_gmt)} – {fmtCT(n.end_gmt)}
          </span>
        </div>
      ))}

      {/* Stage totals */}
      <div className="flex flex-wrap gap-4 pt-1 text-xs text-zinc-400">
        <span className="text-zinc-200">{fmtDur(sleepMs)}</span>
        {[0, 1, 2, 3].map((stage) =>
          stageTotals[stage] ? (
            <span key={stage}>
              <span style={{ color: STAGE_COLORS[stage] }}>■</span>{" "}
              {STAGE_LABELS[stage]} {fmtDur(stageTotals[stage])}
            </span>
          ) : null,
        )}
        {napTotalMs > 0 && (
          <span>
            <span style={{ color: "#f59e0b" }}>■</span> Nap {fmtDur(napTotalMs)}
          </span>
        )}
      </div>
    </div>
  );
}
