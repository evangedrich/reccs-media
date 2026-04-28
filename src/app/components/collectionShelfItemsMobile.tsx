import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { reccsData } from "../lib/local-media";
import { subregions } from "../lib/subregions";
import { getTitle } from "../functions/text";

type Collection = { id: string, name: string, shortName: string, type: string, header: string, info?: string };

export default function ShelfItemsMobile({
    collections,
    collID,
}: {
    collections: Collection[],
    collID: string,
}): React.ReactNode {
    const [isExpanded,setIsExpanded] = useState(false);
    const entries = reccsData.filter(item => item.id.endsWith(collID));
    const tracks = isExpanded ? 3 : 2;
    const padCount = (tracks - (entries.length % tracks)) % tracks;
    return (
        <div className="relative">
            <div className={`border-b-2 w-[100vw] grid gap-[2px] bg-[var(--color-front)] ${isExpanded ? "grid-cols-3" : "overflow-x-auto grid-rows-2 grid-flow-col auto-cols-[7.5rem] auto-rows-[10rem]"}`}>
                {entries.map(entry => (
                    <Link key={`mobile_${entry?.id}`} href={`/${entry.id}`} className="block bg-[var(--color-back)]">
                        <div className="p-2">
                            <div className="mb-1">
                                <Image src={`/posters/${entry?.id}.jpg`} alt="Media Image" width="300" height="400" className="w-full" />
                            </div>
                            <h4 className="text-[0.5rem] font-bold opacity-50 truncate">{subregions.find(subr => subr.id===entry.id.slice(0,4))?.name}</h4>
                            <h3 className="text-[0.8rem] font-semibold truncate">{getTitle(entry)}</h3>
                        </div>
                    </Link>
                ))}
                {Array.from({ length: padCount }).map((_, idx) => (
                    <div key={`pad_${idx}`} className="bg-[var(--color-back)]" />
                ))}
            </div>
            <div className="border-b-2 flex justify-center bg-[repeating-linear-gradient(45deg,var(--color-mid)_0px,var(--color-mid)_1px,transparent_1px,transparent_8px)]">
                <button className="border-x-2 px-2 bg-[var(--color-back)]" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? "- collapse -" : "+ expand +"}</button>
            </div>
        </div>
    )
}