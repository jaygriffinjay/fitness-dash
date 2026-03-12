import { readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

function getSchema(obj: unknown, depth = 0): React.ReactNode {
  if (obj === null || obj === undefined) {
    return <span className="text-zinc-500">null</span>;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return <span className="text-zinc-500">[]</span>;
    const first = obj[0];
    if (typeof first === "object" && first !== null) {
      return (
        <span>
          <span className="text-blue-400">list[{obj.length}]</span>
          <div className="mt-1 ml-4 border-l border-zinc-700 pl-3">
            {getSchema(first, depth + 1)}
          </div>
        </span>
      );
    }
    return (
      <span className="text-blue-400">
        list[{obj.length}] of {typeof first} &nbsp;
        <span className="text-zinc-500">
          e.g. {JSON.stringify(first).slice(0, 60)}
        </span>
      </span>
    );
  }

  if (typeof obj === "object") {
    return (
      <div className={depth > 0 ? "ml-4 border-l border-zinc-700 pl-3" : ""}>
        {Object.entries(obj as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="my-0.5">
            <span className="font-medium text-emerald-400">{k}</span>
            <span className="text-zinc-500">: </span>
            {typeof v === "object" ? (
              getSchema(v, depth + 1)
            ) : (
              <span>
                <span className="text-yellow-400">{typeof v}</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-zinc-300">
                  {JSON.stringify(v)?.slice(0, 80)}
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <span>
      <span className="text-yellow-400">{typeof obj}</span>
      <span className="text-zinc-500"> = </span>
      <span className="text-zinc-300">{JSON.stringify(obj)}</span>
    </span>
  );
}

// Merge all records so every field that ever appears is shown
function mergeRecords(
  records: Record<string, unknown>[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const r of records) {
    for (const [k, v] of Object.entries(r)) {
      if (!(k in result) || result[k] === null) {
        result[k] = v;
      }
    }
  }
  return result;
}

function loadFile(name: string) {
  try {
    const raw = readFileSync(join(DATA_DIR, name), "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return { records: data, count: data.length };
    if (data.activities)
      return { records: data.activities, count: data.activities.length };
    return { records: [data], count: 1 };
  } catch {
    return null;
  }
}

export default function InspectPage() {
  const sleep = loadFile("sleep.json");
  const activities = loadFile("activities.json");

  // Collect unique activityLevel values from sleepLevels across all nights
  const sleepLevelValues = sleep
    ? [
        ...new Set<number>(
          (sleep.records as Record<string, unknown>[]).flatMap((r) =>
            (
              ((r.data as Record<string, unknown>)?.sleepLevels as {
                activityLevel: number;
              }[]) ?? []
            ).map((s) => s.activityLevel),
          ),
        ),
      ].sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 p-8 font-mono text-sm text-zinc-100">
      <h1 className="mb-8 text-2xl font-bold text-white">Data Inspector</h1>

      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">
          sleepLevels — unique activityLevel values
        </h2>
        <p className="mb-4 text-zinc-500">
          All distinct values across all {sleep?.count} nights
        </p>
        <div className="flex gap-4">
          {sleepLevelValues.map((v) => (
            <span
              key={v}
              className="rounded bg-zinc-800 px-3 py-1 text-yellow-400"
            >
              {v}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">sleep.json</h2>
        {sleep ? (
          <>
            <p className="mb-4 text-zinc-500">
              {sleep.count} records — merged schema
            </p>
            {getSchema(
              mergeRecords(sleep.records as Record<string, unknown>[]),
            )}
          </>
        ) : (
          <p className="text-zinc-500">File not found</p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-white">
          activities.json
        </h2>
        {activities ? (
          <>
            <p className="mb-4 text-zinc-500">
              {activities.count} records — merged schema
            </p>
            {getSchema(
              mergeRecords(activities.records as Record<string, unknown>[]),
            )}
          </>
        ) : (
          <p className="text-zinc-500">File not found</p>
        )}
      </section>
    </div>
  );
}
