import { readFileSync } from "fs";
import { join } from "path";

const file = process.argv[2];
if (!file) {
  console.log("Usage: npx tsx scripts/inspect.ts data/sleep.json");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(join(process.cwd(), file), "utf-8"));
const records: Record<string, unknown>[] = Array.isArray(raw)
  ? raw
  : (raw.activities ?? [raw]);

// Union all records into one so every field that ever appears is shown
const merged: Record<string, unknown> = {};
for (const r of records) {
  for (const [k, v] of Object.entries(r)) {
    if (!(k in merged) || merged[k] === null) merged[k] = v;
  }
}

function print(obj: Record<string, unknown>, pad = "") {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      console.log(`${pad}${k}:`);
      print(v as Record<string, unknown>, pad + "  ");
    } else if (Array.isArray(v) && v[0] && typeof v[0] === "object") {
      console.log(`${pad}${k}: list[${v.length}]`);
      print(v[0] as Record<string, unknown>, pad + "  ");
    } else {
      console.log(
        `${pad}${k}: ${typeof v} = ${JSON.stringify(v)?.slice(0, 80)}`,
      );
    }
  }
}

console.log(`${records.length} records — merged schema:\n`);
print(merged);
