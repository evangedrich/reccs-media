export const getTitle = (selection: any, field?: string) => {
    const label = (selection.meta && 'work' in selection.meta && selection.meta.work[field ?? "original"])
        ? `${selection.meta.work[field ?? "original"]}: “${selection.title[field ?? "original"]}”`
        : (selection.meta && 'anthology' in selection.meta && selection.meta.anthology[field ?? "original"])
        ? `“${selection.title[field ?? "original"]}”, ${selection.meta.anthology[field ?? "original"]}`
        : (selection.meta && 'piece' in selection.meta && /^(?!undefined)\p{Script=Latin}/u.test(selection.title[field ?? "original"]))
        ? `“${selection.title[field ?? "original"]}”`
        : selection.title[field ?? "original"];
    return label;
};
export const getByline = (selection: any): string | null => {
  let byline = null;
  if ('author' in selection) { byline = `by ${selection.author}`; }
  if ('intermediary' in selection) { byline = `via ${selection.intermediary}`; }
  if ('author' in selection && 'intermediary' in selection) { byline = `by ${selection.author} via ${selection.intermediary}`; }
  if ('year' in selection && 'runtime' in selection) { byline = `${selection.year} · ${selection.runtime}min` }
  return byline;
};
export const isMongol = (str: string): boolean => {
    return /\p{Script=Mongolian}/u.test(str);
};
// Returns a stable utility class (defined in globals.css) that maps to the matching
// script's CSS variable. Plain strings — no next/font hash — so the result is identical
// on the server and client and is safe to compute anywhere, including Client Components.
export const checkFont = (str: string): string => {
    const fontClass =
        (/\p{Script=Malayalam}/u.test(str)) ? "font-malayalam"
        : (/\p{Script=Tibetan}/u.test(str)) ? "font-tibetan text-[0.9em]"
        : (/\p{Script=Canadian_Aboriginal}/u.test(str)) ? "font-canadian"
        : (/\p{Script=Arabic}/u.test(str)) ? "font-arabic"
        : (/\p{Script=Tamil}/u.test(str)) ? "font-tamil"
        : (/\p{Script=Telugu}/u.test(str)) ? "font-telugu"
        : "";
    return fontClass;
};

const smallCaps = (txt: string): string => {
    const map: Record<string, string> = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
        i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
        q: "ꞯ", r: "ʀ", s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
        y: "ʏ", z: "ᴢ",
    };
    return txt.replace(/<s>([\s\S]*?)<\/s>/g, (_, inner: string) =>
        inner.replace(/[a-z]/gi, (ch) => map[ch.toLowerCase()] ?? ch)
    );
}
// Superseded by addIndents(), which normalizes <v>/<V> into <br> + &emsp; markers. Kept for reference.
// const indent = (txt: string): string => {
//     txt = txt.replace(/<v>([\s\S]*?)<\/v>/g, (_, inner: string) =>
//         `<span style="display:block;padding-left:0.6em;text-indent:-0.6em">${inner}</span>`
//     );
//     txt = txt.replace(/<V>([\s\S]*?)<\/V>/g, (_, inner: string) =>
//         `<span style="display:block;padding-left:2.6em;text-indent:-0.6em">${inner}</span>`
//     );
//     return txt;
// };
const abbrDef = (txt: string): string => {
    return txt.replace(/<\+>([\s\S]*?)<\/\+>/g, (_, inner: string) => {
        const match = inner.match(/^([\s\S]*?)\[([\s\S]*?)\]([\s\S]*)$/);
        if (!match) return `<abbr style="cursor:help">${inner}</abbr>`;
        const [, before, title, after] = match;
        return `<abbr title="${title}" style="cursor:help">${before}${after}</abbr>`;
    });
};
const spacer = (txt: string): string => {
    return txt.replace(/<sp>/g, `<span style="display:block;width:100%;height:0.5rem"></span>`);
};
const threeDots = (txt: string): string => {
    return txt.replace(/<\.\.\.>/g, `<span style="display:block;text-align:center;margin-bottom:0.5rem">·&emsp;·&emsp;·</span>`);
};
const rightAlign = (txt: string): string => {
    if (!txt.startsWith(">>")) return txt;
    return `<span style="display:block;text-align:right">${txt.slice(2).trimStart()}</span>`;
};
const doubleDash = (txt: string): string => {
    return txt.replace(/—/g, "—⁠—");
};
const strip = (txt: string): string => {
    txt = txt.replace(/<\/?s>/g, "");                                                // (1) remove <s> and </s>, leaving the inner text untouched
    txt = txt.replace(/<\/[vV]>/g, "<br>").replace(/<[vV]>/g, "");                   // (2) drop the opening <v>/<V> and turn the closing tag into a <br>
    txt = txt.replace(/<sp>/g, "");                                                  // (3) remove <sp> spacer tag
    txt = txt.replace(/<\+>([\s\S]*?)\[([\s\S]*?)\]([\s\S]*?)<\/\+>/g, "$1$3 [$2]"); // (4) strip <+>...</+> and put a space before the [bracketed] expansion
    txt = txt.replace(/<\.\.\.>/g, "***");                                           // (5) replace <...> with three stars
    txt = txt.replace(/>>/g, "");                                                    // (6) remove >> double-arrow markers
    return txt;
};
const addIndents = (txt: string): string => {
    /*
    Split the text on <br> into separate lines and wrap each in an indented block span.
    padding-left starts at `base` (0.6em) and grows by 1em for every leading &emsp;, each of which is consumed.

    <v>/<V> tags are normalized into the same <br> + &emsp; markers first, so this fully replaces indent():
      - <v>X</v> becomes its own line at the base indent (equivalent to 0 &emsp;)
      - <V>X</V> becomes its own line indented two levels deeper (equivalent to 2 &emsp;)
    Both are wrapped in <br>…<br> so they're treated as newly separated strings regardless of the surrounding markup;
    the empty segments this creates (e.g. from an already-present preceding <br>) are dropped below.
    */
    txt = txt
        .replace(/<V>([\s\S]*?)<\/V>/g, "<br>&emsp;&emsp;$1<br>")             // <V>: own line, two indent levels deeper
        .replace(/<v>([\s\S]*?)<\/v>/g, "<br>$1<br>");                        // <v>: own line at the base indent
    if (!txt.includes("<br>")) return txt;
    return txt
        .split("<br>")
        .map((segment) => {
            if (segment === "") return "";                                    // drop the empties the <br> normalization creates
            const base = 0.6;
            let padding = base;                                               // base indent, in em
            let inner = segment;
            while (inner.startsWith("&emsp;")) {                              // each leading &emsp; adds 1em and is consumed
                padding += 0.9;
                inner = inner.slice("&emsp;".length);
            }
            return `<span style="display:block;padding-left:${padding}em;text-indent:-${base}em">${inner}</span>`;
        })
        .join("");
};
export const preParse = (txt: string): string => {
    // txt = strip(txt);      // remove all potentially problematic html characters
    txt = addIndents(txt); // add <v> and <V> tags in line break strings
    txt = smallCaps(txt);  // <s> smallcaps
    txt = abbrDef(txt);    // <+> abbr defs
    txt = spacer(txt);     // <sp> spacer
    txt = threeDots(txt);  // <...> 3dot break
    txt = rightAlign(txt); // >> right align
    txt = doubleDash(txt); // — double emdash
    return txt;
};