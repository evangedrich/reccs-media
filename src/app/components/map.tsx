import styles from '@/app/ui/main.module.css';
import { Dispatch, SetStateAction } from 'react';
import { regionPolygons, regionDots, allContours, contourData } from '../lib/mapPaths';

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
                    fill={itm.color} 
                    fillOpacity={itm.id===currSubrID||itm.id===hovered ? "0.25" : "0"} 
                    className={currSubrID===itm.id ? styles.selectedConMap : ""} 
                />
            ))}
        </svg>
    )
}