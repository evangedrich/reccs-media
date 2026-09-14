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
// Weight 400 only: excerpts are body text.
export const notoMalayalamFull = localFont({
  src: './noto/Malayalam/full/NotoSansMalayalam-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-malayalam-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoCanadianFull = localFont({
  src: './noto/Canadian/full/NotoSansCanadian-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-canadian-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoArabicFull = localFont({
  src: './noto/Arabic/full/NotoSansArabic-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-arabic-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTamilFull = localFont({
  src: './noto/Tamil/full/NotoSansTamil-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-tamil-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTeluguFull = localFont({
  src: './noto/Telugu/full/NotoSansTelugu-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-telugu-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoEthiopicFull = localFont({
  src: './noto/Ethiopic/full/NotoSansEthiopic-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-ethiopic-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoDevanagariFull = localFont({
  src: './noto/Devanagari/full/NotoSansDevanagari-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-devanagari-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBamumFull = localFont({
  src: './noto/Bamum/full/NotoSansBamum-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-bamum-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoThaiFull = localFont({
  src: './noto/Thai/full/NotoSansThai-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-thai-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoKhmerFull = localFont({
  src: './noto/Khmer/full/NotoSansKhmer-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-khmer-full', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBalineseFull = localFont({
  src: './noto/Balinese/full/NotoSansBalinese-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-balinese-full', display: 'swap', preload: false, adjustFontFallback: false,
});
// Korean is by far the largest (643 KB) — every one of the 11,172 modern Hangul syllables,
// since an excerpt can use any of them. Still click-gated like the rest.
export const notoKoreanFull = localFont({
  src: './noto/Korean/full/NotoSansKorean-400.woff2',
  weight: '400', style: 'normal',
  variable: '--font-noto-korean-full', display: 'swap', preload: false, adjustFontFallback: false,
});

// Apply to the element wrapping excerpt text. Every `--font-noto-*` variable is rebound
// to its whole-font counterpart, so the `.font-<script>` class checkFont() already returns
// resolves to the full face inside this subtree and the subset one everywhere else — no
// change to checkFont, and only the one script actually present on the page downloads.
export const fullScriptFontVars = [
  notoMalayalamFull, notoCanadianFull, notoArabicFull, notoTamilFull, notoTeluguFull,
  notoEthiopicFull, notoDevanagariFull, notoBamumFull, notoThaiFull, notoKhmerFull,
  notoBalineseFull, notoKoreanFull,
].map((f) => f.variable).join(' ');
