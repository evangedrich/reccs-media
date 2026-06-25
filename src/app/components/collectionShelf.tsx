"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Markdown from "react-markdown";
import styles from "@/app/ui/main.module.css";
import CollectionShelfItems from "./collectionShelfItems";
import ShelfItemsMobile from "./collectionShelfItemsMobile";
import { preParse } from "../functions/text";
import type { Recc } from "../types/recc";

export const getColor = (id: string) => {
    if (id==="MTN") { return "group-hover:text-[var(--color-blue)]"; }
    else if (id==="STP") { return "group-hover:text-[var(--color-yellow)]"; }
    else if (id==="FRT") { return "group-hover:text-[var(--color-red)]"; }
    else if (id==="CFF") { return "group-hover:text-[var(--color-green)]"; }
    else if (id==="GFF") { return "group-hover:text-[var(--color-orange)]"; }
    else if (id==="CSF") { return "group-hover:text-[var(--color-purple)]"; }
    else if (id==="PMD") { return "group-hover:text-[var(--color-blue)]"; }
    else if (id==="OGM") { return "group-hover:text-[var(--color-red)]"; }
    else if (id==="UQC") { return "group-hover:text-[var(--color-orange)]"; }
    else { return "group-hover:text-[var(--color-purple)]"; }
};

export default function CollectionShelf({
    collections,
    reccs,
}: { collections: {
    id: string, name: string, shortName: string, type: string, header: string, info?: string
}[], reccs: Recc[] }): React.ReactNode {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialColl = searchParams.get("coll") ?? collections[0].id;
    const [currColl, setCurrColl] = useState(initialColl);
    // console.log(reccs.filter(recc => recc.id.slice(5,7)==="FF" || recc.id.slice(5,7)==="SF"));
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (currColl===collections[0].id) {params.delete("coll");} else {params.set("coll",currColl);}
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },[currColl]);
    const bgPatternMobile = "bg-[repeating-linear-gradient(45deg,var(--color-mid)_0px,var(--color-mid)_1px,transparent_1px,transparent_8px)]";
    const bgPattern = "sm:bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_1px,transparent_1px,transparent_8px)]";
    return (
        <>
            <div className={`flex max-sm:hidden sm:grow-1 border-b-2 border-[var(--color-front)] sm:justify-start justify-center w-[100vw] overflow-x-hidden ${bgPattern} ${bgPatternMobile}`}>
                {collections.map((coll,i) => (
                    <React.Fragment key={`${coll.id}shelf`}>
                        <div
                            className={`w-[72px] shrink-0 border-x-2 ml-[-2px] border-solid border-[var(--color-front)] cursor-pointer ${i===collections.length-1 ? "mr-[-2px]" : ""} px-4 py-3 group z-10 bg-[var(--color-back)] flex sm:block justify-center`}
                            onClick={() => setCurrColl(coll.id)}
                        >
                            <h1 className={`[writing-mode:vertical-rl] px-2 rounded-sm sm:text-3xl text-xl font-bold ${coll.id===currColl ? "italic" : ""} group-active:opacity-80 ${getColor(coll.id)} whitespace-nowrap`}>{coll.name}</h1>
                        </div>
                        <div style={{maxWidth: currColl===coll.id ? `calc(100vw - (68px * ${collections.length}))` : "0"}} className={`transition-[max-width] sm:flex hidden transition-500 overflow-hidden max-h-[calc(100vh_-_var(--header-h)_-_126px)] min-h-[34rem]`}>
                            <div style={{width:`calc((100vw - (68px * ${collections.length})) / 2)`}} className={`${styles.shelfText} border-r-2 shrink-0 p-4 overflow-y-auto no-scrollbar transition-[height]]`}>
                                <div>
                                    <Markdown>{"# "+coll.header}</Markdown>
                                    <Markdown>{preParse(coll.info ?? "")}</Markdown>
                                </div>
                            </div>
                            <CollectionShelfItems collections={collections} coll={coll} reccs={reccs} />
                        </div>
                        
                    </React.Fragment>
                ))}
            </div>
            <div className="sm:hidden border-b-2 p-2 flex flex-col gap-2">{collections.map((coll,i) => (
                <div key={`mobileColl${i}`} className="border-2 p-1 active:opacity-80" onClick={() => setCurrColl(coll.id)}>
                    <div className={`text-center p-1 font-bold ${currColl===coll.id ? "bg-[var(--color-front)] text-[var(--color-back)] font-extrabold" : ""}`}>{coll.name}</div>
                </div>
            ))}</div>
            <div className={`${styles.shelfText} sm:hidden flex flex-col`}>
                <ShelfItemsMobile collections={collections} collID={currColl} reccs={reccs} />
                <div className="p-4">
                    <Markdown>{"# "+collections.find(coll => coll.id===currColl)?.header}</Markdown>
                    <Markdown>{preParse(collections.find(coll => coll.id===currColl)?.info ?? "")}</Markdown>
                </div>
            </div>
        </>
        
    )
};