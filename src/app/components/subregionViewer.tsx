'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { regions, subregions } from "@/app/lib/subregions";
import { ContourMap, FullContourMap } from "./map";
import { DynamicContourMap } from "./dynamicContourMap";
import ContourGlobe from "./contourGlobe";
import { Recc } from "../types/recc";
import Link from "next/link";
import Image from "next/image";
import LoadingIcon from "./loading";
import { posterUrl } from "../lib/images";
import { getTitle } from "../functions/text";
import { collections } from "../lib/collections";
import { checkFont } from "../functions/text";

export default function SubregionViewer({ regionID, reccs }: { regionID: string; reccs: Recc[]; }) {
    const [showGlobe,setShowGlobe] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialSubrID = searchParams.get("subr") ?? null;
    const [currSubrID, setCurrSubrID] = useState<string|null>(initialSubrID);
    const [currHovered, setCurrHovered] = useState<string|null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [edges, setEdges] = useState<{ atStart: boolean; atEnd: boolean }>({ atStart: true, atEnd: false });
    useEffect(() => {
        const subr = searchParams.get("subr") ?? null;
        setCurrSubrID(subr);
    },[searchParams]);
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (currSubrID) {params.set("subr",currSubrID);}
        else {params.delete("subr");}
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },[currSubrID]);

    const region = regions.find(reg => reg.id===regionID);
    const subrSet = subregions.filter(subr => region?.code?.includes(subr.id.slice(0,2)));
    const currSubrName = subrSet.find(subr => subr.id===currSubrID)?.name ?? "";
    const currSubrDesc = subrSet.find(subr => subr.id===currSubrID)?.description ?? "Click around the map or on the headers above to learn more.";
    const neighbors = subregions.find(subr => subr.id===currSubrID)?.neighbors;

    
    const entries = reccs.filter(entry => entry.id.slice(0,4)===currSubrID);

    const measure = () => {
        const el = scrollRef.current;
        if (!el) return;
        setEdges({
            atStart: el.scrollLeft <= 0,
            atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
        });
    };
    const scrollShelf = (dir: 1 | -1) => {
        const el = scrollRef.current;
        if (!el) return;
        const step = (el.querySelector<HTMLElement>(":scope > a")?.offsetWidth ?? el.clientWidth) + 2;
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    };
    useEffect(() => {
        measure();
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [entries.length, currSubrID]);

    return (
        <div className="flex flex-col h-full grow">
            <ul className="flex shrink-0 justify-center-safe items-center h-[34px] border-b-2 overflow-x-auto overflow-y-hidden no-scrollbar">
                {subrSet.map((subr,i) => (
                    <li 
                        key={`${subr.id}button`} 
                        onClick={() => setCurrSubrID(subr.id===currSubrID?null:subr.id)}
                        className={`relative shrink-0 leading-[34px] px-4 ${i===subrSet.length-1?"":"border-r-2"} cursor-pointer hover:bg-[var(--color-mid)]/75 select-none`}
                    >
                        <span>
                            {subr.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="relative w-full grow flex max-sm:flex-col sm:flex-wrap sm:overflow-hidden">
                <div className={`max-sm:shrink-0 min-w-0 max-sm:border-b-2 p-4 flex justify-center ${showGlobe?"transition-[flex-basis] duration-250":""} ${currSubrID ? "sm:basis-1/2" : "sm:basis-full"}`}>
                    <div className={`w-auto max-w-full h-auto max-h-full ease-in-out max-sm:w-full max-sm:max-h-none shrink-0 flex items-center justify-center max-sm:aspect-square ${currSubrID? /*"sm:aspect-square sm:transition-[aspect-ratio] sm:duration-250"*/ "" : "sm:aspect-2/1"}`}>
                        <div className={`${!showGlobe?"max-sm:hidden":"sm:hidden"} w-full h-full`}><DynamicContourMap mapID={regionID} currSubrID={currSubrID} setCurrSubrID={setCurrSubrID} hovered={currHovered} setHovered={setCurrHovered} /></div>
                        <div className={`${!showGlobe?"sm:hidden":"max-sm:hidden"} border-2 h-full w-auto max-w-full rounded-full aspect-square p-[3.5px] shrink-0 overflow-hidden`}><ContourGlobe mapID={regionID} currSubrID={currSubrID} setCurrSubrID={setCurrSubrID} hovered={currHovered} setHovered={setCurrHovered} /></div>
                    </div>
                </div>
                <div className={`max-sm:grow max-sm:min-h-0 min-w-0 max-w-full overflow-y-scroll sm:absolute sm:top-0 sm:right-0 sm:bottom-0 sm:w-1/2 ease-in-out ${currSubrID ? "transition-transform duration-250 sm:translate-x-0 sm:border-l-2" : "sm:translate-x-full"}`}>
                    <div className={`${currSubrID ? "border-b-2" : ""} p-4`}>
                        <h1 className={`max-w-200 text-5xl max-sm:text-4xl font-extrabold ${currSubrID?"mb-3":""}`}>{currSubrID ? currSubrName.replace(" America","\u00A0America") : currSubrName}</h1>
                        <p className="max-w-200">{currSubrDesc}</p>
                    </div>
                    <div className={`relative ${entries.length>0?"border-b-2":""}`}>
                        <div ref={scrollRef} onScroll={measure} className="max-w-full flex overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
                            {entries.map((entry,i) => (
                                <Link className={`w-40 max-sm:w-30 h-auto shrink-0 p-3 hover:bg-[var(--color-mid)]/75 active:opacity-90 group sm:snap-start ${i<entries.length-1||entries.length<5 ?"border-r-2":""}`} href={`/${entry.id}`} key={`item${entry.id}`}>
                                    <div className="relative w-full aspect-3/4 bg-[var(--color-mid)] group-hover:opacity-90">
                                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center"><LoadingIcon /></div>
                                        <Image src={posterUrl(entry.id)} alt="Media Image" width="300" height="400" className="absolute top-0 left-0 w-full" unoptimized />
                                    </div>
                                    <h3 className="text-[0.65em]/1 opacity-50 mt-3">{collections.find(coll => coll.id===entry.id.slice(4,7))?.shortName}</h3>
                                    <h2 className={`text-sm font-semibold truncate leading-[2em] mb-[-0.6em] ${checkFont(getTitle(entry))}`}>{getTitle(entry)}</h2>
                                </Link>
                            ))}
                        </div>
                        <div onClick={() => scrollShelf(-1)} className={`absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 flex items-center ${edges.atStart ? "opacity-0 pointer-events-none" : ""} max-sm:hidden`}>
                            <div className="w-10 h-10 bg-[var(--color-back)] border-2 border-l-0 cursor-pointer group">
                                <div className="w-full h-full group-hover:bg-[var(--color-mid)] font-light text-xl flex justify-center items-center select-none">{"<"}</div>
                            </div>
                        </div>
                        <div onClick={() => scrollShelf(1)} className={`absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 flex items-center ${edges.atEnd ? "opacity-0 pointer-events-none" : ""} max-sm:hidden`}>
                            <div className="w-10 h-10 bg-[var(--color-back)] border-2 border-r-0 cursor-pointer group">
                                <div className="w-full h-full group-hover:bg-[var(--color-mid)] font-light text-xl flex justify-center items-center select-none">{">"}</div>
                            </div>
                        </div>
                    </div>
                    <div className={`p-4 ${neighbors?.length??0>0 ? "" : "hidden"}`}>
                        <h3 className="text-xs opacity-50 mb-1">Related:</h3>
                        <p className="-ml-1">
                            {neighbors?.map((neighborID,i) => (
                                <Link className="mr-1 p-1 px-1 leading-1 hover:bg-[var(--color-mid)]/75" href={`/regions/${regions.find(reg => reg.code?.includes(neighborID.slice(0,2)))?.id}?subr=${neighborID}`} key={`neighbor${neighborID}`}>
                                    <span className="inline-block">{subregions.find(subr => subr.id===neighborID)?.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}{i<neighbors.length-1?",":""}</span>
                                </Link>
                            ))}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}