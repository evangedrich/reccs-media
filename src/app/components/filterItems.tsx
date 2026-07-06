import { useState, useRef, Dispatch, SetStateAction } from "react";
import { subregions } from "../lib/subregions";

type Filters = Record<string,string[]>;
type SetFilters = Dispatch<SetStateAction<Filters>>;

function MarkableItem ({ text, label, selected, setFilters }: { text: string, label: string, selected: string[], setFilters: SetFilters }) {
    const ticked = selected.includes(text);
    const toggle = () => {
        setFilters((prev: Filters) => {
            const current = prev[label] ?? [];
            return { ...prev, [label]: current.includes(text) ? current.filter(t => t!==text) : [...current, text] };
        });
    };
    return (
        <li onClick={toggle} className="cursor-pointer w-fit select-none">
            <span className={`inline-block w-[6px] h-[6px] relative ml-[1px] -top-[2px] border-1 border-[var(--color-front)] ${ticked?"bg-[var(--color-front)]":""}`}></span>
            &nbsp;{text}
        </li>
    )
}

export default function FilterItems ({ label, items, filters, setFilters }: { label: string, items: Record<string,string[]>, filters: Filters, setFilters: SetFilters }) {
    const [isOpen,setIsOpen] = useState(false);
    const [isSorted,setIsSorted] = useState(true);
    const listRef = useRef<HTMLUListElement>(null);
    const selected = filters[label] ?? [];
    const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
    return (
        <div className={`sm:text-sm flex flex-col overflow-hidden min-h-0 transition-[flex-grow] duration-200 ease-out ${isOpen?"grow":"grow-0"}`} onMouseEnter={() =>{ if (!canHover()) return; setIsOpen(!isOpen); if (listRef.current) { listRef.current.scrollTo({ top: 0 }); } }} onMouseLeave={() => { if (canHover()) setIsOpen(false); }} >
            <div className="font-extrabold flex justify-between items-center">
                <div onClick={() => { setIsOpen(!isOpen); if (listRef.current) { listRef.current.scrollTo({ top: 0 }); } }} className="cursor-pointer">
                    {label}<span className={`relative inline-block ${isOpen?"":"rotate-180 top-[-1px]"}`}>⌃</span>
                </div>
                <div className="flex gap-1">
                    <button title="Sort" onClick={() => setIsSorted(!isSorted)} className={`${isSorted?"":"opacity-50"} cursor-pointer text-xs`}>A</button>
                </div>
            </div>
            <ul className={`overflow-y-auto overflow-x-hidden grow basis-0 min-h-0 ${isOpen?"mb-2":""}`} ref={listRef}>
                {isSorted ? Object.entries(items)
                    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                    .map(([key,val]) => (
                    <div key={`filterFor${key}`}>
                        <span className="text-[0.65rem] opacity-50">{subregions.find(subr => subr.id===key)?.name}</span>
                        {val.map((itm,i) => (
                            <MarkableItem key={`itm${i}`} text={itm} label={label} selected={selected} setFilters={setFilters} />
                        ))}
                    </div>
                )) : [...new Set(Object.values(Object.values(items)).flat(Infinity))].sort().map((itm,i) => (
                    <MarkableItem key={`itm${i}`} text={itm as string} label={label} selected={selected} setFilters={setFilters} />
                ))}
            </ul>
        </div>
    )
}