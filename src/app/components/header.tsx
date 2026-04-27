'use client';

import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation'
import Link from "next/link";
import ColorLink from "./colorLink";
import TinyMap from "./tinyMap";
import styles from "@/app/ui/main.module.css";
import { syncopate, notoEmoji } from "@/app/fonts/fonts";
import { collections } from "../lib/collections";

const navLinks = [
    { id: "literature", color: "g" },
    { id: "cinema", color: "o" },
    { id: "theatre", color: "r" },
    { id: "systems", color: "p" },
];

export default function Header() {
    const [showWidget, setShowWidget] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [date, setDate] = useState("12 Itzcuintli");
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [colonVisible, setColonVisible] = useState(true);
    const [calDropdown, setCalDropdown] = useState(false);
    const pathname = usePathname();
    useEffect(() => {
        document.documentElement.style.setProperty('--header-h', showWidget ? '7.625rem' : '5.5rem');
    }, [showWidget]);
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setColonVisible(v => !v);
        }, 500);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="w-full sticky top-0 bg-[var(--color-back)] z-30">
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] flex items-center justify-between overflow-hidden">
                {/* <div className={`${notoEmoji.className} text-2xl w-13 h-13 text-center leading-13`}>🌎</div> */}
                <div className={`w-13 h-13 text-center leading-13 flex items-center justify-center active:scale-90 transition-all`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden ring-[1.8px] ring-[var(--color-front)] cursor-pointer group">
                        <div className="flex h-6 animate-[map-scroll_800ms_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running] ml-[-5px]">
                            <div className="shrink-0 w-[50px] h-6"><TinyMap /></div>
                            <div className="shrink-0 w-[50px] h-6"><TinyMap /></div>
                        </div>
                    </div>
                </div>
                <Link href="/" className={`${styles.title} ${syncopate.className} font-black text-3xl my-2 flex`}>
                    <span>R</span><span>E</span><span>C</span><span>C</span><span>S</span>
                </Link>
                <button className={`text-4xl w-13 h-13 text-center leading-13 cursor-pointer ${showWidget ? "transform rotate-45" : ""} transition-all font-light hover:opacity-80 active:scale-90`} onClick={() => setShowWidget(!showWidget)}>＋</button>
            </div>
            <div className={`w-full border-b-2 border-solid border-[var(--color-front)] ${showWidget ? "max-h-10" : "max-h-0 mt-[-2px]"} transition-[max-height]`}>
                <div className={`flex justify-between px-1 h-8 transition-opacity ${showWidget ? "" : "opacity-0 pointer-events-none flex-wrap"}`}>
                    <div className="m-1 items-center sm:gap-10 gap-4 flex">
                        {isDark
                        ? <div className="sm:after:content-['dark'] sm:hover:after:content-['light'] sm:hover:italic cursor-pointer" onClick={() => setIsDark(!isDark)}><span className="align-[2px]">{colonVisible ? "◒" : "◓"}</span> </div>
                        : <div className="sm:after:content-['light'] sm:hover:after:content-['dark'] sm:hover:italic cursor-pointer" onClick={() => setIsDark(!isDark)}><span className="align-[2px]">{colonVisible ? "◐" : "◑"}</span> </div>
                        }
                        {isOffline
                        ? <div className="sm:after:content-['offline'] sm:hover:after:content-['online'] sm:hover:italic cursor-pointer" onClick={() => setIsOffline(!isOffline)}><span className="align-[2px]">{colonVisible ? "○" : "∅"}</span> </div>
                        : <div className="sm:after:content-['online'] sm:hover:after:content-['offline'] sm:hover:italic cursor-pointer" onClick={() => setIsOffline(!isOffline)}><span className="align-[2px]">{colonVisible ? "⦾" : "⦿"}</span> </div>
                        }
                    </div>
                    <div className="relative m-1 flex items-center shrink-0 " onMouseLeave={() => setCalDropdown(false)}>
                        <span className="bg-[var(--color-front)] text-[var(--color-back)] px-2" suppressHydrationWarning>{date} {colonVisible ? time : time.replace(':', ' ')}</span>
                        <button className="w-6 h-6 inline-block ring-1 ring-inset ring-[var(--color-front)] text-center cursor-pointer active:bg-[var(--color-mid)]" onClick={() => setCalDropdown(!calDropdown)}>
                            <span className={`inline-block transform text-4xl leading-[0] ${!calDropdown ? "rotate-0 align-[0.5em]" : "rotate-180 align-[-0.5em]"}`}>{"⌄"}</span>
                        </button>
                        <ul className={`absolute w-full max-w-full min-h-7 max-h-36 overflow-y-scroll left-0 top-6 bg-[var(--color-back)] ring-1 ring-inset ring-[var(--color-front)] ${calDropdown ? "" : "hidden"} z-50`}>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Calendar (Gregorian)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)] font-bold"><i>Tonalpohualli (Aztec)</i></li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Al-hijrī (Islamic)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Maramataka (Māori)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Cokv-walv (Cahokian)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Bôṅgābdô (Bengali)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Intihuantana (Andean)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Nónglì (Chinese)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Ọ̀gụ́àfọ̀ (Igbo)</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] p-1 flex gap-6 sm:gap-8 items-center justify-center">
                {navLinks.map(itm => (
                    <ColorLink 
                        to={`/${itm.id}`} 
                        text={itm.id} 
                        c={itm.color} 
                        caps={true} 
                        bold={(pathname===`/${itm.id}` || collections.filter(coll => coll.type===itm.id).map(coll => coll.id).includes(pathname.slice(5,8)) )} 
                        key={`${itm.id}_nav`} 
                    />
                ))}
                {/* <Link href="/" className={`${styles.navLink} bg-[var(--color-front)] text-[var(--color-back)] px-1`}>SUBMISSIONS</Link> */}
            </div>
            
            
        </div>
    )
}