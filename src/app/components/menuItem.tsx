import { useState, type CSSProperties } from "react";
import { collections } from "../lib/collections";
import { subregions } from "../lib/subregions";
import { regionPolygons } from "../lib/mapPaths";
import Link from "next/link";
import ColorLink from "./colorLink";
import { getColor } from "./collectionShelf";

export default function MenuItem({ name, tier1 }: { name: string, tier1: { id: string, color: string, code?: string[] }[] }) {
    const [mainOpen,setMainOpen] = useState(false);
    const [subOpen,setSubOpen] = useState(new Array(tier1.length).fill(false));
    const isCat: boolean = tier1[0].id==="literature";
    const menuStyle = `sm:absolute mt-1 sm:left-1/2 sm:-translate-x-1/2 border-2 max-sm:border-x-0 px-3 py-2 ${mainOpen?"":"hidden"} sm:group-hover/main:flex flex-col bg-[var(--color-back)] sm:items-center max-sm:items-start`;
    return (
        <div className="sm:relative group/main" onMouseLeave={() => setMainOpen(false)}>
            <div className={`relative uppercase sm:group-hover/main:font-extrabold cursor-default ${mainOpen?"font-extrabold":""} max-sm:px-1 select-none`} onClick={() => setMainOpen(!mainOpen)}>
                {name}
                {mainOpen
                ? <span className="relative max-sm:top-[1px] top-[-1px] inline-block sm:rotate-180">⌃</span>
                : <span className="relative top-[-1px] inline-block rotate-180">⌃</span>}
                <div className={`sm:hidden ${mainOpen ? "block" : "hidden"} absolute left-1/2 top-full -translate-x-1/2 translate-y-[1.5px] rotate-45 h-2 w-2 border-b-2 border-r-2 border-[var(--color-front)] bg-[var(--color-back)] z-10`}></div>
            </div>
            <div className={`${menuStyle} ${mainOpen?"max-sm:flex max-sm:absolute max-sm:inset-x-0 max-sm:p-3":""}`}>
                <div className="absolute -top-[9.5px] left-1/2 h-2 w-full -translate-x-1/2 max-sm:hidden"></div>
                <div className="absolute -top-[5.5px] sm:left-1/2 h-2 w-2 sm:-translate-x-1/2 rotate-45 border-t-2 border-l-2 border-[var(--color-front)] bg-[var(--color-back)] max-sm:hidden"></div>
                {tier1.map((itm,i) => (
                    <div key={`${itm.id}_nav`} onMouseLeave={() => setSubOpen(new Array(tier1.length).fill(false))}>
                        <span className="flex sm:justify-center items-center justify-start max-sm:p-1">
                            <button className="mr-[4px] max-sm:mr-2 cursor-pointer h-3 w-3 pb-[2px] leading-1 hover:bg-[var(--color-front)] hover:text-[var(--color-back)] active:opacity-80" onClick={() => setSubOpen(prevState => prevState.map((curr,k) => k===i ? !curr : curr))}>{subOpen[i] ? "-" : "+"}</button>
                            <span onClick={() => setMainOpen(false)}><ColorLink
                                to={isCat?`/collections/${itm.id}`:`/regions/${itm.id}`}
                                text={itm.id}
                                c={itm.color}
                                caps={true}
                                //bold={(pathname===`/${itm.id}` || collections.filter(coll => coll.type===itm.id).map(coll => coll.id).includes(pathname.slice(5,8)) )}
                            /></span>
                        </span>
                        <ul className={`sm:text-sm sm:text-center mb-2 max-sm:ml-5 ${subOpen[i] ? "block" : "hidden"}`}>
                            {isCat 
                            ? collections.filter(coll => coll.type===itm.id).map((coll,j) => (
                                <li key={`navColl${j+1}`} className="whitespace-nowrap group max-sm:p-1">
                                    <Link href={`/collections/${itm.id}?coll=${coll.id}`} className={`${getColor(coll.id)} group-hover:font-extrabold`} onClick={() => setMainOpen(false)}>{coll.name}</Link>
                                </li>
                            ))
                            : subregions.filter(subr => itm.code?.includes(subr.id.slice(0,2))).map((subr,j) => (
                                <li key={`navSubr${j+1}`} className="whitespace-nowrap group max-sm:p-1">
                                    <Link href={`/regions/${itm.id}?subr=${subr.id}`} style={{'--color-hover':regionPolygons.find(ply => ply.id===subr.id)?.color} as CSSProperties} className={`hover:font-extrabold hover:text-[var(--color-hover)]`} onClick={() => setMainOpen(false)}>{subr.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
}