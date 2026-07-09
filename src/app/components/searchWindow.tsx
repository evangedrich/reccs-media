"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Recc } from "../types/recc";
import Link from "next/link";
import Image from "next/image";
import LoadingIcon from "./loading";
import { posterUrl } from "../lib/images";
import { getTitle } from "../functions/text";
import { subregions } from "../lib/subregions";
import { searchTypes, filterTypes } from "../functions/search";
import FilterItems from "./filterItems";
import { checkFont } from "../functions/text";

const filterKeys = ["people","language","religion","location"];
const parseFilters = (params: URLSearchParams) => {
    const f: Record<string,string[]> = {};
    filterKeys.forEach(key => { const vals = params.getAll(key); if (vals.length) { f[key] = vals; } });
    return f;
};

export default function SearchWindow ({ reccs }: { reccs: Recc[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [input,setInput] = useState(searchParams.get("q") ?? "");
    const [filters,setFilters] = useState<Record<string,string[]>>(parseFilters(searchParams));
    const [searchType,setSearchType] = useState(searchTypes[0].type);
    const [filtersOpen,setFiltersOpen] = useState(false);
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.currentTarget.value); };
    // Sync URL -> state so navigating to a new query on the same page updates the view
    useEffect(() => {
        setInput(searchParams.get("q") ?? "");
        setFilters(parseFilters(searchParams));
    },[searchParams]);
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (input==="") {params.delete("q");} else {params.set("q",input);}
        filterKeys.forEach(key => {
            params.delete(key);
            (filters[key] ?? []).forEach(v => params.append(key,v));
        });
        const qs = params.toString();
        if (qs !== searchParams.toString()) {
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }
    },[input,filters,searchParams,router,pathname]);
    const filteredEntries = reccs.filter(entry =>
        searchTypes.find(itm => itm.type===searchType)?.check(input,entry)
        && Object.entries(filters).every(([type,values]) =>
            values.length===0 ||
            ((entry.group[type as keyof Recc["group"]] ?? "").split("/").map(v => v.trim())
                .some(v => values.includes(v)))
        )
    );
    const filteredSearchTypes = searchTypes.filter(itm => itm.type!==searchType);
    const languages = filterTypes[0].get(reccs,"language");
    const peoples = filterTypes[0].get(reccs,"people");
    const religions = filterTypes[0].get(reccs,"religion");
    const locations = filterTypes[0].get(reccs,"location");
    return (
        <div className="flex h-full grow justify-center min-h-0 max-sm:flex-wrap max-sm:content-start">
            <div className="w-80 p-4 sm:border-r-2 flex flex-col gap-1 max-sm:w-full max-sm:h-fit max-sm:border-b-2 max-sm:sticky max-sm:transition-[top] max-sm:top-[var(--header-h)] max-sm:self-start max-sm:z-20 max-sm:bg-[var(--color-back)] sm:max-h-[calc(100%)]">
                <form onSubmit={e => e.preventDefault()}>
                    <div className="w-full border-b-2 flex">
                        <input 
                            name={searchType}
                            type="text"
                            value={input}
                            onChange={handleTyping}
                            className="grow outline-none caret-[var(--color-front)] px-1"
                        />
                        <button className={`${input===""?"hidden":""} text-md font-light w-4 h-5 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-90 text-sm`} onClick={() => setInput("")}>✕</button>
                    </div>
                </form>
                <div className="flex justify-between text-sm">
                    <div className="flex"><div className="inline-block">search by&nbsp;</div>
                    <div className="relative inline-block cursor-pointer font-extrabold group sm:mb-2">
                        <span onClick={(() => setSearchType(searchTypes[searchTypes.findIndex(itm => itm.type===searchType)+1]?.type??searchTypes[0].type))}>{searchType}<span className={`relative top-[-1px] inline-block rotate-180`}>⌃</span></span>
                        <ul className="absolute z-20 border-1 sm:group-hover:block hidden -ml-2 bg-[var(--color-back)]">
                            {filteredSearchTypes.map((itm,i) => (
                                <li onClick={() => setSearchType(itm.type)} key={`li${itm.type}`} className={`px-2 py-1 ${i<filteredSearchTypes.length-1?"border-b-1":""} hover:bg-[var(--color-mid)]/75 active:bg-[var(--color-mid)]`}>{itm.type}</li>
                            ))}
                        </ul>
                    </div></div>
                    <div className={`font-extrabold sm:hidden`} onClick={() => setFiltersOpen(!filtersOpen)}><span className="relative -top-[1.5px] mr-[4px]">{filtersOpen?"✕":"☰"}</span>filters</div>
                </div>
                <div className={`max-sm:z-30 max-sm:p-4 overflow-hidden sm:grow flex flex-col min-h-0 bg-[var(--color-back)] max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:h-[calc(100%_-_var(--header-h)_-_84px_+_2px)] max-sm:transition-[translate,height] duration-[250ms,150ms] max-sm:overflow-y-auto max-sm:border-t-2 max-sm:z-20 max-sm:min-h-60 ${filtersOpen?"max-sm:translate-y-0":"max-sm:translate-y-full"}`}>
                    <div className="flex justify-between">
                        <div className="text-sm max-sm:mb-2">filter by</div>
                        <button className={`text-sm cursor-pointer hover:opacity-80 active:scale-90 relative -top-[6px] font-bold ${Object.keys(filters).length===0 ? "hidden" : ""}`} onClick={() => setFilters({})}>ᴄʟᴇᴀʀ ᴀʟʟ</button>
                    </div>
                    <div className="overflow-hidden flex flex-col flex-1 min-h-0 max-sm:gap-2">
                        <FilterItems label="language" items={languages} filters={filters} setFilters={setFilters} />
                        <FilterItems label="people" items={peoples} filters={filters} setFilters={setFilters} />
                        <FilterItems label="location" items={locations} filters={filters} setFilters={setFilters} />
                        <FilterItems label="religion" items={religions} filters={filters} setFilters={setFilters} />
                    </div>
                </div>
            </div>
            <div className="w-full sm:max-h-[calc(100vh_-_var(--header-h)_-_126px_+_2px)] sm:min-h-100 sm:overflow-y-auto overflow-x-clip overscroll-none">
                <div className="grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] content-start w-[calc(100%+2px)]">
                {filteredEntries.map((entry) => (
                    <Link key={`card${entry.id}`} href={`/${entry.id}`} className={`sm:p-4 p-3 border-r-2 border-b-2 hover:bg-[var(--color-mid)]/75 active:opacity-90 group flex flex-col gap-2`}>
                        <div className="relative w-full aspect-3/4 bg-[var(--color-mid)] group-hover:opacity-90">
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center"><LoadingIcon /></div>
                            <Image src={posterUrl(entry.id)} alt="Media Image" width="300" height="400" className="absolute top-0 left-0 w-full" unoptimized />
                        </div>
                        <h3 className="sm:text-[0.65rem] text-[0.55rem] leading-none truncate opacity-60">{subregions.find(subr => subr.id===entry.id.slice(0,4))?.name.replace(" North "," N ").replace(" South "," S ").replace(" Southeast "," SE ")}</h3>
                        <h2 className={`${checkFont(getTitle(entry))} sm:text-[0.9rem] text-[0.8rem] font-semibold leading-[1.7em] my-[-0.35em] truncate`}><span className={`${checkFont(getTitle(entry))}`}>{getTitle(entry)}</span></h2>
                    </Link>
                ))}
                </div>
            </div>
        </div>
    )
}