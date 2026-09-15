'use client';

import { useState, useEffect } from "react";
import styles from "@/app/ui/main.module.css";
import MarkdownCitation from "./markdownCitation";
import Share from "./share"
import { getCitations } from "../functions/citations";
import { getTitle, checkFont } from "../functions/text";
import { PrepVideo, PrepWatch } from "../functions/video";
import { parseWithAbbr } from "../functions/abbr";

const allTabs: { id: string, keys: string[] }[] = [
    { id: "info", keys: ["info"] },
    { id: "excerpt", keys: ["excerpt"] },
    { id: "trailer", keys: ["trailer"] },
    { id: "media", keys: ["mediaURL"] },
    { id: "watch", keys: ["watch"] },
    { id: "playlist", keys: ["playlistURL"] },
    { id: "sources", keys: ["ref", /*"infoURL", "bioURL", "mediaURL", "textURL"*/] },
];
const citationFormats: string[] = [ "APA", "MLA", "Chicago" ];
// Excerpt language switch labels that differ from group.language (which is used as-is otherwise).
const excerptLangLabels: Record<string, string> = {
    "Classical Chinese": "Chinese",
    "Mandarin Chinese": "Mandarin",
    "Classical Nahuatl": "Nahuatl",
    "Classical Quechua": "Quechua",
};

// The small all-caps option row atop a tab (citation formats, excerpt language). Shared so
// every such switch looks identical.
function FormatSwitch({ options, labels, value, onChange }: { options: string[], labels?: string[], value: string, onChange: (o: string) => void }) {
    return (
        <ul className="flex gap-4 text-xs uppercase mb-3">
            {options.map((o,i) => <li key={`opt${i}`} onClick={() => onChange(o)} className={`hover:opacity-80 ${o===value?"font-extrabold hover:opacity-100":""} cursor-pointer`}>{labels?.[i] ?? o}</li>)}
        </ul>
    );
}

