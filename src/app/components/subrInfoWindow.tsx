import { Dispatch, SetStateAction } from "react";
import { subregions } from "../lib/subregions";

export default function SubrInfoWindow({ currSubr, setCurrSubr, hoveredSubr }: { currSubr: string, setCurrSubr: Dispatch<SetStateAction<string>>, hoveredSubr: string | undefined  }) {
    return (
        <div className={`${currSubr==="X"&&!hoveredSubr?"opacity-0":""} absolute top-0 left-0 border-2 m-0 hidden sm:flex flex-col text-xs bg-[var(--color-back)]`}>
            <div className="flex justify-between">
                <div className="p-1 px-2">
                    {currSubr==="X"
                ? <span>{!hoveredSubr ? <i>select region</i> : <b>{hoveredSubr}</b>}</span>
                : <span><b>{subregions.find(subr => subr.id===currSubr)?.name}</b></span>}
                </div>
                <div className={`${currSubr==="X"?"hidden":""} w-[2em] h-[2em] leading-[2em] flex items-center justify-center border-l-2 cursor-pointer hover:bg-[var(--color-mid)]`} onClick={() => setCurrSubr("X")}>Ｘ</div>
            </div>
            <p className={`border-t-2 max-w-80 w-fit ${currSubr==="X"?"max-h-0 p-0":"max-h-40 px-2 pt-1 pb-2"} transition-[max-height] duration-200 overflow-hidden`}>{subregions.find(subr => subr.id===currSubr)?.description}</p>
        </div>
    )
}