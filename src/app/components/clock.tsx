import { useState } from "react";
import { calendars } from "../functions/calendars";

export default function Clock ({ date, time, colonVisible }: { date: Date, time: string, colonVisible: boolean }) {
    const [calDropdown, setCalDropdown] = useState(false);
    const [calSelection, setCalSelection] = useState("EUWE");
    const [calIsRoman, setCalIsRoman] = useState(true);
    const [calIsTrans, setCalIsTrans] = useState(false);
    const [calIsShort, setCalIsShort] = useState(false);
    const dateObj = calendars.find(cal => cal.id===calSelection)?.function(date);
    return (
        <div className="relative m-1 flex items-center shrink-0 " onMouseLeave={() => setCalDropdown(false)}>
            <div className="bg-[var(--color-front)] text-[var(--color-back)] px-2 cursor-pointer flex" suppressHydrationWarning onClick={() => setCalDropdown(!calDropdown)}>
                <span className="inline-block max-sm:max-w-[12rem] truncate">
                    {(calIsRoman && !calIsTrans && dateObj && "transliteration" in dateObj) 
                    ? <>{dateObj?.transliteration}</> 
                    : (calIsTrans && dateObj && "translation" in dateObj)
                    ? <>{dateObj?.translation}</> 
                    : dateObj?.original 
                    ?? date.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    }
                </span>
                &nbsp;{colonVisible ? time : time.replace(':', ' ')}
            </div>
            <button className="w-6 h-6 inline-block ring-1 ring-inset ring-[var(--color-front)] text-center cursor-pointer active:bg-[var(--color-mid)] group overflow-hidden" onClick={() => setCalDropdown(!calDropdown)}>
                <span className={`inline-block transform text-4xl leading-[0] ${!calDropdown ? "rotate-0 align-[0.5em]" : "rotate-180 align-[-0.5em]"} group-hover:opacity-85`}>{"⌄"}</span>
            </button>
            <div className={`absolute w-full max-w-full min-h-7 max-h-56 overflow-y-scroll overscroll-y-none left-0 top-6 bg-[var(--color-back)] ring-1 ring-inset ring-[var(--color-front)] ${calDropdown ? "" : "hidden"} z-50`}>
                <div className="relative border-1 border-y-0">
                    <div className="sticky top-0 w-full flex justify-around p-2 bg-[var(--color-back)] z-60">
                        <div className="flex flex-col items-center cursor-pointer opacity-75 hover:opacity-100" onClick={() => setCalIsRoman(!calIsRoman)}>
                            <div className="uppercase text-[0.5rem] mb-[1px]">Romanize</div>
                            <button className="rounded-full w-7 h-4 border-2 bg-[var(--color-front)] cursor-pointer">
                                <div className={`rounded-full w-3 h-3 bg-[var(--color-back)] ${calIsRoman ? "ml-3" : "left-0"} transition-[margin-left]`}></div>
                            </button>
                        </div>
                        <div className="flex flex-col items-center cursor-pointer opacity-75 hover:opacity-100" onClick={() => setCalIsTrans(!calIsTrans)}>
                            <div className="uppercase text-[0.5rem] mb-[1px]">Translate</div>
                            <button className="rounded-full w-7 h-4 border-2 bg-[var(--color-front)] cursor-pointer">
                                <div className={`rounded-full w-3 h-3 bg-[var(--color-back)] ${calIsTrans ? "ml-3" : "left-0"} transition-[margin-left]`}></div>
                            </button>
                        </div>
                        <div className="flex flex-col items-center cursor-pointer opacity-75 hover:opacity-100" onClick={() => setCalIsShort(!calIsShort)}>
                            <div className="uppercase text-[0.5rem] mb-[1px]">Shorten</div>
                            <button className="rounded-full w-7 h-4 border-2 bg-[var(--color-front)] cursor-pointer">
                                <div className={`rounded-full w-3 h-3 bg-[var(--color-back)] ${calIsShort ? "ml-3" : "left-0"} transition-[margin-left]`}></div>
                            </button>
                        </div>
                    </div>
                    {calendars.map(cal => (
                        <div key={`select_${cal.id}`} className={`p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)] leading-none py-2`} onClick={() => { setCalSelection(cal.id); setCalDropdown(false); }}>
                            <span className={`${cal.id===calSelection?"font-extrabold":""} text-sm`}>
                                {(calIsTrans && !calIsRoman && ("reverseTransliteration" in cal.name)) 
                                ? cal.name.reverseTransliteration
                                : (calIsTrans && ("translation" in cal.name)) 
                                ? cal.name.translation 
                                : (calIsRoman && ("transliteration" in cal.name))
                                ? cal.name.transliteration 
                                : cal.name.original}
                            </span>
                            <span className="block opacity-50 text-[0.7rem] uppercase mt-1">{cal.group}</span>
                        </div>
                    ))}
                </div>
                {/* <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Calendar (Gregorian)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)] font-bold"><i>Tonalpohualli (Aztec)</i></li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Al-taqwīm (Islamic)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Maramataka (Māori)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Cokv-walv (Cahokian)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Bôṅgābdô (Bengali)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Intihuantana (Andean)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Nónglì (Chinese)</li>
                <li className="p-1 pl-2 cursor-pointer hover:bg-[var(--color-mid)]">Ọ̀gụ́àfọ̀ (Igbo)</li> */}
            </div>
        </div>
    )
};