export default function MediaContent({ entry }: { entry: any }) {
    const [currentTab, setCurrentTab] = useState("info");
    const [citeFormat, setCiteFormat] = useState(citationFormats[0]);
    // Excerpt language: always opens on the English translation.
    const [excerptLang, setExcerptLang] = useState<"english" | "orig">("english");
    const [warmOrig, setWarmOrig] = useState(false);
    const hasOrig = Array.isArray(entry.excerptOrig) && !!entry.excerptOrig[0];
    // Same script detection as the entry title; inside `excerpt-scope` the class resolves
    // to the whole (unsubset) font rather than the title subset — see fonts/fontsFull.ts.
    // "" means Latin script, which the already-loaded body font draws: nothing to warm.
    const origFont = hasOrig ? checkFont(entry.excerptOrig.join(" ")) : "";
    const origBold = hasOrig && /<(b|strong)>/.test(entry.excerptOrig.join(" "));

    // Warm the original-script font so switching languages doesn't flash the fallback, without
    // competing with the page load: after `load`, once the browser is idle, render an invisible
    // sample (the div at the bottom) so the font downloads in the background — same technique
    // as fontWarmer.tsx. Opening the excerpt tab starts it too, if idle hasn't come yet.
    useEffect(() => {
        if (!origFont) return;
        let idle: number | undefined;
        const hasRic = "requestIdleCallback" in window;
        const schedule = () => {
            idle = hasRic ? window.requestIdleCallback(() => setWarmOrig(true), { timeout: 3000 }) : window.setTimeout(() => setWarmOrig(true), 1200);
        };
        if (document.readyState === "complete") schedule();
        else window.addEventListener("load", schedule, { once: true });
        return () => {
            window.removeEventListener("load", schedule);
            if (idle !== undefined) { if (hasRic) window.cancelIdleCallback(idle); else window.clearTimeout(idle); }
        };
    }, [origFont]);
    const [abbrOpen, setAbbrOpen] = useState(false);
    const [currAbbr, setCurrAbbr] = useState(['',''])
    const tabs: string[] = allTabs.map(cat => cat.id).filter((cat,i) => (
        allTabs[i].keys.some(
            key => Object.keys(entry).includes(key) && entry[key]!=="" && entry[key][0]!=="" && entry[key][0]
        )
    ));
    const getContent = () => {
        let content;
        // `dir="auto"` only for original-language text, so a right-to-left script lays out correctly
        const paragraphs = (text: string[], dir?: "auto") => text.map((x: string, i: number) => <p key={`p${i}`} dir={dir}>{parseWithAbbr(x, (title, content) => { setCurrAbbr([content, title]); setAbbrOpen((abbrOpen && currAbbr[1]===title) ? false : true); })}</p>);
        if (currentTab==="excerpt" && hasOrig) {
            const showOrig = excerptLang==="orig";
            content = <>
                <FormatSwitch options={["english", "orig"]} labels={["english", excerptLangLabels[entry.group.language] ?? entry.group.language]} value={excerptLang} onChange={(o) => setExcerptLang(o as "english" | "orig")} />
                {showOrig
                    ? <div className={`excerpt-scope ${origFont}`}>{paragraphs(entry.excerptOrig, "auto")}</div>
                    : (entry.excerpt[0].includes("youtu.be")) ? <PrepVideo vid={entry.excerpt} /> : paragraphs(entry.excerpt)}
            </>;
        } else if (currentTab==="info" || currentTab==="excerpt") {
            const text = entry[currentTab];
            content = (entry[currentTab][0].includes("youtu.be")) ? <PrepVideo vid={text} /> : <>{paragraphs(text)}</>;
        } else if (currentTab==="media" || currentTab==="trailer") {
            content = <PrepVideo vid={entry[currentTab==="media"?"mediaURL":"trailer"]} />;
        } else if (currentTab==="watch") {
            content = <PrepWatch watch={entry["watch"]} />;
        } else if (currentTab==="playlist") {
            content = <div className="border-2 bg-[var(--color-mid)] rounded-4xl overflow-hidden"><iframe src={"https://open.spotify.com/embed/playlist/"+entry.playlistURL.substring(34)+"?utm_source=generator&theme=0"} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>;
        } else if (currentTab==="sources") {
            if (Object.keys(entry).includes("ref")) {
                content = <div className={styles.citationContainer}>
                    <FormatSwitch options={citationFormats} value={citeFormat} onChange={setCiteFormat} />
                    {getCitations(entry.ref,citeFormat).map((src,i) => <MarkdownCitation key={`cit${i}`} markdownContent={src.citation} url={src.url}></MarkdownCitation>)}
                </div>; 
            }
        }
        return content;
    };
    return (
        <>
            <div className="h-[34px] border-b-2 border-solid border-[var(--color-front)] pl-3 pr-2 sticky top-[calc(var(--header-h)+34px)] bg-[var(--color-back)] flex items-center justify-between transition-[top]">
                <ul className="flex gap-3 overflow-x-scroll no-scrollbar">
                    {tabs.map(tab => (
                        <li 
                            key={`${tab}_button`} 
                            className={`cursor-pointer px-1 hover:bg-[var(--color-front)] hover:text-[var(--color-back)] active:opacity-85 ${currentTab===tab ? "font-bold italic": ""}`} 
                            onClick={() => setCurrentTab(tab)}
                        >
                            {tab}
                        </li>
                    ))}
                </ul>
                <Share title={getTitle(entry)} />
            </div>
            <div className={`${styles.mediaContent} p-4 max-w-[800px]`} onScroll={() => setAbbrOpen(false)}>
                {getContent()}
            </div>
            <div className={`sm:hidden fixed -bottom-10 left-0 w-full bg-[var(--color-back)] border-t-2 z-30 ${abbrOpen?"max-h-[50vh]":"max-h-0"} transform translate-y-1 transition-[max-height] duration-400 overflow-y-auto overscroll-y-none z-10`} onMouseLeave={() => setAbbrOpen(false)}>
                <div className="sticky left-0 top-0 w-full flex justify-end text-xs p-3 pb-1 flex items-center bg-[var(--color-back)] active:opacity-60" onClick={() => setAbbrOpen(false)}>CLOSE Ｘ</div>
                <div className="p-6 pt-0 pb-30">
                    <h3 className="italic pb-2">{currAbbr[0]}:</h3>
                    <p>{currAbbr[1]}</p>
                </div>
            </div>
            <div className={`max-sm:hidden ${abbrOpen ? "" : "hidden"} fixed bottom-0 right-0 text-[12px] z-20`}>
                <div className="m-4 max-w-90 bg-[var(--color-back)] border-2 border-[var(--color-front)]">
                    <div className="flex justify-between border-b-2">
                        <h3 className="py-1 px-2 italic">{currAbbr[0]}</h3>
                        <div className="p-1 cursor-pointer border-l-2 w-7 text-center hover:bg-[var(--color-mid)]" onClick={() => setAbbrOpen(false)}>Ｘ</div>
                    </div>
                    <p className="px-2 pt-1 pb-3 min-w-30">{currAbbr[1]}</p>
                </div>
            </div>
            {/* Original-script font warmer (see the effect above). Must be laid-out text —
                `display: none` fetches nothing. Bold is warmed only if the excerpt uses it. */}
            {origFont && (warmOrig || currentTab==="excerpt") && (
                <div aria-hidden="true" className={`pointer-events-none fixed w-0 h-0 overflow-hidden opacity-0 excerpt-scope ${origFont}`}>
                    <span>{entry.excerptOrig[0].replace(/<[^>]+>/g, "").slice(0, 60)}</span>
                    {origBold && <span className="font-bold">{entry.excerptOrig[0].replace(/<[^>]+>/g, "").slice(0, 60)}</span>}
                </div>
            )}
        </>
    )
}