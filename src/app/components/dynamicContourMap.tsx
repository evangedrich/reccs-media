import { Dispatch, SetStateAction, useMemo } from 'react';
import { allContours } from '../lib/mapPaths';
import { regions } from '../lib/subregions';
import { buildDynamicMap } from '../lib/contourProjection';

// Greenwich-centered full-world view, identical to <FullContourMap />.
const FULL_VIEWBOX = "5.01 50.78 1235.27 525.86";
const FULL_STROKE = 1.8;

// Same inputs and interaction as <FullContourMap />: highlight on hover, fill on
// select, clicks only on subregions belonging to mapID. The difference: once a
// subregion is selected the map recenters its central meridian on the active region
// (mapID) and crops to a tight square around it.
export function DynamicContourMap({ mapID, currSubrID, setCurrSubrID, hovered, setHovered }: { mapID: string; currSubrID: string|null; setCurrSubrID: Dispatch<SetStateAction<string|null>>; hovered: string|null; setHovered: Dispatch<SetStateAction<string|null>>; }) {
    const isRegion = (x: string) => { return regions.find(reg => reg.id===mapID)?.code?.includes(x.slice(0,2).toUpperCase()) };
    // Recenter only matters per-region, so this recomputes on mapID / selected-state
    // changes, not on every subregion click.
    const selected = currSubrID !== null;
    const { contours, viewBox, stroke } = useMemo(
        () => selected
            ? buildDynamicMap(mapID)
            : { contours: allContours, viewBox: FULL_VIEWBOX, stroke: FULL_STROKE },
        [mapID, selected]
    );
    return (
        <svg viewBox={viewBox} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {contours.map(itm => (
                <path
                    key={`contour_${itm.id}`}
                    onClick={() => isRegion(itm.id) ? setCurrSubrID(itm.id===currSubrID?null:itm.id) : null}
                    onMouseEnter={() => setHovered(itm.id)}
                    onMouseLeave={() => setHovered(null)}
                    d={itm.d}
                    stroke={isRegion(itm.id) ? "var(--color-front)" : "gray"}
                    strokeWidth={currSubrID ? stroke*2.1 : stroke}
                    fill={itm.id===currSubrID ? itm.color : "var(--color-mid)"}
                    className={`${itm.id===hovered && itm.id!==currSubrID && isRegion(itm.id) ? "sm:[fill-opacity:0.75] [fill-opacity:0]" : itm.id===currSubrID ? "[fill-opacity:0.25]" : "[fill-opacity:0]"} ${isRegion(itm.id) ? "cursor-pointer" : ""}`}
                />
            ))}
        </svg>
    )
}
