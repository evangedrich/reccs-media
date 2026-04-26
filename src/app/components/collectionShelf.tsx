"use client";

import React, { useState } from "react";
import Markdown from "react-markdown";
import styles from "@/app/ui/main.module.css";
import CollectionShelfItems from "./collectionShelfItems";

export default function CollectionShelf({ 
    collections 
}: { collections: {
    id: string, name: string, type: string, header: string, info?: string
}[] }): React.ReactNode {
    const [currColl, setCurrColl] = useState(collections[0].id);
    return (
        <div className="flex sm:grow-1 border-b-2 border-[var(--color-front)] sm:justify-start justify-center w-[100vw] overflow-x-hidden">
            {collections.map((coll,i) => (
                <React.Fragment key={`${coll.id}shelf`}>
                    <div 
                        className={`border-x-2 ml-[-2px] border-solid border-[var(--color-front)] cursor-pointer ${i===collections.length-1 ? "mr-[-2px]" : ""} px-4 py-3 group hover:bg-[var(--color-mid)] z-10`} 
                        onClick={() => setCurrColl(coll.id)}
                    >
                        <h1 className={`[writing-mode:vertical-rl] px-2 rounded-sm text-3xl font-bold ${coll.id===currColl ? /*"bg-[var(--color-front)] text-[var(--color-back)]"*/ "italic" : ""} group-active:opacity-80 truncate`}>{coll.name}</h1>
                    </div>
                    <div style={{maxWidth: currColl===coll.id ? `calc(100vw - (68px * ${collections.length}))` : "0"}} className={`transition-[max-width] sm:flex hidden transition-500 overflow-hidden max-h-[calc(100vh_-_var(--header-h)_-_131.5px)] min-h-[34rem]`}>
                        <div style={{width:`calc((100vw - (68px * ${collections.length})) / 2)`}} className={`${styles.shelfText} border-r-2 shrink-0 p-4 overflow-auto transition-all`}>
                            <div>
                                <Markdown>{"# "+coll.header}</Markdown>
                                <Markdown>{coll.info ?? ""}</Markdown>
                            </div>
                        </div>
                        <CollectionShelfItems collections={collections} entry={coll} />
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
};