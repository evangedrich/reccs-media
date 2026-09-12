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
//
// `remapAxis` rebuilds a variable font so its wght axis reads on the CSS scale. Neither
// of the two faces that use it is drawn on that scale: MiSans Tibetan puts Semibold at
// 520 and Heavy at 700, Ingeo SemiBold at 110 and Black at 204. Left alone, CSS
// `font-weight: 600` asks for axis 600 — nine-tenths of the way from MiSans Semibold to
// Bold — so Tibetan rendered visibly heavier than the Noto scripts beside it, and Ingeo
// clamped everything above 204 to Black.
//
// It works in two steps. hb-subset first limits the axis to the design range in use with
// the low end as the new default, which rewrites the gvar deltas so normalised 0 is that
// design and normalised 1 is the high one. The fvar axis record is then relabelled to the
// CSS range. Normalised coordinates are what gvar is keyed to and they are untouched, so
// CSS 600 resolves to the `design[0]` drawing and CSS 900 to `design[1]`, exactly as the
// pinned statics did — verified pixel-identical, 0.00% ink difference at both weights.
//
// The alternative, pinning one static per weight, is what this replaces: cards draw
// titles at 600 and entry headers at 900, so two files meant clicking a card through to
// its entry page fetched a file the listing page never loaded, and the entry title
// flashed on every navigation. One file covering both weights is already cached by then.
// (Doing this with a `font-variation-settings` @font-face descriptor would need one
// family per weight, which breaks CSS weight fall-through; remapping the axis needs no
// descriptor support at all.)
//
// Both variable sources here deliberately have NO `STAT` table. hb-subset emits STAT
// as a zero-length table, and OTS (the sanitizer in Chrome/Firefox) rejects the entire
// font over that — silently, with only a console notice, so the page just renders
// in the fallback and everything else looks fine. STAT only carries style-attribute
// metadata for font pickers; browsers vary fonts off `fvar`, which subsets cleanly.
// If either is regenerated from its original .ttf (both ship a valid STAT, and Ingeo
// a DSIG that is meaningless once subset), strip those tables first —
// `assertNoEmptyTables` below fails the build if this regresses.
type FontFamily = {
  dir: string;
  /** design: the font's own wght values to keep. css: the range they are relabelled to. */
  remapAxis?: { design: [number, number]; css: [number, number] };
};
const FONT_FAMILIES: FontFamily[] = [
  { dir: "JuliaMono" },
  { dir: "NotoEmoji" },
  {
    dir: "MiSansTibetan",
    // MiSans Semibold (520) -> CSS 600, MiSans Heavy (700) -> CSS 900
    remapAxis: { design: [520, 700], css: [600, 900] },
  },
  {
    dir: "Ingeo",
    // Ingeo SemiBold (110) -> CSS 600, Ingeo Black (204) -> CSS 900
    remapAxis: { design: [110, 204], css: [600, 900] },
  },
  // The per-script Noto fonts, self-hosted rather than pulled through next/font/google.
  // Served whole they were the single worst thing on the site's critical path: 50-190 KB
  // apiece to draw the handful of glyphs in one card title, fetched only once the browser
  // had laid the text out, so the title visibly flashed in the fallback first. Subset to
  // the characters the site actually uses they are 2-20 KB.
  //
  // Each source is a single VARIABLE font spanning the weights in use (600-900; Bamum
  // and Balinese 600-700, where Google's axis ends), with the wdth axis pinned out. One
  // file has to cover both weights: cards render titles at 600 and entry headers at 900,
  // so as separate statics, clicking a card through to its entry page needed a file the
  // listing page had never loaded, and the entry title flashed on every navigation. See
  // fonts.ts. hb-subset keeps fvar/gvar, so these stay variable through subsetting.
  //
  // The weight-400 whole-font files in each `full/` directory are for entry-page excerpts
  // in the original script and are deliberately NOT subset (see fontsFull.ts); this loop
  // only reads files sitting directly in the family directory, so `full/` and `subset/`
  // are both skipped.
  { dir: "noto/Malayalam" },
  { dir: "noto/Canadian" },
  { dir: "noto/Arabic" },
  { dir: "noto/Tamil" },
  { dir: "noto/Telugu" },
  { dir: "noto/Ethiopic" },
  { dir: "noto/Devanagari" },
  { dir: "noto/Bamum" },
  { dir: "noto/Thai" },
  { dir: "noto/Khmer" },
  { dir: "noto/Balinese" },
];

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

// The 63 table tags WOFF2 encodes as a 6-bit index instead of a 4-byte tag (spec
// §4.1); index 63 means an arbitrary tag follows inline.
const WOFF2_KNOWN_TAGS = [
  "cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca",
  "prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea",
  "vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL",
  "SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar",
  "gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat",
  "Gloc","Feat","Sill",
];

