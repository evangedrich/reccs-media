import {
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from "node:fs";
import { join, relative, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// Load .dev.vars (KEY=VALUE per line, # comments allowed)
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

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, "images-source");
const PUBLIC_IMAGES_DIR = join(ROOT, "public", "images");
const MANIFEST_PATH = join(ROOT, "scripts", "images-manifest.json");
const BUCKET = "reccs-media-images";
const PUBLIC_BASE = "https://images.reccs.media";
const SERVED_EXTS = [".webp", ".png", ".svg", ".jpg", ".jpeg", ".avif", ".gif"];

type Manifest = Record<string, string>;

function walk(dir: string, exts?: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(p, exts));
    } else if (!exts || exts.some((e) => entry.name.toLowerCase().endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveManifest(m: Manifest) {
  const sorted: Manifest = {};
  for (const k of Object.keys(m).sort()) sorted[k] = m[k];
  writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

function checkCwebp(): void {
  const r = spawnSync("cwebp", ["-version"], { stdio: "pipe" });
  if (r.status !== 0) {
    console.error("cwebp not found. Install with: brew install webp");
    process.exit(1);
  }
}

// Phase A: convert JPGs in images-source/** to WebPs in public/images/**
function convertJpgs(): { converted: number } {
  let converted = 0;
  const jpgs = walk(SOURCE_DIR, [".jpg", ".jpeg"]);
  if (jpgs.length === 0) return { converted };
  checkCwebp();
  for (const jpg of jpgs) {
    const rel = relative(SOURCE_DIR, jpg).replace(/\.(jpe?g)$/i, ".webp");
    const out = join(PUBLIC_IMAGES_DIR, rel);

    let needsConvert = !existsSync(out);
    if (!needsConvert) {
      const jpgM = statSync(jpg).mtimeMs;
      const webpM = statSync(out).mtimeMs;
      if (jpgM > webpM) needsConvert = true;
    }
    if (!needsConvert) continue;

    mkdirSync(dirname(out), { recursive: true });
    const r = spawnSync(
      "cwebp",
      ["-quiet", "-q", "92", "-metadata", "icc", "-resize", "600", "0", jpg, "-o", out],
      { stdio: "inherit" },
    );
    if (r.status !== 0) {
      console.error(`cwebp failed for ${rel}`);
      process.exit(1);
    }
    converted++;
  }
  return { converted };
}

// Phase B: hash diff every file under public/images/, upload changed/new to R2
function syncR2(): { uploaded: number; replaced: number; replacedUrls: string[] } {
  const manifest = loadManifest();
  const files = walk(PUBLIC_IMAGES_DIR, SERVED_EXTS);
  const replacedUrls: string[] = [];
  let uploaded = 0;
  let replaced = 0;
  const newManifest: Manifest = {};

  for (const file of files) {
    const rel = relative(PUBLIC_IMAGES_DIR, file).split("\\").join("/");
    const hash = hashFile(file);
    newManifest[rel] = hash;

    const prev = manifest[rel];
    const isNew = !prev;
    const wasReplacement = prev && prev !== hash;
    if (!isNew && !wasReplacement) continue;

    const r = spawnSync(
      "pnpm",
      [
        "exec",
        "wrangler",
        "r2",
        "object",
        "put",
        `${BUCKET}/${rel}`,
        "--file",
        file,
        "--remote",
      ],
      { stdio: "inherit" },
    );
    if (r.status !== 0) {
      console.error(`r2 upload failed for ${rel}`);
      process.exit(1);
    }

    uploaded++;
    if (wasReplacement) {
      replaced++;
      replacedUrls.push(`${PUBLIC_BASE}/${rel}`);
    }
  }

  saveManifest(newManifest);
  return { uploaded, replaced, replacedUrls };
}

// Phase C: purge replaced URLs from Cloudflare's edge cache
async function purge(urls: string[]): Promise<{ ok: boolean; purged: number; reason?: string }> {
  if (urls.length === 0) return { ok: true, purged: 0 };
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !token) {
    return { ok: false, purged: 0, reason: "CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set" };
  }
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ files: urls }),
      },
    );
    if (res.ok) return { ok: true, purged: urls.length };
    return { ok: false, purged: 0, reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, purged: 0, reason: (err as Error).message };
  }
}

export async function runImageSync(opts: { localOnly?: boolean } = {}): Promise<void> {
  const a = convertJpgs();
  if (a.converted > 0) console.log(`Phase A: converted ${a.converted} JPG${a.converted === 1 ? "" : "s"}.`);
  else console.log("Phase A: no JPGs needed conversion.");

  if (opts.localOnly) {
    console.log("--local flag set; skipping R2 upload and cache purge.");
    return;
  }

  const b = syncR2();
  console.log(
    `Phase B: uploaded ${b.uploaded}${b.replaced ? ` (${b.replaced} replaced)` : ""}.`,
  );

  const c = await purge(b.replacedUrls);
  if (c.ok) {
    if (c.purged > 0) console.log(`Phase C: purged ${c.purged} URL${c.purged === 1 ? "" : "s"} from CDN.`);
    else console.log("Phase C: no URLs needed purging.");
  } else {
    console.log(`Phase C: purge skipped/failed (${c.reason}).`);
  }

  console.log(
    `\nImages done. converted: ${a.converted}, uploaded: ${b.uploaded} (${b.replaced} replaced), purged: ${c.ok ? c.purged : 0}.`,
  );
}

// Run as entry point only when invoked directly (e.g. `tsx scripts/sync-images.ts`)
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("sync-images.ts");
if (invokedDirectly) {
  runImageSync({ localOnly: process.argv.includes("--local") }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
