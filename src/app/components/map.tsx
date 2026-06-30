import styles from '@/app/ui/main.module.css';
import { Dispatch, SetStateAction } from 'react';
import { regionPolygons, regionDots, contourData, allContours } from '../lib/mapPaths';
import { regions } from '../lib/subregions';

/* THESE TWO MAPS ARE FOR THE HOME PAGE DOT MAP */
export function HoverMap({ currSubr, setCurrSubr, setHovered }: { currSubr: string, setCurrSubr: Dispatch<SetStateAction<string>>, setHovered: Dispatch<SetStateAction<string>>  }) {
    return (
        <svg viewBox="0 0 1440 720" xmlns="http://www.w3.org/2000/svg">
            {regionPolygons.map(itm => (
                <path 
                    key={`hm_${itm.id}`} 
                    onClick={() => setCurrSubr(currSubr===itm.id ? "X" : itm.id)} 
                    onMouseEnter={() => setHovered(itm.id)} 
                    onMouseLeave={() => setHovered("X")} 
                    fill={itm.color} 
                    fillOpacity="0.25" 
                    stroke={itm.color} 
                    strokeWidth="0" 
                    strokeLinejoin="round" 
                    d={itm.d} 
                />
            ))}
        </svg>
    )
}
export default function Map({ focusID }: { focusID?: string }) {
    return (
        <svg viewBox="0 0 1440 720" xmlns="http://www.w3.org/2000/svg">
            {regionDots.map(region => (
                <path
                    key={`m_${region.id}`}
                    id={region.id}
                    d={region.d}
                    fill={region.fill}
                    className={focusID === region.id ? styles.flash : ""}
                />
            ))}
        </svg>
    )
}

/* THESE MAPS ARE FOR THE REGIONS PAGE */
export function ContourMap({ mapID, currSubrID, setCurrSubrID, hovered, setHovered }: { mapID: string; currSubrID: string|null; setCurrSubrID: Dispatch<SetStateAction<string|null>>; hovered: string|null; setHovered: Dispatch<SetStateAction<string|null>>; }) {
    const mapData = contourData.find(itm => itm.id===mapID);
    const ocmd = contourData.find(itm => itm.id==="OCMD");
    return (
        <svg viewBox={mapData?.viewBox} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className={styles.contourMap}>
            {mapData?.data.map(itm => (
                <path 
                    key={`contour_${itm.id}`} 
                    onClick={() => setCurrSubrID(itm.id===currSubrID?null:itm.id)}
                    onMouseEnter={() => setHovered(itm.id)} 
                    onMouseLeave={() => setHovered(null)} 
                    d={itm.d} 
                    stroke="var(--color-front)" 
                    strokeWidth={mapData?.stroke} 
                    fill={itm.id===currSubrID ? itm.color : "var(--color-mid)"} 
                    className={`${itm.id===hovered&&itm.id!==currSubrID ? "sm:[fill-opacity:0.75] [fill-opacity:0]" : itm.id===currSubrID ? "[fill-opacity:0.25]" : "[fill-opacity:0]"}`}
                />
            ))}
            {mapID==="oceania"
            ? <svg x="425.95" y="415" width="70" height="70" viewBox="744.9 399.8 70 70" xmlns="http://www.w3.org/2000/svg" style={{padding:"10px",backgroundColor:"red"}}>
                <rect x="748.9" y="400.8" width="65" height="65" stroke="var(--color-front)" strokeWidth="1.6" fill="transparent" strokeDasharray="0, 4.65" strokeLinecap="round" />
                <path 
                    onClick={() => setCurrSubrID("OCMD"===currSubrID?null:"OCMD")}
                    onMouseEnter={() => setHovered("OCMD")} 
                    onMouseLeave={() => setHovered(null)} 
                    d={ocmd?.data[0].d} 
                    stroke="var(--color-front)" 
                    strokeWidth={ocmd?.stroke} 
                    fill={"OCMD"===currSubrID ? ocmd?.data[0].color : "var(--color-mid)"} 
                    className={`${"OCMD"===hovered&&"OCMD"!==currSubrID ? "sm:[fill-opacity:0.75] [fill-opacity:0]" : "OCMD"===currSubrID ? "[fill-opacity:0.25]" : "[fill-opacity:0]"}`}
                />
            </svg>
            : <></>}
        </svg>
    )
}
export function FullContourMap({ mapID, currSubrID, setCurrSubrID, hovered, setHovered }: { mapID: string; currSubrID: string|null; setCurrSubrID: Dispatch<SetStateAction<string|null>>; hovered: string|null; setHovered: Dispatch<SetStateAction<string|null>>; }) {
    const mapData = contourData.find(itm => itm.id===mapID);
    const isRegion = (x: string) => { return regions.find(reg => reg.id===mapID)?.code?.includes(x.slice(0,2).toUpperCase()) };
    return (
        <svg viewBox="5.01 50.78 1235.27 525.86" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {allContours.map(itm => (
                <path 
                    key={`contour_${itm.id}`} 
                    onClick={() => isRegion(itm.id) ? setCurrSubrID(itm.id===currSubrID?null:itm.id) : null}
                    onMouseEnter={() => setHovered(itm.id)} 
                    onMouseLeave={() => setHovered(null)} 
                    d={itm.d} 
                    stroke={isRegion(itm.id) ? "var(--color-front)" : "gray"} 
                    strokeWidth={1.8} 
                    fill={itm.id===currSubrID ? itm.color : "var(--color-mid)"} 
                    className={`${itm.id===hovered && itm.id!==currSubrID && isRegion(itm.id) ? "sm:[fill-opacity:0.75] [fill-opacity:0]" : itm.id===currSubrID ? "[fill-opacity:0.25]" : "[fill-opacity:0]"} ${isRegion(itm.id) ? "cursor-pointer" : ""}`}
                />
            ))}
        </svg>
    )
}