import { Syncopate } from 'next/font/google';
import localFont from 'next/font/local';

// Anything declared here with `preload` on is preloaded on EVERY page, whether or not
// that page renders it: this module is imported by layout.tsx, so Next emits a React
// Flight `:HL[...]` font hint per face into the RSC payload. Declaring a font nothing
// uses therefore costs a download on every route — Noto_Sans sat here unused and did
// exactly that. Keep this list to fonts that are actually applied somewhere.
export const syncopate = Syncopate({ weight: ['400','700'], subsets: ['latin'] });
// Conditional script fonts. Exposed as CSS variables (not `.className`) and applied
// once on <html> in layout.tsx, so the @font-face + variable are defined a single time
// in the server-rendered layout. checkFont() then returns stable utility classes
// (globals.css) that read these variables — no next/font hash ever crosses the
// server/client boundary, which is what caused the SSR class to ship without CSS.
// `preload: false`: these are per-entry scripts, so the woff2 downloads only when a
// matching glyph is actually rendered rather than preloading all of them on every page.
//
// Self-hosted and glyph-subset by scripts/subset-fonts.ts rather than fetched through
// next/font/google. Whole, these were 50-190 KB apiece — and because `preload: false`
// means the browser only discovers them once it has laid the title out, that download
// started after first paint and the title visibly flashed in the fallback first.
// Subset to the characters the site actually uses they are 17-57 KB and land in time.
//
// Each is ONE VARIABLE file spanning the weights in use rather than a static per weight,
// and that is the point: `.font-<script>` resolves to 600 on cards and 900 on entry
// headers, so as two statics, clicking a card through to its entry page needed a file the
// listing page had never loaded. Client-side navigation paints the new title immediately
// from cached RSC and only then requests it, so the entry title flashed every single
// time — a ~16 ms fetch, but one that starts after the paint, and unmissable at text-6xl.
// One file covering both weights is already in cache by then, so there is no second
// request and nothing to flash. It costs roughly double per listing page (Ethiopic 19 ->
// 52 KB) which is the deliberate trade: the axis is clamped to the used range and the
// wdth axis pinned out to keep the gvar deltas down.
//
// Bamum and Balinese stop at 700 — Google's axis goes no further, so CSS 900 clamps to
// 700 exactly as it did when these came from next/font/google.
//
// (The options are repeated in full on each call rather than spread from a shared
// object: next/font requires every option to be a statically-analysable literal.)
export const notoMalayalam = localFont({
  src: './noto/Malayalam/subset/NotoSansMalayalam.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-malayalam', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoCanadian = localFont({
  src: './noto/Canadian/subset/NotoSansCanadian.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-canadian', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoArabic = localFont({
  src: './noto/Arabic/subset/NotoSansArabic.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-arabic', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTamil = localFont({
  src: './noto/Tamil/subset/NotoSansTamil.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-tamil', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoTelugu = localFont({
  src: './noto/Telugu/subset/NotoSansTelugu.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-telugu', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoEthiopic = localFont({
  src: './noto/Ethiopic/subset/NotoSansEthiopic.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-ethiopic', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoDevanagari = localFont({
  src: './noto/Devanagari/subset/NotoSansDevanagari.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-devanagari', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBamum = localFont({
  src: './noto/Bamum/subset/NotoSansBamum.woff2',
  weight: '600 700', style: 'normal',
  variable: '--font-noto-bamum', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoThai = localFont({
  src: './noto/Thai/subset/NotoSansThai.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-thai', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoKhmer = localFont({
  src: './noto/Khmer/subset/NotoSansKhmer.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-noto-khmer', display: 'swap', preload: false, adjustFontFallback: false,
});
export const notoBalinese = localFont({
  src: './noto/Balinese/subset/NotoSansBalinese.woff2',
  weight: '600 700', style: 'normal',
  variable: '--font-noto-balinese', display: 'swap', preload: false, adjustFontFallback: false,
});

// Tibetan: MiSans Tibetan, whose wght axis runs on the foundry's own scale (Semibold
// 520, Bold 630, Heavy 700) rather than the CSS one — so shipped as-is, CSS 600 selected
// axis 600, all but MiSans Bold, and Tibetan looked heavier than the Noto scripts sharing
// a line with it. scripts/subset-fonts.ts rebuilds the axis so 600-900 addresses
// Semibold-Heavy directly (`remapAxis`), which keeps `font-semibold` on Semibold and
// `font-black` on Heavy while leaving it a SINGLE file for both — the pinned-per-weight
// build that preceded this rendered identically but split into two files, which made the
// entry-page title flash on every click-through from a card. 148 KB, the largest of the
// script fonts: its glyph set is mostly precomposed consonant stacks reached through
// GSUB, which subsets poorly. `adjustFontFallback: false` keeps the variable a single
// family name so globals.css composes the fallback chain.
export const miSansTibetan = localFont({
  src: './MiSansTibetan/subset/MiSansTibetan.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-misans-tibetan', display: 'swap', preload: false, adjustFontFallback: false,
});

// Tifinagh (Amazigh): Ingeo-T, on a scale of its own too — its wght axis runs 22-204
// with SemiBold at 110 and Black at 204, so untouched, every CSS weight from 204 up would
// clamp to Black. Axis-remapped to 600-900 by scripts/subset-fonts.ts the same way MiSans
// Tibetan is. The family is small (59 Tifinagh glyphs plus Latin), so it subsets to 8 KB.
export const ingeoTifinagh = localFont({
  src: './Ingeo/subset/Ingeo.woff2',
  weight: '600 900', style: 'normal',
  variable: '--font-ingeo-tifinagh', display: 'swap', preload: false, adjustFontFallback: false,
});

// Body font: tiny per-weight subset (generated by scripts/subset-fonts.ts, run on
// deploy) containing only the glyphs the site uses (~94% smaller). Preloaded so it
// lands before paint, killing the FOUT. `adjustFontFallback: false` keeps
// `.style.fontFamily` a single clean family name so layout.tsx can compose the
// fallback chain explicitly (subset -> monospace -> sans-serif).
//
// There is deliberately NO full-font fallback layer: a local @font-face carries no
// unicode-range, so any full JuliaMono listed in the stack gets fully downloaded
// (~1 MB/weight) the moment a glyph outside the subset appears — even glyphs JuliaMono
// itself lacks (ﷺ, ＋, CJK), which then fall to the OS anyway. The subset is
// regenerated from all source text every deploy, so it always covers what JuliaMono
// can render; the rare between-deploy addition falls to system monospace, never tofu.
//
// Only the faces the site actually renders are listed. `preload` is all-or-nothing per
// localFont() call, so every face here is preloaded on every route — listing all 14
// meant ~940 KB of preload hints competing for bandwidth with the per-script title font
// the visible text was actually waiting on. A sweep of the rendered tree across every
// page type found these nine in use (200 matches the 300 face, 500 is used nowhere);
// the six dropped faces were pure preload cost. Italic is matched on style before
// weight, so italic text at a dropped weight lands on the nearest remaining italic
// rather than being synthesised.
export const juliaMonoSubset = localFont({
  src: [
    { path: './JuliaMono/subset/JuliaMono-Light.woff2',         weight: '300', style: 'normal' },
    { path: './JuliaMono/subset/JuliaMono-Regular.woff2',       weight: '400', style: 'normal' },
    { path: './JuliaMono/subset/JuliaMono-RegularItalic.woff2', weight: '400', style: 'italic' },
    { path: './JuliaMono/subset/JuliaMono-SemiBold.woff2',      weight: '600', style: 'normal' },
    { path: './JuliaMono/subset/JuliaMono-Bold.woff2',          weight: '700', style: 'normal' },
    { path: './JuliaMono/subset/JuliaMono-BoldItalic.woff2',    weight: '700', style: 'italic' },
    { path: './JuliaMono/subset/JuliaMono-ExtraBold.woff2',     weight: '800', style: 'normal' },
    { path: './JuliaMono/subset/JuliaMono-Black.woff2',         weight: '900', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: false,
});

// Emoji icon font, applied via className. The icon set is hardcoded UI (not content),
// so its subset can never go stale — no full fallback layer needed here.
export const notoEmoji = localFont({
  src: [
    { path: './NotoEmoji/subset/noto-emoji-v62-emoji-300.woff2',     weight: '300', style: 'normal' },
    { path: './NotoEmoji/subset/noto-emoji-v62-emoji-regular.woff2', weight: '400', style: 'normal' },
    { path: './NotoEmoji/subset/noto-emoji-v62-emoji-500.woff2',     weight: '500', style: 'normal' },
    { path: './NotoEmoji/subset/noto-emoji-v62-emoji-600.woff2',     weight: '600', style: 'normal' },
    { path: './NotoEmoji/subset/noto-emoji-v62-emoji-700.woff2',     weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-emoji',
  display: 'swap',
});