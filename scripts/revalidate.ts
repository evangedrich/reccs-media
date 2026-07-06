import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Busts the production "reccs" cache tag by POSTing to the deployed
// /api/revalidate endpoint. `pnpm deploy` runs this LAST — after
// `opennextjs-cloudflare deploy` re-populates the R2/D1 caches — so the
// invalidation is the final thing to touch the cache state and actually sticks.
// (A revalidate fired before publish gets undone by the deploy's cache populate.)

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

const REVALIDATE_URL = process.env.REVALIDATE_URL ?? "https://reccs.media/api/revalidate";
const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN;

async function revalidate(): Promise<{ ok: boolean; reason: string }> {
  if (!REVALIDATE_TOKEN)
    return { ok: false, reason: "skipped (REVALIDATE_TOKEN not set)" };
  try {
    const res = await fetch(REVALIDATE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${REVALIDATE_TOKEN}` },
    });
    if (res.ok) return { ok: true, reason: `HTTP ${res.status}` };
    return { ok: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, reason: `network error: ${(err as Error).message}` };
  }
}

// Non-fatal: a failed cache ping should not fail an otherwise-successful deploy.
// The logged message surfaces it so a stale cache can be busted with `pnpm revalidate`.
revalidate().then((r) => {
  console.log(`Cache invalidation: ${r.ok ? "OK" : r.reason}.`);
});
