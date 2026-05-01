"use client";

import { useEffect, useRef, useState } from "react";
import { syncopate } from "../fonts/fonts";
import { reccsData } from "../lib/local-media";
import { subregions } from "../lib/subregions";
import Link from "next/link";
import Image from "next/image";
import { getTitle } from "../functions/text";

type Collection = { id: string, name: string, shortName: string, type: string, header: string, info?: string };

export default function CollectionShelfItems({
    collections,
    coll,
}: {
    collections: Collection[],
    coll: Collection,
}): React.ReactNode {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [edges, setEdges] = useState<{ atStart: boolean; atEnd: boolean }>({ atStart: true, atEnd: false });
    const [rows, setRows] = useState(5);
    const [cols, setCols] = useState(5);
    const isLast = collections[collections.length - 1].id === coll.id;
    const isOnly = collections.length === 1;
    const entries = reccsData.filter(entry => entry.id.endsWith(coll.id));
    const padCount = rows > 0 ? (rows - (entries.length % rows)) % rows : 0;
    const fillCount = rows * cols;

    const measure = () => {
        const el = scrollRef.current;
        if (!el) return;
        setEdges({
            atStart: el.scrollLeft <= 0,
            atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
        });
        const rowCount = getComputedStyle(el).gridTemplateRows.split(" ").filter(Boolean).length;
        setRows(rowCount || 1);
        const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth ?? 192;
        setCols(Math.max(1, Math.floor(el.clientWidth / cardWidth)));
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
    }, [collections]);

    return (
        <div className="relative">
            <div ref={scrollRef} onScroll={measure} style={{width:`calc((100vw - (68px * ${collections.length})) / 2)`}} className={`shrink-0 overflow-x-auto overscroll-x-none h-full grid grid-rows-[repeat(auto-fill,minmax(16rem,1fr))] grid-flow-col auto-cols-[minmax(12rem,1fr)] gap-[2px] ${entries.length>0||true ? "bg-[var(--color-front)]" : "bg-[var(--color-back)]"} ${collections.length>1?"pr-[6px]":""} snap-x snap-mandatory`}>
                {entries.map(entry => (
                    <Link href={`/${entry.id}`} className="block bg-[var(--color-back)] snap-start group" key={`${entry.id}_card`}>
                        <div className="shrink-1 w-full h-full hover:bg-[var(--color-mid)] px-4 flex flex-col gap-1 flex flex-col justify-center">
                            <div className="shrink-1 bg-[var(--color-mid)] group-hover:opacity-90">
                                <Image src={`/posters/${entry?.id}.jpg`} alt="Media Image" width="300" height="400" loading="eager" />
                            </div>
                            <h2 className={`shrink-0 ${syncopate.className} leading-none uppercase font-bold text-[0.47rem] opacity-50 pt-1`}>{subregions.find(subr => subr.id===entry.id.slice(0,4))?.name}</h2>
                            <h1 className={`shrink-0 text-[0.84rem] mt-[-0.15rem] font-semibold truncate`}>{getTitle(entry)}</h1>
                        </div>
                    </Link>
                ))}
                {Array.from({ length: padCount }).map((_, idx) => (
                    <div key={`pad_${idx}`} className="bg-[var(--color-back)]" />
                ))}
                {entries.length===0
                ? <>{Array.from({ length: fillCount*2 }).map((_,i) => (<div key={`dummy${i}`} className="bg-[var(--color-back)] p-5 flex flex-col justify-center gap-2 snap-start"><div className="aspect-3/4 shrink-1 bg-[var(--color-mid)]"></div><div className="shrink-0 w-full h-2 bg-[var(--color-mid)]"></div><div className="shrink-0 w-full h-4 bg-[var(--color-mid)]"></div></div>))}</>
                : <></>}
            </div>
            <div onClick={() => scrollShelf(-1)} className={`absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 flex items-center ${edges.atStart ? "opacity-0 pointer-events-none" : ""}`}>
                <div className="w-10 h-10 bg-[var(--color-back)] border-2 border-l-0 cursor-pointer group">
                    <div className="w-full h-full group-hover:bg-[var(--color-mid)] font-light text-xl flex justify-center items-center select-none">{"<"}</div>
                </div>
            </div>
            <div onClick={() => scrollShelf(1)} className={`absolute top-1/2 -translate-y-1/2 right-0 w-10 ${isLast ? "" : "mr-[4px]"} h-10 flex items-center ${edges.atEnd ? "opacity-0 pointer-events-none" : ""}`}>
                <div className={`w-10 h-10 bg-[var(--color-back)] border-2 ${isOnly ? "border-r-0" : ""} cursor-pointer group`}>
                    <div className="w-full h-full group-hover:bg-[var(--color-mid)] font-light text-xl flex justify-center items-center select-none">{">"}</div>
                </div>
            </div>
            <div className={`${entries.length>0||true ? "hidden" : ""} absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center opacity-60`}>
                <p>(coming soon)</p>
            </div>
        </div>
    );
}
