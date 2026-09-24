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
// `instances` pins a variable source's wght axis, emitting one ordinary static font per
// CSS weight. Only 600 and 900 are ever needed for subsets — cards draw titles at
// font-semibold, entry headers at font-black. (Excerpt body text at 400/700 uses the
// unsubset instances in each `full/` directory instead; see FULL_INSTANCES below.)
//
// Pinning rather than shipping the variable face is a compatibility decision, made after
// a variable build rendered entry titles unbolded on iOS. These are subset, axis-limited,
// STAT-stripped fonts — several steps removed from anything a browser vendor tests
// against — and a static instance has no axis left to misapply. The cost of two files is
// that the 900 one is absent when you click a card through to its entry page; that is
// handled by warming both weights on the listing pages instead (see geoscheme.tsx).
//
// The axis values are each foundry's own, which is why they are not all 600/900: MiSans
// Tibetan draws Semibold at 520 and Heavy at 700, Ingeo SemiBold at 110 and Black at 204.
// Mapping CSS 600/900 onto those keeps Tibetan and Tifinagh from rendering heavier than
// the Noto scripts beside them. The Noto sources were already axis-limited to 600-900 on
// download, so for those the CSS weight and the axis value coincide.
//
// Both variable sources here deliberately have NO `STAT` table. hb-subset emits STAT
// as a zero-length table, and OTS (the sanitizer in Chrome/Firefox) rejects the entire
// font over that — silently, with only a console notice, so the page just renders
// in the fallback and everything else looks fine. STAT only carries style-attribute
// metadata for font pickers; browsers vary fonts off `fvar`, which subsets cleanly.
// If either is regenerated from its original .ttf (both ship a valid STAT, and Ingeo
// a DSIG that is meaningless once subset), strip those tables first —
// `assertNoEmptyTables` below fails the build if this regresses.
/** instances: CSS weight -> the wght axis value of the design that weight should use. */
type FontFamily = {
  dir: string;
  instances?: Record<string, number>;
  /** Skip GSUB closure — only for scripts whose glyphs are precomposed in Unicode. */
  noLayoutClosure?: boolean;
};
const FONT_FAMILIES: FontFamily[] = [
  { dir: "JuliaMono" },
  { dir: "NotoEmoji" },
  {
    dir: "MiSansTibetan",
    instances: { "600": 520, "900": 700 },   // Semibold, Heavy
  },
  {
    dir: "Ingeo",
    instances: { "600": 110, "900": 204 },   // SemiBold, Black
  },
  // The per-script Noto fonts, self-hosted rather than pulled through next/font/google.
  // Served whole they were the single worst thing on the site's critical path: 50-190 KB
  // apiece to draw the handful of glyphs in one card title, fetched only once the browser
  // had laid the text out, so the title visibly flashed in the fallback first. Subset to
  // the characters the site actually uses they are 2-20 KB.
  //
  // Each source is Google's variable TTF with the wdth axis pinned out and wght limited
  // to 600-900 (Bamum and Balinese 600-700, where Google's axis ends); `instances` above
  // then pins one static per CSS weight out of it.
  //
  // The 400/700 whole-font files in each `full/` directory are for entry-page excerpts
  // in the original script and are deliberately NOT subset (see fontsFull.ts and
  // FULL_INSTANCES below); this loop
  // only reads files sitting directly in the family directory, so `full/` and `subset/`
  // are both skipped.
  { dir: "noto/Malayalam", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Canadian", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Arabic", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Tamil", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Telugu", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Ethiopic", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Devanagari", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Bamum", instances: { "600": 600, "700": 700 } },   // Google draws nothing heavier
  { dir: "noto/Thai", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Khmer", instances: { "600": 600, "900": 900 } },
  { dir: "noto/Balinese", instances: { "600": 600, "700": 700 } },   // Google draws nothing heavier
  // Korean is the exception in two ways, both forced by Noto Sans KR's size (10 MB, ~11k
  // Hangul syllables):
  //   - Its sources are two already-pinned STATICS rather than a range-limited variable
  //     font. Limiting this font's axis silently discarded all of its gvar data — it has a
  //     non-trivial `avar` mapping that harfbuzz's partial instancing does not carry — so
  //     600 and 900 came out identical. Pinning straight from Google's full VF works.
  //   - `noLayoutClosure`: the GSUB closure over even 11 syllables pulls in 473 glyphs
  //     (jamo composition variants for old Hangul), making a 26 KB file. Modern Hangul is
  //     precomposed in Unicode and never shaped through those lookups; without the closure
  //     it is 107 glyphs / 7 KB and renders pixel-identically. Excerpts use the full font
  //     in `full/`, which keeps everything.
  { dir: "noto/Korean", noLayoutClosure: true },
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

// Whole-font (NOT subset) static instances for original-language excerpts on entry pages;
// see fontsFull.ts. They don't depend on the site's content, so they are generated once,
// committed, and skipped whenever the output already exists — delete a file to rebuild it.
//
// `weights` maps CSS weight -> wght axis value, on each foundry's own scale like
// `instances` above: 400 is the design's Regular, 700 its Bold. The Noto 400s were cut
// from Google's full-range variable fonts before this phase existed and aren't listed; the
// in-repo Noto sources start at 600, but 700 is inside that range. Korean has no 700 here:
// its sources are pinned 600/900 statics (see above), so bold Hangul is synthesized until
// a 700 is cut from Google's full VF. None of these fonts has an italic axis or face, so
// italics are always synthesized.
const FULL_INSTANCES: { dir: string; src: string; weights: Record<string, number> }[] = [
  ...["Malayalam", "Canadian", "Arabic", "Tamil", "Telugu", "Ethiopic", "Devanagari", "Bamum",
    "Thai", "Khmer", "Balinese"].map((s) => ({
    dir: `noto/${s}`, src: `NotoSans${s}.woff2`, weights: { "700": 700 },
  })),
  { dir: "Ingeo", src: "Ingeo.woff2", weights: { "400": 90, "700": 135 } },            // Regular, Bold
  { dir: "MiSansTibetan", src: "MiSansTibetan.woff2", weights: { "400": 330, "700": 630 } }, // Regular, Bold
];

// Every codepoint in Unicode planes 0-2. hb-subset keeps only what the font actually maps
// (plus everything reachable from those through GSUB), so this retains the whole font.
function allCodepoints(): string {
  let s = "";
  for (let cp = 0x20; cp <= 0x2ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue; // lone surrogates aren't characters
    s += String.fromCodePoint(cp);
  }
  return s;
}

async function instanceFullFonts(): Promise<void> {
  const pending = FULL_INSTANCES.flatMap(({ dir, src, weights }) =>
    Object.entries(weights)
      .map(([cssWeight, wght]) => ({
        dir, src, wght,
        name: `${basename(src, ".woff2")}-${cssWeight}.woff2`,
      }))
      .filter(({ dir, name }) => !existsSync(join(FONTS_DIR, dir, "full", name))),
  );
  if (!pending.length) return;

  console.log(`[subset-fonts] cutting ${pending.length} whole-font excerpt instance(s)...`);
  const text = allCodepoints();
  await Promise.all(
    pending.map(async ({ dir, src, wght, name }) => {
      const input = readFileSync(join(FONTS_DIR, dir, src));
      const output = await subsetFont(input, text, { targetFormat: "woff2", variationAxes: { wght } });
      assertNoEmptyTables(output, `${dir}/full/${name}`);
      mkdirSync(join(FONTS_DIR, dir, "full"), { recursive: true });
      writeFileSync(join(FONTS_DIR, dir, "full", name), output);
      console.log(`  ${dir}/full/${name}: ${(output.length / 1024).toFixed(0)} KB`);
    }),
  );
}

async function main() {
  const force = process.argv.includes("--force");
  await instanceFullFonts();
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

      const outputs = family.instances
        ? Object.entries(family.instances).map(([cssWeight, axis]) => ({
            name: `${basename(file, ".woff2")}-${cssWeight}.woff2`,
            variationAxes: { wght: axis },
          }))
        : [{ name: file, variationAxes: undefined }];

      for (const { name, variationAxes } of outputs) {
        jobs.push(
          (async () => {
            const input = readFileSync(join(familyDir, file));
            // Each font keeps only the glyphs it actually has among `text`, so passing
            // the full character set to NotoEmoji yields just the used emoji, etc.
            const output = await subsetFont(input, text, {
              targetFormat: "woff2", variationAxes, noLayoutClosure: family.noLayoutClosure,
            });
            assertNoEmptyTables(output, `${family.dir}/${name}`);
            writeFileSync(join(outDir, name), output);
            const pct = ((1 - output.length / input.length) * 100).toFixed(1);
            console.log(
              `  ${family.dir}/subset/${name}: ` +
                `${(input.length / 1024).toFixed(0)} KB -> ${(output.length / 1024).toFixed(0)} KB (-${pct}%)`,
            );
          })(),
        );
      }
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
