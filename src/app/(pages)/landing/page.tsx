import { syncopate } from "@/app/fonts/fonts";
import ColorLink from "@/app/components/colorLink";
import { preParse } from "@/app/functions/text";
import { getReccs } from "@/app/lib/reccs";

const features = [
    {
        title: "Dual-render geoscheme",
        path: "components/map.tsx, components/globe.tsx",
        body: "The world map renders twice from one source of truth: a flat SVG (1440×720, two stacked layers for fill and hover) on desktop, and a Three.js orthographic globe on mobile. The header toggle animates between them and the choice persists across navigation via a ViewProvider context.",
        code: `<Map />\n<HoverMap currSubr={currSubr} setCurrSubr={setCurrSubr} />`,
    },
    {
        title: "Equal-area dot projection",
        path: "lib/globeGeometry.ts",
        body: "Region dots from the SVG are inverse-projected through a hand-tabulated equal-area lookup into spherical coordinates, emitted as a single Float32Array of positions plus a region-index buffer, and rendered in one InstancedMesh draw call.",
        code: `// binary-search the equal-area table\nconst absLat = (lo + frac) * 5;\nreturn Math.sign(target) * absLat;`,
    },
    {
        title: "Theme-reactive WebGL",
        path: "components/globe.tsx",
        body: "Three.js can't read CSS variables, so a MutationObserver watches the document root for theme changes, re-resolves every region color via getComputedStyle, and bumps a version that re-memos the THREE.Color map—toggling light and dark instantly recolors thousands of instanced dots without remounting the canvas.",
        code: `obs.observe(document.documentElement, {\n  attributeFilter: ["data-theme", "class", "style"],\n});`,
    },
    {
        title: "Region-focus tweening",
        path: "components/globe.tsx",
        body: "Selecting a region from any surface—map, globe, or deep link—computes the great-circle delta between current and target azimuthal/polar angles, normalizes across the ±π seam, and eases via smoothstep. Auto-rotate pauses on user interaction and resumes after a 3-second idle.",
        code: `const eased = t * t * (3 - 2 * t); // smoothstep\ncontrols.setAzimuthalAngle(startAz + dAz * eased);`,
    },
    {
        title: "Multi-calendar engine",
        path: "functions/calendars.ts",
        body: "Ten calendar systems are implemented from primary sources—Gregorian, Tonalpohualli, Hijrī, Ọ̀gụ́àfọ̀, 農曆, Kaulana Mahina, বঙ্গাব্দ, Intihuatana, Taswast Tamaziɣt, and Vula Vakaviti. Each is a pure function from Date to native, transliterated, and translated forms.",
        code: `calendars.find(cal => cal.id === calSelection)?.function(date)\n// → { original, transliteration?, translation? }`,
    },
    {
        title: "Inline markup DSL",
        path: "functions/text.ts",
        body: "Excerpts and descriptions are stored as plain strings with a small custom markup vocabulary—smallcaps, hanging-indent verse, abbreviation tooltips, vertical spacers, centered breaks, right-align. preParse() composes these as ordered string transforms.",
        code: `txt = smallCaps(txt);  // <s>...</s>\ntxt = indent(txt);     // <v>...</v>\ntxt = abbrDef(txt);    // <+>term[def]</+>`,
    },
    {
        title: "Citation engine",
        path: "functions/citations.ts",
        body: "Each entry references a UniversalCitation schema. One source of truth renders into APA, MLA, or Chicago at view time, with name order, initials, and conjunction punctuation handled by style—all swappable from a single tab.",
        code: `getCitations(entry.ref, citeFormat)\n// "APA" | "MLA" | "Chicago"`,
    },
    {
        title: "Per-entry routing",
        path: "[mediaID]/page.tsx",
        body: "Every entry carries a 7-character ID like AFNOMTN—first four for the subregion, last three for the collection. That ID is the URL, the poster path, the dot color on the globe, and the filter key on the region shelf.",
        code: `// "AFNOMTN" → AFrica NOrth · Modern Trad. Novel\nreccsData.filter(itm => itm.id.startsWith(currSubr))`,
    },
];

