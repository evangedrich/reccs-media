'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/app/ui/main.module.css";
import { syncopate, notoEmoji } from "@/app/fonts/fonts";

function NavLink({ to, n }: { to: string, n: number }) {
    const hoverColor = n===0 ? "hover:text-[var(--color-green)]" : n===1 ? "hover:text-[var(--color-orange)]" : n===2 ? "hover:text-[var(--color-red)]" : "hover:text-[var(--color-purple)]";
    return (
        <Link href="/" className={`${hoverColor} hover:font-bold`}>{to}</Link>
    )
}

export default function Header() {
    const [showWidget, setShowWidget] = useState(false);
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
                <div className={`${notoEmoji.className} text-2xl w-13 h-13 text-center leading-13`}>🌎</div>
                <Link href="/" className={`${styles.title} ${syncopate.className} font-black text-3xl my-2 flex`}>
                    <span>R</span><span>E</span><span>C</span><span>C</span><span>S</span>
                </Link>
                <button className={`text-4xl w-13 h-13 text-center leading-13 cursor-pointer ${showWidget ? "" : "transform rotate-45"} transition-all`} onClick={() => setShowWidget(!showWidget)}>＋</button>
            </div>
            <div className={`w-full ${showWidget ? "h-0 mt-[-2px]" : "h-9"} overflow-hidden border-b-2 border-solid border-[var(--color-front)] flex justify-between transition-[height] px-2`}>
                <div className="m-1">
                    dark mode
                </div>
                <div className="m-1 flex items-center">
                    date&nbsp;<span className="bg-[var(--color-front)] text-[var(--color-back)] px-1" suppressHydrationWarning>12 Itzcuintli {colonVisible ? time : time.replace(':', ' ')}</span>
                    <button className="w-6 h-6 inline-block ring-1 ring-inset ring-[var(--color-front)] text-center cursor-pointer" onClick={() => setCalDropdown(!calDropdown)}>
                        <span className={`inline-block transform text-4xl leading-[0] ${!calDropdown ? "rotate-0 align-[0.5em]" : "rotate-180 align-[-0.5em]"}`}>{"⌄"}</span>
                    </button>
                </div>
            </div>
            <div className="w-full border-b-2 border-solid border-[var(--color-front)] p-1 flex gap-8 items-center justify-center">
                <NavLink to="LITERATURE" n={0} />
                <NavLink to="CINEMA" n={1} />
                <NavLink to="THEATRE" n={2} />
                <NavLink to="SYSTEMS" n={3} />
                {/* <Link href="/" className={`${styles.navLink} bg-[var(--color-front)] text-[var(--color-back)] px-1`}>SUBMISSIONS</Link> */}
            </div>
            
            
        </div>
    )
}