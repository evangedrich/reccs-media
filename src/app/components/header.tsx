'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation'
import Link from "next/link";
import ColorLink from "./colorLink";
import TinyMap from "./tinyMap";
import Clock from "./clock";
import styles from "@/app/ui/main.module.css";
import { syncopate, notoEmoji } from "@/app/fonts/fonts";
import { collections } from "../lib/collections";
import { subregions } from "../lib/subregions";
import { regionPolygons } from "../lib/mapPaths";
import { useView } from "../lib/viewContext";
import { getColor } from "./collectionShelf";

const categories = [
    { id: "literature", color: "g" },
    { id: "cinema", color: "y" },
    { id: "theatre", color: "r" },
    { id: "systems", color: "p" },
];
const regions = [
    { id: "africa", color: "p", code: ["AF"] },
    { id: "americas", color: "b", code: ["AM"] },
    { id: "eurasia", color: "o", code: ["AS","EU"] },
    { id: "oceania", color: "g", code: ["OC"] },
];

function MenuItem({ name, tier1 }: { name: string, tier1: { id: string, color: string, code?: string[] }[] }) {
    const [isOpen,setIsOpen] = useState(new Array(tier1.length).fill(false));
    const isCat: boolean = tier1[0].id==="literature";
    return (
        <div className="relative group/main">
            <div className="uppercase group-hover/main:font-extrabold cursor-pointer">
                {name}
                <span className="relative -top-[4.5px] font-black">⌄</span>
            </div>
            <div className="absolute mt-1 left-1/2 -translate-x-1/2 border-2 px-3 py-2 hidden group-hover/main:flex flex-col items-center bg-[var(--color-back)]">
                <div className="absolute -top-[9.5px] left-1/2 h-2 w-full -translate-x-1/2"></div>
                <div className="absolute -top-[5.5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-t-2 border-l-2 border-[var(--color-front)] bg-[var(--color-back)]"></div>
                {tier1.map((itm,i) => (
                    <div key={`${itm.id}_nav`} onMouseLeave={() => setIsOpen(new Array(tier1.length).fill(false))}>
                        <span className="flex justify-center items-center">
                            <button className="mr-[4px] cursor-pointer h-3 w-3 pb-[2px] leading-1 hover:bg-[var(--color-front)] hover:text-[var(--color-back)] active:opacity-80" onClick={() => setIsOpen(prevState => prevState.map((curr,k) => k===i ? !curr : curr))}>{isOpen[i] ? "-" : "+"}</button>
                            <ColorLink
                                to={isCat?`/${itm.id}`:`/regions/${itm.id}`}
                                text={itm.id}
                                c={itm.color}
                                caps={true}
                                //bold={(pathname===`/${itm.id}` || collections.filter(coll => coll.type===itm.id).map(coll => coll.id).includes(pathname.slice(5,8)) )}
                            />
                        </span>
                        <ul className={`text-sm text-center mb-2 ${isOpen[i] ? "block" : "hidden"}`}>
                            {isCat 
                            ? collections.filter(coll => coll.type===itm.id).map((coll,j) => (
                                <li key={`navColl${j+1}`} className="whitespace-nowrap group">
                                    <Link href={`/${itm.id}?coll=${coll.id}`} className={`${getColor(coll.id)} group-hover:font-extrabold`}>{coll.name}</Link>
                                </li>
                            ))
                            : subregions.filter(subr => itm.code?.includes(subr.id.slice(0,2))).map((subr,j) => (
                                <li key={`navSubr${j+1}`} className="whitespace-nowrap group">
                                    <Link href={`/regions/${itm.id}?subr=${subr.id}`} style={{'--color-hover':regionPolygons.find(ply => ply.id===subr.id)?.color}} className={`hover:font-extrabold hover:text-[var(--color-hover)]`}>{subr.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Header() {
    const { showGlobe, toggleGlobe, isDark, toggleDark, isOffline, toggleOffline } = useView();
    const [showWidget, setShowWidget] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [colonVisible, setColonVisible] = useState(true);

    const pathname = usePathname();
    const router = useRouter();
    useEffect(() => {
        document.documentElement.style.setProperty('--header-h', showWidget ? '7.625rem' : '5.5rem');
    }, [showWidget]);
    useEffect(() => {
        const timer = setInterval(() => {
            setDate(new Date());
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setColonVisible(v => !v);
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full sticky top-0 bg-[var(--color-back)] z-30">
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] flex items-center justify-between overflow-hidden">
                {/* <div className={`${notoEmoji.className} text-2xl w-13 h-13 text-center leading-13`}>🌎</div> */}
                <div className={`w-13 h-13 text-center leading-13 flex items-center ${showGlobe?"justify-end max-sm:justify-center":"justify-center max-sm:justify-center"} active:scale-90 transition-[scale]`}>
                    <div className={`h-6 ${showGlobe?"rounded-[1px] w-10 max-sm:rounded-full max-sm:w-6":"rounded-full w-6 max-sm:rounded-[1px] max-sm:w-6"} overflow-hidden ring-[1.8px] ring-[var(--color-front)] cursor-pointer group hover:opacity-80 ${pathname==="/"?"block":"hidden"}`} onClick={() => pathname==="/" ? toggleGlobe() : router.push('/')}>
                        <div className={`flex h-6 ${showGlobe?"":"animate-[map-scroll_800ms_linear_infinite] max-sm:animate-none"} [animation-play-state:paused] group-hover:[animation-play-state:running] ml-[-5px]`}>
                            <div className={`${showGlobe?"ml-[-1.5px] max-sm:ml-[-3px]":"max-sm:ml-[-5px]"} shrink-0 w-[50px] h-6`}><TinyMap /></div>
                            <div className="shrink-0 w-[50px] h-6"><TinyMap /></div>
                        </div>
                    </div>
                    <div className={`w-7 h-7 pr-2 ${pathname==="/"?"hidden":"flex"} items-center justify-start cursor-pointer`} onClick={() => router.back()}>
                        <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                            <path d="M 75,10 8,50 75,90" fill="none" stroke="var(--color-front)" strokeWidth="8" strokeLinejoin="miter" />
                        </svg>
                    </div>
                </div>
                <Link href="/" className={`${styles.title} ${syncopate.className} font-black text-3xl my-2 flex`}>
                    <span>R</span><span>E</span><span>C</span><span>C</span><span>S</span>
                </Link>
                <button className={`text-4xl w-13 h-13 text-center leading-13 cursor-pointer ${showWidget ? "transform rotate-45" : ""} transition-[rotate] font-light hover:opacity-80 active:scale-90 select-none`} onClick={() => setShowWidget(!showWidget)}>＋</button>
            </div>
            <div className={`w-full border-b-2 border-solid border-[var(--color-front)] ${showWidget ? "max-h-10" : "max-h-0 mt-[-2px]"} transition-[max-height]`}>
                <div className={`flex justify-between px-1 h-8 transition-opacity ${showWidget ? "" : "opacity-0 pointer-events-none flex-wrap"}`}>
                    <div className="m-1 pl-1 items-center sm:gap-8 gap-4 flex">
                        {isDark
                        ? <div className="sm:after:content-['dark'] sm:hover:after:content-['light'] sm:hover:italic cursor-pointer" onClick={() => toggleDark()}><span className="align-[0.2em] inline-block transform sm:scale-100 scale-150">{colonVisible ? "◒" : "◓"}</span> </div>
                        : <div className="sm:after:content-['light'] sm:hover:after:content-['dark'] sm:hover:italic cursor-pointer" onClick={() => toggleDark()}><span className="align-[0.2em] inline-block transform sm:scale-100 scale-150">{colonVisible ? "◐" : "◑"}</span> </div>
                        }
                        {isOffline
                        ? <div className="sm:after:content-['offline'] sm:hover:after:content-['online'] sm:hover:italic cursor-pointer" onClick={() => toggleOffline()}><span className="align-[0.2em] inline-block transform sm:scale-100 scale-150">{colonVisible ? "○" : "∅"}</span> </div>
                        : <div className="sm:after:content-['online'] sm:hover:after:content-['offline'] sm:hover:italic cursor-pointer" onClick={() => toggleOffline()}><span className="align-[0.2em] inline-block transform sm:scale-100 scale-150">{colonVisible ? "⦾" : "⦿"}</span> </div>
                        }
                    </div>
                    <Clock date={date} time={time} colonVisible={colonVisible} />
                </div>
            </div>
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] p-1 flex gap-6 sm:gap-8 items-center justify-center">
                <MenuItem name="collections" tier1={categories} />
                <MenuItem name="regions" tier1={regions} />
                <Link href="/search" className="hover:font-extrabold">SEARCH</Link>
                {/* {categories.map(itm => (
                    <ColorLink
                        to={`/${itm.id}`}
                        text={itm.id}
                        c={itm.color}
                        caps={true}
                        bold={(pathname===`/${itm.id}` || collections.filter(coll => coll.type===itm.id).map(coll => coll.id).includes(pathname.slice(5,8)) )}
                        key={`${itm.id}_nav`}
                    />
                ))} */}
                {/* <Link href="/" className={`${styles.navLink} bg-[var(--color-front)] text-[var(--color-back)] px-1`}>SUBMISSIONS</Link> */}
            </div>


        </div>
    )
}
