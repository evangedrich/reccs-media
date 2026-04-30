import styles from '@/app/ui/main.module.css';
import { Dispatch, SetStateAction } from 'react';
import { regionPolygons, regionDots } from '../lib/mapPaths';

export function HoverMap({ currSubr, setCurrSubr, setHovered }: { currSubr: string, setCurrSubr: Dispatch<SetStateAction<string>>, setHovered: Dispatch<SetStateAction<string>>  }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 720">
            {regionPolygons.map(itm => (
                <path key={`hm_${itm.id}`} onClick={() => setCurrSubr(itm.id)} onMouseEnter={() => setHovered(itm.id)} onMouseLeave={() => setHovered("X")} fill={itm.color} fillOpacity="0.25" stroke={itm.color} strokeWidth="0" strokeLinejoin="round" d={itm.d} />
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
