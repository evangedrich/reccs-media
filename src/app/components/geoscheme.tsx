"use client";

import { useState, useEffect, useRef } from "react";
import Map, { HoverMap } from "@/app/components/map";
import { subregions } from "@/app/lib/subregions";
import { reccsData } from "../lib/local-media";
import { collections } from "../lib/collections";
import { getTitle, preParse } from "../functions/text";
import Globe from "@/app/components/globe";
import styles from '@/app/ui/main.module.css';
import Link from "next/link";
import Image from "next/image";
import { useView } from "@/app/lib/viewContext";
import SubrInfoWindow from "./subrInfoWindow";

export default function Geoscheme() {
    const { showGlobe } = useView();
    const [currSubr,setCurrSubr] = useState<string>("X");
    const [hovered,setHovered] = useState<string>("");
    const entriesRef = useRef<HTMLDivElement>(null);
    const hoveredSubr = subregions.find(subr => subr.id===hovered)?.name;
    useEffect(() => {
        //entriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [currSubr]);
    const entries = reccsData.filter(itm => itm.id.startsWith(currSubr));
    return (
        <div>
            <div className={`${showGlobe ? "hidden max-sm:block" : "max-sm:hidden"} relative border-b-2 p-4`}>
				<div className="relative max-w-[900px] mx-auto">
					<div className=""><Map /></div>
					<div className={`${styles.hoverMap} absolute top-0 left-0 w-full`}>
                        <HoverMap currSubr={currSubr} setCurrSubr={setCurrSubr} setHovered={setHovered} />
                    </div>
                    <SubrInfoWindow currSubr={currSubr} setCurrSubr={setCurrSubr} hoveredSubr={hoveredSubr} />
				</div>
			</div>
            <div className={`${showGlobe ? "max-sm:hidden" : "hidden max-sm:block"} p-4 border-b-2`}>
				<div className="relative max-w-[450px] mx-auto">
                    <div className="relative border-2 rounded-full aspect-square w-full overflow-hidden">
                        <Globe currSubr={currSubr} setCurrSubr={setCurrSubr} setHovered={setHovered} hovered={hovered} />
                    </div>
                    <SubrInfoWindow currSubr={currSubr} setCurrSubr={setCurrSubr} hoveredSubr={hoveredSubr} />
                </div>
                
			</div>
            <div className="relative sm:hidden flex justify-center border-b-2 p-1">
                <h1 className={`${currSubr==="X"?"italic":"font-extrabold"}`}>{currSubr==="X" ? "select region above" : subregions.find(subr => subr.id===currSubr)?.name}</h1>
                <div className={`${currSubr==="X"?"hidden":""} absolute right-0 top-0 h-full aspect-square flex items-center justify-center border-l-2`} onClick={() => setCurrSubr("X")}>Ｘ</div>
            </div>
            <div className={`${currSubr==="X" ? "hidden" : ""} sm:hidden border-b-2 p-4`}>
                <p className="max-w-[800px] mx-auto text-sm">{preParse(subregions.find(subr => subr.id===currSubr)?.description ?? "")}</p>
            </div>
            <div ref={entriesRef} className={`border-b-2 mt-[-2px] overflow-x-auto overflow-y-hidden ${currSubr==="X"?"max-h-0":"max-h-[221px]"} transition-[max-height]`}>
                <div className="flex w-max mx-auto">{entries.map((entry,i) => (
                    <Link 
                        key={`card_${entry.id}`} 
                        href={`/${entry.id}`}
                        className={`shrink-0 flex flex-col gap-1 sm:w-[9rem] w-[7.7rem] p-3 border-r-2 ${i===0 ? "border-l-2 ml-[-2px]" : ""} hover:bg-[var(--color-mid)] group`}
                    >
                        <div className="bg-[var(--color-mid)] group-hover:opacity-90"><Image src={`/posters/${entry.id}.jpg`} alt="Media Image" width="300" height="400" className="w-full" loading="eager" /></div>
                        <h2 className="uppercase text-[0.55rem] leading-none mt-1 opacity-50 font-bold">{collections.find(coll => coll.id===entry.id.slice(4,7))?.shortName}</h2>
                        <h1 className="text-xs font-bold truncate">{getTitle(entry)}</h1>
                    </Link>
                ))}</div>
            </div>
            
        </div>
    )
}