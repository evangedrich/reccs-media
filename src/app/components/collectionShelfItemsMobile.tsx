import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Recc } from "../types/recc";
import { subregions } from "../lib/subregions";
import { getTitle } from "../functions/text";
import { posterUrl } from "../lib/images";

type Collection = { id: string, name: string, shortName: string, type: string, header: string, info?: string };

export default function ShelfItemsMobile({
    collections,
    collID,
    reccs,
}: {
    collections: Collection[],
    collID: string,
    reccs: Recc[],
}): React.ReactNode {
    const [isExpanded,setIsExpanded] = useState(false);
    const entries = reccs.filter(item => item.id.endsWith(collID));
    const tracks = isExpanded ? 3 : 2;
    const padCount = (tracks - (entries.length % tracks)) % tracks;
    return (
        <div className="relative">
            <div className={`border-b-2 w-[100vw] grid gap-[2px] bg-[var(--color-front)] ${(isExpanded || entries.length<8) ? "grid-cols-3" : "overflow-x-auto no-scrollbar grid-rows-2 grid-flow-col auto-cols-[7.5rem] auto-rows-[10rem]"} overscroll-x-none`}>
                {entries.length>=8 && entries.map(entry => (
                    <Link key={`mobile_${entry?.id}`} href={`/${entry.id}`} className="block bg-[var(--color-back)] active:opacity-90">
                        <div className="p-2">
                            <div className="mb-1 bg-[var(--color-mid)] aspect-3/4">
                                <Image src={posterUrl(entry.id)} alt="Media Image" width="300" height="400" className="w-full" unoptimized />
                            </div>
                            <h4 className="text-[0.5rem] font-bold opacity-50 truncate">{subregions.find(subr => subr.id===entry.id.slice(0,4))?.name}</h4>
                            <h3 className="text-[0.8rem] font-semibold truncate">{getTitle(entry)}</h3>
                        </div>
                    </Link>
                ))}
                {entries.length>=8 && Array.from({ length: padCount }).map((_, idx) => (
                    <div key={`pad_${idx}`} className="bg-[var(--color-back)]" />
                ))}
                {entries.length<8
                ? <>{Array.from({ length: 3 }).map((_,i) => (<div key={`dummy${i}`} className="bg-[var(--color-back)] p-2 flex flex-col gap-[5px]"><div className="aspect-3/4 bg-[var(--color-mid)]"></div><div className="w-full h-2 bg-[var(--color-mid)]"></div><div className="w-full h-3 bg-[var(--color-mid)]"></div></div>))}</>
                : <></>}
            </div>
            <div className={`${entries.length<8?"hidden":""} border-b-2 flex justify-center bg-[repeating-linear-gradient(45deg,var(--color-mid)_0px,var(--color-mid)_1px,transparent_1px,transparent_8px)]`}>
                <button className="border-x-2 px-2 bg-[var(--color-back)]" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? "- collapse -" : "+ expand +"}</button>
            </div>
        </div>
    )
}