// A zero-length table makes OTS reject the whole font, and the only symptom in the
// browser is a silent fall back to the next family in the stack — no build error, no
// network failure, nothing but a console notice. hb-subset can produce one (it does
// exactly this to `STAT`), so every subset is checked before it is written. WOFF2
// keeps its table directory uncompressed ahead of the Brotli stream, so the lengths
// can be read straight out of the buffer without decoding the font.
function assertNoEmptyTables(woff2: Buffer, label: string): void {
  const numTables = woff2.readUInt16BE(12);
  let p = 48; // end of the WOFF2 header
  const readBase128 = (): number => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = woff2[p++];
      value = ((value << 7) | (byte & 0x7f)) >>> 0;
      if (!(byte & 0x80)) return value;
    }
    throw new Error(`${label}: malformed UIntBase128 in table directory`);
  };

  const empty: string[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = woff2[p++];
    const index = flags & 0x3f;
    const tag = index === 63 ? woff2.toString("ascii", p, (p += 4)) : WOFF2_KNOWN_TAGS[index];
    // glyf/loca inverts the convention: transform version 0 means transformed there,
    // untransformed everywhere else. A transformed table carries a second length.
    const transformVersion = (flags >> 6) & 0x3;
    const origLength = readBase128();
    const transformed =
      tag === "glyf" || tag === "loca" ? transformVersion === 0 : transformVersion !== 0;
    if (transformed) readBase128();
    if (origLength === 0) empty.push(tag);
  }

  if (empty.length) {
    throw new Error(
      `${label}: subset contains zero-length table(s) [${empty.join(", ")}]. ` +
        `Browsers will reject this font outright and fall back silently. ` +
        `Strip the offending table(s) from the source font and re-run.`,
    );
  }
}

// Rewrites the wght axis record in `fvar` to a new min/default/max. Only the labels the
// CSS engine reads change: gvar deltas live in normalised coordinate space, which this
// leaves alone, so the drawings stay put and only the numbers used to address them move.
// Named instances are dropped — their coordinates are in the old units and would now be
// wrong; nothing in the browser's weight matching consults them.
function relabelWghtAxis(font: Buffer, min: number, max: number): Buffer {
  const numTables = font.readUInt16BE(4);
  let fvar = -1;
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    if (font.toString("ascii", o, o + 4) === "fvar") fvar = font.readUInt32BE(o + 8);
  }
  if (fvar < 0) throw new Error("relabelWghtAxis: no fvar table (not a variable font?)");

  const axesOffset = font.readUInt16BE(fvar + 4);
  const axisCount = font.readUInt16BE(fvar + 8);
  const axisSize = font.readUInt16BE(fvar + 10);
  const out = Buffer.from(font);
  for (let i = 0; i < axisCount; i++) {
    const a = fvar + axesOffset + i * axisSize;
    if (font.toString("ascii", a, a + 4) !== "wght") continue;
    out.writeInt32BE(Math.round(min * 65536), a + 4);  // minValue, as Fixed 16.16
    out.writeInt32BE(Math.round(min * 65536), a + 8);  // defaultValue == normalised 0
    out.writeInt32BE(Math.round(max * 65536), a + 12); // maxValue    == normalised 1
    out.writeUInt16BE(0, fvar + 12);                   // instanceCount
    return out;
  }
  throw new Error("relabelWghtAxis: no wght axis");
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
    const familyDir = join(FONTS_DIR, family.dir);
    const outDir = join(familyDir, "subset");
    mkdirSync(outDir, { recursive: true });

    for (const file of readdirSync(familyDir)) {
      if (!file.endsWith(".woff2")) continue;

      jobs.push(
        (async () => {
          const input = readFileSync(join(familyDir, file));
          // Each font keeps only the glyphs it actually has among `text`, so passing
          // the full character set to NotoEmoji yields just the used emoji, etc.
          let output: Buffer;
          if (family.remapAxis) {
            const { design, css } = family.remapAxis;
            const limited = await subsetFont(input, text, {
              targetFormat: "sfnt",
              variationAxes: { wght: { min: design[0], max: design[1], default: design[0] } },
            });
            output = await subsetFont(relabelWghtAxis(limited, css[0], css[1]), text, {
              targetFormat: "woff2",
            });
          } else {
            output = await subsetFont(input, text, { targetFormat: "woff2" });
          }
          assertNoEmptyTables(output, `${family.dir}/${file}`);
          writeFileSync(join(outDir, file), output);
          const pct = ((1 - output.length / input.length) * 100).toFixed(1);
          console.log(
            `  ${family.dir}/subset/${basename(file)}: ` +
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
