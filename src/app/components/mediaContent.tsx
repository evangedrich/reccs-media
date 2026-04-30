'use client';

import { useState } from "react";
import styles from "@/app/ui/main.module.css";
import MarkdownCitation from "./markdownCitation";
import Share from "./share"
import { getCitations } from "../functions/citations";
import { getTitle } from "../functions/text";
import { PrepVideo, PrepWatch } from "../functions/video";
import { parseWithAbbr } from "../functions/abbr";

const allTabs: { id: string, keys: string[] }[] = [
    { id: "info", keys: ["info"] },
    { id: "excerpt", keys: ["excerpt"] },
    { id: "media", keys: ["mediaURL"] },
    { id: "trailer", keys: ["trailer"] },
    { id: "watch", keys: ["watch"] },
    { id: "playlist", keys: ["playlistURL"] },
    { id: "sources", keys: ["ref", /*"infoURL", "bioURL", "mediaURL", "textURL"*/] },
];
const citationFormats: string[] = [ "APA", "MLA", "Chicago" ];

export default function MediaContent({ entry }: { entry: any }) {
    const [currentTab, setCurrentTab] = useState("info");
    const [citeFormat, setCiteFormat] = useState(citationFormats[0]);
    const [abbrOpen, setAbbrOpen] = useState(false);
    const [currAbbr, setCurrAbbr] = useState(['',''])
    const tabs: string[] = allTabs.map(cat => cat.id).filter((cat,i) => (
        allTabs[i].keys.some(
            key => Object.keys(entry).includes(key) && entry[key]!=="" && entry[key][0]!==""
        )
    ));
    const getContent = () => {
        let content;
        if (currentTab==="info" || currentTab==="excerpt") {
            const text = entry[currentTab];
            content = (entry[currentTab][0].includes("youtu.be")) ? <PrepVideo vid={text} /> : <>{text.map((x,i) => <p key={`p${i}`}>{parseWithAbbr(x, (title, content) => { setCurrAbbr([content, title]); setAbbrOpen(true); })}</p>)}</>;
        } else if (currentTab==="media" || currentTab==="trailer") {
            content = <PrepVideo vid={entry[currentTab==="media"?"mediaURL":"trailer"]} />;
        } else if (currentTab==="watch") {
            content = <PrepWatch watch={entry["watch"]} />;
        } else if (currentTab==="playlist") {
            content = <div className="border-2 bg-[var(--color-mid)] rounded-4xl overflow-hidden"><iframe src={"https://open.spotify.com/embed/playlist/"+entry.playlistURL.substring(34)+"?utm_source=generator&theme=0"} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>;
        } else if (currentTab==="sources") {
            if (Object.keys(entry).includes("ref")) { content = <div className={styles.citationContainer}><ul className="flex gap-4 text-xs uppercase mb-3">{citationFormats.map((c,i) => <li key={`cite${i}`} onClick={() => setCiteFormat(c)} className={`hover:opacity-80 ${c===citeFormat?"font-extrabold hover:opacity-100":""} cursor-pointer`}>{c}</li>)}</ul>{getCitations(entry.ref,citeFormat).map((src,i) => <MarkdownCitation key={`cit${i}`} markdownContent={src.citation} url={src.url}></MarkdownCitation>)}</div>; }
        }
        return content;
    };
    return (
        <>
            <div className="h-[34px] border-b-2 border-solid border-[var(--color-front)] pl-3 pr-2 sticky top-[calc(var(--header-h)+var(--title-bar-h))] bg-[var(--color-back)] flex items-center justify-between">
                <ul className="flex gap-3 overflow-x-scroll">
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
            <div className={`sm:hidden fixed -bottom-10 left-0 w-full bg-[var(--color-back)] border-t-2 ${abbrOpen?"max-h-[50vh]":"max-h-0"} transform translate-y-1 transition-[max-height] duration-400 overflow-y-auto overscroll-y-none z-10`} onMouseLeave={() => setAbbrOpen(false)}>
                <div className="absolute right-0 top-0 text-right text-xs p-3 flex items-center" onClick={() => setAbbrOpen(false)}>CLOSE Ｘ</div>
                <div className="p-6 pb-26">
                    <h3 className="italic pb-2">{currAbbr[0]}:</h3>
                    <p>{currAbbr[1]}</p>
                </div>
            </div>
        </>
    )
}