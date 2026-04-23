'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import ColorLink from "./colorLink";
import TinyMap from "./tinyMap";
import styles from "@/app/ui/main.module.css";
import { syncopate, notoEmoji } from "@/app/fonts/fonts";

export default function Header() {
    const [showWidget, setShowWidget] = useState(false);
    const [date, setDate] = useState("12 Itzcuintli");
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [colonVisible, setColonVisible] = useState(true);
    const [calDropdown, setCalDropdown] = useState(false);
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setColonVisible(v => !v);
        }, 500);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="w-full">
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] flex items-center justify-between overflow-hidden">
                {/* <div className={`${notoEmoji.className} text-2xl w-13 h-13 text-center leading-13`}>🌎</div> */}
                <div className={`w-13 h-13 text-center leading-13 flex items-center justify-center`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden ring-[1.8px] ring-[var(--color-front)] cursor-pointer group">
                        <div className="flex h-6 animate-[map-scroll_1s_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running] ml-[-5px]">
                            <div className="shrink-0 w-[50px] h-6"><TinyMap /></div>
                            <div className="shrink-0 w-[50px] h-6"><TinyMap /></div>
                        </div>
                    </div>
                </div>
                <Link href="/" className={`${styles.title} ${syncopate.className} font-black text-3xl my-2 flex`}>
                    <span>R</span><span>E</span><span>C</span><span>C</span><span>S</span>
                </Link>
                <button className={`text-4xl w-13 h-13 text-center leading-13 cursor-pointer ${showWidget ? "transform rotate-45" : ""} transition-all font-light hover:opacity-80`} onClick={() => setShowWidget(!showWidget)}>＋</button>
            </div>
            <div className={`w-full border-b-2 border-solid border-[var(--color-front)] ${showWidget ? "max-h-10" : "max-h-0 mt-[-2px]"} transition-[max-height]`}>
                <div className={`flex justify-between px-1 h-8 transition-opacity ${showWidget ? "" : "opacity-0 pointer-events-none"}`}>
                    <div className="m-1 flex items-center">
                        light/<b className="font-extrabold">dark</b>
                    </div>
                    <div className="relative m-1 flex items-center" onMouseLeave={() => setCalDropdown(false)}>
                        <span className="bg-[var(--color-front)] text-[var(--color-back)] px-2" suppressHydrationWarning>{date} {colonVisible ? time : time.replace(':', ' ')}</span>
                        <button className="w-6 h-6 inline-block ring-1 ring-inset ring-[var(--color-front)] text-center cursor-pointer" onClick={() => setCalDropdown(!calDropdown)}>
                            <span className={`inline-block transform text-4xl leading-[0] ${!calDropdown ? "rotate-0 align-[0.5em]" : "rotate-180 align-[-0.5em]"}`}>{"⌄"}</span>
                        </button>
                        <ul className={`absolute w-full max-w-full min-h-7 max-h-36 overflow-y-scroll left-0 top-6 bg-[var(--color-back)] ring-1 ring-inset ring-[var(--color-front)] ${calDropdown ? "" : "hidden"}`}>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Calendarium (Gregorian)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)] font-bold"><i>Tonalpohualli (Aztec)</i></li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Al-hijrī (Islamic)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Maramataka (Māori)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Cokv-walv (Cahokian)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Bôṅgābdô (Bengali)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Intihuantana (Andean)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Nónglì (Chinese)</li>
                            <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">ǁKhâgu kurib digu (Khoi)</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] p-1 flex gap-8 items-center justify-center">
                <ColorLink to="LITERATURE" n="g" />
                <ColorLink to="CINEMA" n="o" />
                <ColorLink to="THEATRE" n="r" />
                <ColorLink to="SYSTEMS" n="p" />
                {/* <Link href="/" className={`${styles.navLink} bg-[var(--color-front)] text-[var(--color-back)] px-1`}>SUBMISSIONS</Link> */}
            </div>
            
            
        </div>
    )
}