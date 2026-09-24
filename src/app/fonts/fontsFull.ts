import localFont from 'next/font/local';

// Whole-font (unsubset) counterparts to the per-script fonts in fonts.ts, for rendering
// an entry's excerpt in its original writing system.
//
// These live in their own module ON PURPOSE. next/font scopes a font's CSS to the routes
// that import it, so keeping them out of fonts.ts — which layout.tsx imports — means their
// @font-face rules never ship on the home, collections, search or region pages. Import
// this only from [mediaID]/page.tsx.
//
// Why unsubset, when everything else here is aggressively subset: a subset is built from
// the characters present in the source at deploy time, so any character added afterwards
// falls back. That risk is tolerable for a title (a handful of glyphs, and the whole set
// is regenerated every deploy) but not for long-form excerpts in a syllabary — Ethiopic
// alone draws 358 codepoints and one excerpt already pulls in 95 of them. The full file
// can render anything, so excerpt text can never tofu.
//
// The size that buys is affordable precisely because of where it lands: the excerpt sits
// behind a tab in mediaContent.tsx and is conditionally rendered, so the browser does not
// request any of this until someone clicks through. Nothing above the fold waits on it —
// the entry page's own <h1> keeps using the subset from fonts.ts.
//
// Weights 400 and 700: excerpts are body text, with real bold for <b>. Each weight is its
// own file and downloads only if text at that weight actually renders, so an excerpt with
// no bold never fetches the 700. None of these fonts has an italic, so <i> is always a
// browser-synthesized slant (as is bold Hangul — see Korean below). The 700s, and both
// Tifinagh/Tibetan weights, are cut by scripts/subset-fonts.ts (FULL_INSTANCES).
export const notoMalayalamFull = localFont({
  src: [
    { path: './noto/Malayalam/full/NotoSansMalayalam-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Malayalam/full/NotoSansMalayalam-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-malayalam-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoCanadianFull = localFont({
  src: [
    { path: './noto/Canadian/full/NotoSansCanadian-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Canadian/full/NotoSansCanadian-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-canadian-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoArabicFull = localFont({
  src: [
    { path: './noto/Arabic/full/NotoSansArabic-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Arabic/full/NotoSansArabic-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-arabic-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTamilFull = localFont({
  src: [
    { path: './noto/Tamil/full/NotoSansTamil-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Tamil/full/NotoSansTamil-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-tamil-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTeluguFull = localFont({
  src: [
    { path: './noto/Telugu/full/NotoSansTelugu-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Telugu/full/NotoSansTelugu-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-telugu-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoEthiopicFull = localFont({
  src: [
    { path: './noto/Ethiopic/full/NotoSansEthiopic-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Ethiopic/full/NotoSansEthiopic-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-ethiopic-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoDevanagariFull = localFont({
  src: [
    { path: './noto/Devanagari/full/NotoSansDevanagari-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Devanagari/full/NotoSansDevanagari-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-devanagari-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBamumFull = localFont({
  src: [
    { path: './noto/Bamum/full/NotoSansBamum-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Bamum/full/NotoSansBamum-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-bamum-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoThaiFull = localFont({
  src: [
    { path: './noto/Thai/full/NotoSansThai-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Thai/full/NotoSansThai-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-thai-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoKhmerFull = localFont({
  src: [
    { path: './noto/Khmer/full/NotoSansKhmer-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Khmer/full/NotoSansKhmer-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-khmer-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBalineseFull = localFont({
  src: [
    { path: './noto/Balinese/full/NotoSansBalinese-400.woff2', weight: '400', style: 'normal' },
    { path: './noto/Balinese/full/NotoSansBalinese-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-balinese-full', display: 'swap', preload: false, adjustFontFallback: false,
});
// Korean is by far the largest (643 KB) — every one of the 11,172 modern Hangul syllables,
// since an excerpt can use any of them. Still click-gated like the rest. No 700 yet: the
// in-repo Korean sources are pinned 600/900 statics, so bold Hangul is synthesized until
// a 700 is cut from Google's full variable font.
export const notoKoreanFull = localFont({
  src: './noto/Korean/full/NotoSansKorean-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-korean-full', display: 'swap', preload: false, adjustFontFallback: false,
});
// Tifinagh and Tibetan aren't Noto, but take the same treatment. Their axes are on each
// foundry's own scale, so 400/700 are the designs' Regular/Bold (Ingeo 90/135, MiSans
// Tibetan 330/630) — without a 400 here, excerpt text would match the 600 title subset.
export const ingeoTifinaghFull = localFont({
  src: [
    { path: './Ingeo/full/Ingeo-400.woff2', weight: '400', style: 'normal' },
    { path: './Ingeo/full/Ingeo-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-ingeo-tifinagh-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const miSansTibetanFull = localFont({
  src: [
    { path: './MiSansTibetan/full/MiSansTibetan-400.woff2', weight: '400', style: 'normal' },
    { path: './MiSansTibetan/full/MiSansTibetan-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-misans-tibetan-full', display: 'swap', preload: false, adjustFontFallback: false,
});

// Apply to the element wrapping excerpt text. Every script-font variable is rebound
// to its whole-font counterpart, so the `.font-<script>` class checkFont() already returns
// resolves to the full face inside this subtree and the subset one everywhere else — no
// change to checkFont, and only the one script actually present on the page downloads.
export const fullScriptFontVars = [
  notoMalayalamFull, notoCanadianFull, notoArabicFull, notoTamilFull, notoTeluguFull,
  notoEthiopicFull, notoDevanagariFull, notoBamumFull, notoThaiFull, notoKhmerFull,
  notoBalineseFull, notoKoreanFull, ingeoTifinaghFull, miSansTibetanFull,
].map((f) => f.variable).join(' ');
