'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { regions, subregions } from "@/app/lib/subregions";
import { ContourMap, FullContourMap } from "./map";
import { DynamicContourMap } from "./dynamicContourMap";
import ContourGlobe from "./contourGlobe";
import { Recc } from "../types/recc";
import Link from "next/link";
import { getTitle } from "../functions/text";
import { collections } from "../lib/collections";

export default function SubregionViewer({ regionID, reccs }: { regionID: string; reccs: Recc[]; }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialSubrID = searchParams.get("subr") ?? null;
    const [currSubrID, setCurrSubrID] = useState<string|null>(initialSubrID);
    const [currHovered, setCurrHovered] = useState<string|null>(null);
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

    
    const entries = reccs.filter(entry => entry.id.slice(0,4)===currSubrID);
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
            <div className="relative w-full grow flex flex-wrap sm:overflow-hidden">
                <div className={`max-sm:basis-full min-w-0 max-sm:border-b-2 p-4 flex justify-center ease-in-out ${currSubrID ? "transition-[flex-basis] duration-250 sm:basis-1/2 sm:border-r-2" : "sm:basis-full"}`}>
                    <div className={`w-auto max-w-full h-auto max-h-full ease-in-out max-sm:w-full max-sm:h-full shrink-0 flex items-center justify-center max-sm:aspect-square ${currSubrID? /*"sm:aspect-square sm:transition-[aspect-ratio] sm:duration-250"*/ "" : "sm:aspect-2/1"}`}>
                        <div className={`${true?"max-sm:hidden":"sm:hidden"} w-full h-full`}><DynamicContourMap mapID={regionID} currSubrID={currSubrID} setCurrSubrID={setCurrSubrID} hovered={currHovered} setHovered={setCurrHovered} /></div>
                        <div className={`${true?"sm:hidden":"max-sm:hidden"} border-2 h-full w-auto max-w-full rounded-full aspect-square p-[3.5px] shrink-0`}><ContourGlobe mapID={regionID} currSubrID={currSubrID} setCurrSubrID={setCurrSubrID} hovered={currHovered} setHovered={setCurrHovered} /></div>
                    </div>
                </div>
                <div className={`max-sm:basis-full min-h-55 min-w-0 max-w-full sm:absolute sm:top-0 sm:right-0 sm:bottom-0 sm:w-1/2 ease-in-out ${currSubrID ? "transition-transform duration-250 sm:translate-x-0" : "sm:translate-x-full"}`}>
                    <div className="border-b-2 p-4">
                        <h1 className={`max-w-200 text-5xl max-sm:text-4xl font-extrabold ${currSubrID?"mb-3":""}`}>{currSubrID ? currSubrName.replace(" America","\u00A0America") : currSubrName}</h1>
                        <p className="max-w-200">{currSubrDesc}</p>
                    </div>
                    <div className={`max-w-full ${entries.length>0?"border-b-2":""} flex overflow-x-auto overflow-y-hidden no-scrollbar`}>
                        {entries.map(entry => (
                            <Link className="w-40 max-sm:w-30 h-auto shrink-0 border-r-2 p-3 hover:bg-[var(--color-mid)]/75" href={`/${entry.id}`} key={`item${entry.id}`}>
                                <div className="w-full aspect-3/4 bg-[var(--color-mid)]"></div>
                                <h3 className="text-[0.7em] opacity-50 mt-1">{collections.find(coll => coll.id===entry.id.slice(4,7))?.shortName}</h3>
                                <h2 className="text-sm font-bold truncate leading-[2em] mb-[-0.5em]">{getTitle(entry)}</h2>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}