const stack: [string, string][] = [
    ["Next.js 15",         "App Router with RSC by default; client components only where state, WebGL, or observers require them."],
    ["TypeScript",         "Strict end-to-end. Entries, citations, regions, and calendars share narrow discriminated types."],
    ["Tailwind v4",        "Theme tokens declared in @theme inline; CSS variables drive both DOM and Three.js color resolution."],
    ["react-three-fiber",  "Declarative Three.js scene graph for the globe, with instanced meshes for the dot layer."],
    ["Cloudflare",         "Static-leaning deploy. No analytics, no cookies, no third parties."],
];

export default async function LandingPage() {
    const reccs = await getReccs();
    const refCount = reccs.reduce((s, e) => s + (e.ref?.length ?? 0), 0);
    const stats: [string, string][] = [
        ["30",                 "subregions"],
        ["9",                  "collections"],
        [String(reccs.length), "entries"],
        [String(refCount),     "citations"],
        ["10",                 "calendar settings"],
        ["2",                  "render modes"],
    ];
    return (
        <div>
            <div className="border-b-2 border-solid border-[var(--color-front)]">
                <div className="max-w-[1000px] mx-auto px-4 py-6 sm:py-10">
                    {/* <h1 className={`${syncopate.className} font-black text-4xl sm:text-6xl`}>RECCS</h1> */}
                    <p className="mt-0 text-xs uppercase opacity-50 tracking-widest">a geoscheme-based media library</p>
                    <p className="mt-4 max-w-[720px]">{preParse("Reccs is an archive of literary, cinematic, theatrical, and quantitative compositions, organized by a modified UN geoscheme of 30 culturally-affiliated subregions—an attempt to present a way of understanding the world that sits between physical geography and contemporary political borders.")}</p>
                    <p className="mt-4 text-sm">
                        <ColorLink to="/" text="explore the geoscheme" c="r" /> · <ColorLink to="/about" text="about" c="o" /> · <ColorLink to="/literature" text="literature" c="y" /> · <ColorLink to="/cinema" text="cinema" c="g" /> · <ColorLink to="/theatre" text="theatre" c="b" /> · <ColorLink to="/systems" text="systems" c="p" />
                    </p>
                </div>
            </div>

            <div className="border-b-2 border-solid border-[var(--color-front)]">
                <div className="max-w-[1000px] mx-auto px-4 py-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {stats.map(([n, label]) => (
                        <span key={label}><span className="font-extrabold">{n}</span> <span className="opacity-60">{label}</span></span>
                    ))}
                </div>
            </div>

            <div className="border-b-2 border-solid border-[var(--color-front)]">
                <div className="max-w-[1000px] mx-auto px-4 py-6 flex flex-col gap-2">
                    <h2 className="font-bold text-xl">Why</h2>
                    <p>{preParse("A typical media diet—books, films, news—travels along the channels carved by economic and political alliances, and a Western-European or U.S.-aligned perspective tends to fill in for everything else. The geoscheme is a small mechanism for routing around that: 30 subregions chosen to prioritize autochthony (being from a place) and counter-expansionism (limiting the maximum extent of that place) over imperial nation-state boundaries.")}</p>
                    <p>{preParse("Each entry is a single curated work, paired with a description, excerpts or media, sources, and full citations. The selections are limited to works available in English—a real bottleneck, but also what makes the archive accessible to the world's largest speech community.")}</p>
                </div>
            </div>

            <div className="border-b-2 border-solid border-[var(--color-front)]">
                <div className="max-w-[1000px] mx-auto px-4 py-6">
                    <h2 className="font-bold text-xl mb-4">How it&apos;s built</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {features.map(f => (
                            <div key={f.title} className="flex flex-col gap-1">
                                <h3 className="font-bold">{f.title}</h3>
                                <div className="text-xs opacity-50 italic">{f.path}</div>
                                <p className="mt-1 text-sm">{f.body}</p>
                                <pre className="mt-1 text-[0.7rem] leading-relaxed opacity-70 overflow-x-auto whitespace-pre"><code>{f.code}</code></pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-b-2 border-solid border-[var(--color-front)]">
                <div className="max-w-[1000px] mx-auto px-4 py-6">
                    <h2 className="font-bold text-xl mb-2">Stack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {stack.map(([k, v]) => (
                            <p key={k}><span className="font-bold">{k}.</span> <span className="text-sm">{v}</span></p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
