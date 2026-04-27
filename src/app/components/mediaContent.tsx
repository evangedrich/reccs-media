'use client';

import { useState } from "react";
import styles from "@/app/ui/main.module.css";
import Markdown from "react-markdown";
import Share from "./share"
import { getCitations } from "../functions/citations";
import { getTitle } from "../functions/text";
import parse from 'html-react-parser';
import { preParse } from "../functions/text";
import { PrepVideo } from "../functions/video";

const allTabs: { id: string, keys: string[] }[] = [
    { id: "info", keys: ["info"] },
    { id: "excerpt", keys: ["excerpt"] },
    { id: "media", keys: ["mediaURL"] },
    { id: "trailer", keys: ["trailer"] },
    { id: "watch", keys: ["watch"] },
    { id: "playlist", keys: ["playlistURL"] },
    { id: "sources", keys: ["ref", "infoURL", "bioURL", "mediaURL", "textURL"] },
];
const citationFormats: string[] = [ "APA", "MLA", "Chicago" ];

export default function MediaContent({ entry }: { entry: any }) {
    const [currentTab, setCurrentTab] = useState("info");
    const [citeFormat, setCiteFormat] = useState(citationFormats[0])
    const tabs: string[] = allTabs.map(cat => cat.id).filter((cat,i) => (
        allTabs[i].keys.some(
            key => Object.keys(entry).includes(key) && entry[key][0]!==""
        )
    ));
    const getContent = () => {
        let content;
        if (currentTab==="info" || currentTab==="excerpt") {
            const text = entry[currentTab];
            content = Array.isArray(text) ? <>{text.map((x,i) => <p key={`p${i}`}>{parse(preParse(x))}</p>)}</> : <p>{parse(text)}</p>;
        } else if (currentTab==="media" || currentTab==="trailer") {
            content = <PrepVideo vid={entry[currentTab==="media"?"mediaURL":"trailer"]} />;
        } else if (currentTab==="playlist") {
            content = <iframe style={{borderRadius:"32px",backgroundColor:"var(--color-mid)"}} src={"https://open.spotify.com/embed/playlist/"+entry.playlistURL.substring(34)+"?utm_source=generator&theme=0"} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>;
        } else if (currentTab==="sources") {
            if (Object.keys(entry).includes("ref")) { content = <div className={styles.citationContainer}><ul className="flex gap-4 text-xs uppercase mb-3">{citationFormats.map((c,i) => <li key={`cite${i}`} onClick={() => setCiteFormat(c)} className={`${c===citeFormat?"font-extrabold":""} cursor-pointer hover:opacity-80`}>{c}</li>)}</ul>{getCitations(entry.ref,citeFormat).map((src,i) => <Markdown key={`cit${i}`}>{src.citation}</Markdown>)}</div>; }
        }
        return content;
    };
    return (
        <>
            <div className="h-[34px] border-b-2 border-solid border-[var(--color-front)] pl-3 pr-2 sticky top-[calc(var(--header-h)+var(--title-bar-h))] bg-[var(--color-back)] flex items-center justify-between transition-all">
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
            <div className={`${styles.mediaContent} p-4 max-w-[800px]`}>
                {getContent()}
            </div>
        </>
    )
}