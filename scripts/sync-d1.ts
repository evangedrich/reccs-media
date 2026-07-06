import { writeFileSync, unlinkSync, mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { reccsData } from "../src/app/lib/local-media";
import { runImageSync } from "./sync-images";

// Load .dev.vars into process.env (KEY=VALUE per line, # comments allowed)
const devVarsPath = join(process.cwd(), ".dev.vars");
if (existsSync(devVarsPath)) {
  for (const line of readFileSync(devVarsPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const isInit = process.argv.includes("--init");
// `pnpm deploy` passes this so the cache bust is deferred until AFTER
// `opennextjs-cloudflare deploy` (which re-populates the R2/D1 caches). A
// revalidate fired before publish doesn't stick; see `pnpm revalidate`.
const skipRevalidate = process.argv.includes("--skip-revalidate");
const DB_NAME = "reccs-media";
const REVALIDATE_URL = process.env.REVALIDATE_URL ?? "https://reccs.media/api/revalidate";
const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN;

const COLUMNS = [
  "id",
  "title_original",
  "title_transliteration",
  "title_translation",
  "author",
  "intermediary",
  "century",
  "year",
  "runtime",
  "color",
  "coord_name",
  "coord_lng",
  "coord_lat",
  "trailer_url",
  "group_people",
  "group_language",
  "group_country",
  "group_location",
  "group_religion",
  "info",
  "excerpt",
  "media_urls",
  "watch_urls",
  "playlist_url",
  "genre",
  "tags",
  "refs",
  "meta",
] as const;

type Cell = string | number | null;

const strOrNull = (s: unknown): Cell =>
  typeof s === "string" && s.length > 0 ? s : null;

const arrToJson = (a: unknown): Cell => {
  if (!Array.isArray(a)) return null;
  if (a.length === 0) return null;
  if (a.length === 1 && a[0] === "") return null;
  return JSON.stringify(a);
};

const objToJson = (o: unknown): Cell => {
  if (o == null || typeof o !== "object") return null;
  if (Object.keys(o as object).length === 0) return null;
  return JSON.stringify(o);
};

type AnyRec = Record<string, unknown>;

function toRow(e: AnyRec): Record<(typeof COLUMNS)[number], Cell> {
  const title = (e.title ?? {}) as AnyRec;
  const group = (e.group ?? {}) as AnyRec;
  const coords = (e.coordinates ?? null) as AnyRec | null;

  return {
    id: String(e.id),
    title_original: String(title.original),
    title_transliteration: strOrNull(title.transliteration),
    title_translation: strOrNull(title.translation),
    author: strOrNull(e.author),
    intermediary: strOrNull(e.intermediary),
    century: typeof e.century === "number" ? e.century : null,
    year: typeof e.year === "number" ? e.year : null,
    runtime: typeof e.runtime === "number" ? e.runtime : null,
    color: strOrNull(e.color),
    coord_name: coords ? strOrNull(coords.name) : null,
    coord_lng: coords && typeof coords.x === "number" ? (coords.x as number) : null,
    coord_lat: coords && typeof coords.y === "number" ? (coords.y as number) : null,
    trailer_url: strOrNull(e.trailer),
    group_people: strOrNull(group.people),
    group_language: String(group.language),
    group_country: strOrNull(group.country),
    group_location: strOrNull(group.location),
    group_religion: strOrNull(group.religion),
    info: JSON.stringify(e.info),
    excerpt: arrToJson(e.excerpt),
    media_urls: arrToJson(e.mediaURL),
    watch_urls: arrToJson(e.watch),
    playlist_url: strOrNull(e.playlistURL),
    genre: arrToJson(e.genre),
    tags: arrToJson(e.tags),
    refs: arrToJson(e.ref),
    meta: objToJson(e.meta),
  };
}

const escapeLit = (v: Cell): string => {
  if (v === null) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
};

function buildSql(rows: Array<Record<(typeof COLUMNS)[number], Cell>>): string {
  const colList = COLUMNS.join(", ");
  const lines: string[] = ["DELETE FROM reccs;"];
  for (const r of rows) {
    const values = COLUMNS.map((c) => escapeLit(r[c])).join(", ");
    lines.push(`INSERT INTO reccs (${colList}) VALUES (${values});`);
  }
  return lines.join("\n");
}

async function maybeRevalidate(): Promise<{ ok: boolean; reason: string }> {
  if (isInit) return { ok: false, reason: "skipped (--init)" };
  if (skipRevalidate)
    return { ok: false, reason: "skipped (--skip-revalidate; deploy revalidates after publish)" };
  if (!REVALIDATE_TOKEN)
    return { ok: false, reason: "skipped (REVALIDATE_TOKEN not set)" };
  try {
    const res = await fetch(REVALIDATE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${REVALIDATE_TOKEN}` },
    });
    if (res.ok) return { ok: true, reason: `HTTP ${res.status}` };
    if (res.status === 404)
      return { ok: false, reason: "endpoint not yet deployed (HTTP 404, tolerated)" };
    return { ok: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, reason: `network error: ${(err as Error).message}` };
  }
}

async function main() {
  console.log("== Image pipeline ==");
  await runImageSync();

  console.log("\n== D1 sync ==");
  const rows = (reccsData as AnyRec[]).map(toRow);
  console.log(`Building SQL for ${rows.length} rows...`);

  const sql = buildSql(rows);
  const dir = mkdtempSync(join(tmpdir(), "sync-d1-"));
  const file = join(dir, "data.sql");
  writeFileSync(file, sql, "utf8");

  console.log(`Executing wrangler d1 execute ${DB_NAME} --remote --file=${file}`);
  const result = spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", DB_NAME, "--remote", "--file", file, "--yes"],
    { stdio: "inherit" },
  );
  try {
    unlinkSync(file);
  } catch {
    /* ignore */
  }

  if (result.status !== 0) {
    console.error(`\nD1 sync FAILED (exit ${result.status}).`);
    process.exit(result.status ?? 1);
  }

  const reval = await maybeRevalidate();
  console.log(
    `\nDone. Rows synced: ${rows.length}. Cache invalidation: ${reval.ok ? "OK" : reval.reason}.`,
  );
}

main();
