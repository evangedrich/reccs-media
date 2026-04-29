"use client";

import { useState, useEffect, useRef } from "react";
import Map, { HoverMap } from "@/app/components/map";
import { subregions } from "@/app/lib/subregions";
import { reccsData } from "../lib/local-media";
import { collections } from "../lib/collections";
import { getTitle } from "../functions/text";
import Globe from "@/app/components/globe";
import styles from '@/app/ui/main.module.css';
import Link from "next/link";
import Image from "next/image";

export default function Geoscheme({ round }: { round?: string }) {
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
            <div className={`${round ? "hidden" : ""} relative border-b-2 p-4`}>
				<div className="relative max-w-[900px] mx-auto">
					<div className=""><Map /></div>
					<div className={`${styles.hoverMap} absolute top-0 left-0 w-full`}>
                        <HoverMap currSubr={currSubr} setCurrSubr={setCurrSubr} setHovered={setHovered} />
                    </div>
				</div>
                <div className={`${currSubr==="X"&&!hoveredSubr?"opacity-50":""} absolute top-0 left-0 border-2 m-2 hidden sm:flex flex-col text-xs bg-[var(--color-back)]`}>
                    <div className="flex justify-between">
                        <div className="p-1 px-2">
                            {currSubr==="X"
                        ? <span>{!hoveredSubr ? <i>select region</i> : <b>{hoveredSubr}</b>}</span>
                        : <span><b>{subregions.find(subr => subr.id===currSubr)?.name}</b></span>}
                        </div>
                        <div className={`${currSubr==="X"?"hidden":""} w-[2em] h-[2em] leading-[2em] flex items-center justify-center border-l-2 cursor-pointer hover:bg-[var(--color-mid)]`} onClick={() => setCurrSubr("X")}>Ｘ</div>
                    </div>
                    <p className={`border-t-2 max-w-80 w-fit ${currSubr==="X"?"max-h-0 p-0":"max-h-40 px-2 pt-1 pb-2"} transition-[max-height] duration-200 overflow-hidden`}>{subregions.find(subr => subr.id===currSubr)?.description}</p>
                </div>
			</div>
            <div className={`${round ? "" : "hidden"} p-4`}>
				<div className="border-2 rounded-full aspect-square"><Globe /></div>
			</div>
            <div className="sm:hidden flex justify-center border-b-2 p-1">
                <h1 className={`${currSubr==="X"?"italic":"font-extrabold"}`}>{currSubr==="X" ? "select region above" : subregions.find(subr => subr.id===currSubr)?.name}</h1>
            </div>
            <div className={`${currSubr==="X" ? "hidden" : ""} sm:hidden border-b-2 p-4`}>
                <p className="max-w-[800px] mx-auto text-sm">{subregions.find(subr => subr.id===currSubr)?.description}</p>
            </div>
            <div ref={entriesRef} className="border-b-2 mt-[-2px] overflow-x-auto">
                <div className="flex w-max mx-auto">{entries.map((entry,i) => (
                    <Link 
                        key={`card_${entry.id}`} 
                        href={`/${entry.id}`}
                        className={`shrink-0 flex flex-col gap-1 sm:w-[9rem] w-[8rem] p-3 border-r-2 ${i===0 ? "border-l-2 ml-[-2px]" : ""} hover:bg-[var(--color-mid)] group`}
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