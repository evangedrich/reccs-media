
export const getTitle = (selection: any, field?: string) => {
    const label = ('work' in selection && selection.work[field ?? "original"])
        ? `${selection.work[field ?? "original"]}: “${selection.title[field ?? "original"]}”`
        : ('anthology' in selection && selection.anthology[field ?? "original"])
        ? `“${selection.title[field ?? "original"]}”, ${selection.anthology[field ?? "original"]}`
        : ('piece' in selection && /^(?!undefined)\p{Script=Latin}/u.test(selection.title[field ?? "original"]))
        ? `“${selection.title[field ?? "original"]}”`
        : selection.title[field ?? "original"];
    return label;
};
export const getByline = (selection: any): string | null => {
  let byline = null;
  if ('author' in selection) { byline = `by ${selection.author}`; }
  if ('intermediary' in selection) { byline = `via ${selection.intermediary}`; }
  if ('author' in selection && 'intermediary' in selection) { byline = `by ${selection.author} via ${selection.intermediary}`; }
  return byline;
};
export const isMongol = (str: string): boolean => {
    return /\p{Script=Mongolian}/u.test(str);
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
const indent = (txt: string): string => {
    txt = txt.replace(/<v>([\s\S]*?)<\/v>/g, (_, inner: string) =>
        `<span style="display:inline-block;padding-left:1em;text-indent:-1em">${inner}</span>`
    );
    txt = txt.replace(/<V>([\s\S]*?)<\/V>/g, (_, inner: string) =>
        `<span style="display:inline-block;padding-left:3em;text-indent:-1em">${inner}</span>`
    );
    return txt;
};
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
export const preParse = (txt: string): string => {
    // txt = strip(txt);      // remove all potentially problematic html characters
    txt = smallCaps(txt);  // <s> smallcaps
    txt = indent(txt);     // <v> & <V> indent
    txt = abbrDef(txt);    // <+> abbr defs
    txt = spacer(txt);     // <sp> spacer
    txt = threeDots(txt);  // <...> 3dot break
    txt = rightAlign(txt); // >> right align
    txt = doubleDash(txt); // — double emdash
    return txt;
};