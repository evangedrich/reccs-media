'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { regions, subregions } from "@/app/lib/subregions";
import { ContourMap } from "./map";

export default function SubregionViewer({ regionID }: { regionID: string }) {
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
    const currSubrName = subrSet.find(subr => subr.id===currSubrID)?.name ?? `This is ${(regionID.charAt(0).toUpperCase()+regionID.slice(1)).replace("Americas","America")}n Media`;
    const currSubrDesc = subrSet.find(subr => subr.id===currSubrID)?.description ?? "Click around the map or on the headers above to learn more.";
    return (
        <div className="flex flex-col h-full grow">
            <ul className="flex shrink-0 justify-center-safe items-center h-[34px] border-b-2 max-sm:hidden overflow-x-auto overflow-y-hidden no-scrollbar">
                {subrSet.map((subr,i) => (
                    <li 
                        key={`${subr.id}button`} 
                        onClick={() => setCurrSubrID(subr.id===currSubrID?null:subr.id)}
                        className={`relative shrink-0 leading-[34px] px-4 ${i===subrSet.length-1?"":"border-r-2"} cursor-pointer hover:bg-[var(--color-mid)]`}
                    >
                        <span>
                            {subr.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="w-full grow flex flex-wrap">
                <div className="basis-full sm:basis-2/5 basis-full sm:border-r-2 max-sm:border-b-2 p-4 flex justify-end">
                    <div className="w-auto max-w-full h-auto max-h-full aspect-square max-sm:w-full shrink flex justify-center">
                        <ContourMap mapID={regionID} currSubrID={currSubrID} setCurrSubrID={setCurrSubrID} hovered={currHovered} setHovered={setCurrHovered} />
                    </div>
                </div>
                <div className="basis-full sm:basis-3/5 basis-full">
                    <div className="border-b-2 p-4">
                        <h1 className="max-w-200 text-5xl max-sm:text-4xl font-extrabold">{currSubrName.replace(" America","\u00A0America")}</h1>
                    </div>
                    <div className="border-b-2 p-4">
                        <p className="max-w-200">{currSubrDesc}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}