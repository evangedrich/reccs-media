import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import subsetFont from "subset-font";

// Generates glyph-subset versions of the self-hosted fonts (JuliaMono, NotoEmoji)
// containing only the characters actually used across the site's content + UI.
// Each weight shrinks from ~1 MB to ~55 KB, so the body font arrives before paint
// and the FOUT/flash disappears. The full fonts remain wired up in fonts.ts as a
// lazy fallback layer, so any character not in the subset (e.g. a new entry added
// via `pnpm sync` before the next deploy) still renders — never tofu.
//
// Run as part of `pnpm run deploy` (before the build). Skips work when the used
// character set is unchanged (content hash), so most builds cost ~0s.

const FONTS_DIR = join(process.cwd(), "src/app/fonts");
const HASH_FILE = join(FONTS_DIR, ".subset-hash");

// Self-hosted font families to subset: directory name -> weight files live directly
// inside it; subsets are written to its `subset/` sub-directory.
const FONT_FAMILIES = ["JuliaMono", "NotoEmoji"];

// Scan EVERY .ts/.tsx under src/app (not a hardcoded file list): reading raw file
// content captures every character in every string literal — UI chrome, page copy,
// and data modules (local-media, subregions, collections, …) alike. A glyph missing
// here escapes the subset and forces the browser to download the full ~1 MB weight,
// so the scan must be exhaustive. Code syntax is ASCII, already in the baseline.
function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkSource(full, acc);
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function collectUsedText(): string {
  let raw = "";
  for (const file of walkSource(join(process.cwd(), "src/app"))) {
    raw += readFileSync(file, "utf8");
  }
  // Drop HTML/JSX tags so markup like <i>, <br>, <span> isn't counted as glyphs;
  // the text content between tags is preserved.
  const stripped = raw.replace(/<[^>]+>/g, "");

  const chars = new Set<string>();
  // Baseline: all printable ASCII + Latin-1 so UI chrome always renders even if the
  // content scan changes.
  for (let cp = 0x20; cp <= 0x7e; cp++) chars.add(String.fromCharCode(cp));
  for (let cp = 0xa0; cp <= 0xff; cp++) chars.add(String.fromCharCode(cp));
  for (const ch of stripped) if (ch.codePointAt(0)! >= 0x20) chars.add(ch);

  // Sort for a stable, deterministic hash regardless of scan order.
  return [...chars].sort().join("");
}

async function main() {
  const force = process.argv.includes("--force");
  const text = collectUsedText();
  const hash = createHash("sha256").update(text).digest("hex");
  const codepoints = [...new Set([...text].map((c) => c.codePointAt(0)))].length;

  if (!force && existsSync(HASH_FILE) && readFileSync(HASH_FILE, "utf8").trim() === hash) {
    console.log(`[subset-fonts] up to date (${codepoints} codepoints) — skipping.`);
    return;
  }

  console.log(`[subset-fonts] subsetting for ${codepoints} codepoints...`);
  const jobs: Promise<void>[] = [];

  for (const family of FONT_FAMILIES) {
    const familyDir = join(FONTS_DIR, family);
    const outDir = join(familyDir, "subset");
    mkdirSync(outDir, { recursive: true });

    for (const file of readdirSync(familyDir)) {
      if (!file.endsWith(".woff2")) continue;
      jobs.push(
        (async () => {
          const input = readFileSync(join(familyDir, file));
          // Each font keeps only the glyphs it actually has among `text`, so passing
          // the full character set to NotoEmoji yields just the used emoji, etc.
          const output = await subsetFont(input, text, { targetFormat: "woff2" });
          writeFileSync(join(outDir, file), output);
          const pct = ((1 - output.length / input.length) * 100).toFixed(1);
          console.log(
            `  ${family}/subset/${basename(file)}: ` +
              `${(input.length / 1024).toFixed(0)} KB -> ${(output.length / 1024).toFixed(0)} KB (-${pct}%)`,
          );
        })(),
      );
    }
  }

  await Promise.all(jobs);
  writeFileSync(HASH_FILE, hash + "\n");
  console.log(`[subset-fonts] done (${jobs.length} files).`);
}

main().catch((err) => {
  console.error("[subset-fonts] failed:", err);
  process.exit(1);
});
