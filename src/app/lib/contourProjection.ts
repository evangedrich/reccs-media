// Recenter the Robinson-projected contour map on an arbitrary region.
//
// The contour `d` paths in mapPaths.ts are already projected to flat SVG pixel
// coordinates (a Greenwich-centered Robinson projection) and carry no lon/lat.
// To shift the central meridian onto a chosen region we have to recover geographic
// coordinates, rotate longitude, and re-project. This module:
//   1. inverts the Robinson projection (pixel -> lon/lat),
//   2. re-projects with the active region's center as the new central meridian,
//   3. returns reprojected paths plus a tight square viewBox around that region.
//
// The Robinson AA/BB coefficient tables mirror those in globeGeometry.ts (kept local
// to avoid pulling in that module's mesh-building side effects on the regions page).
// The pixel placement of the contour coordinate system (center + scale) is unknown,
// so it is calibrated once at load by matching each region's contour centroid to the
// lon/lat centroid of the same region's dots (see CALIB below), and the x placement
// is then refined against the map's own antimeridian cut (see refineSeam below),
// which the centroid fit alone recovers a few percent too wide. Because forward and
// inverse use identical tables, forward(inverse(p)) === p exactly, so an unshifted
// map is reproduced perfectly and calibration error only lightly affects the shear
// applied when recentering distant regions.

import { regionDots, allContours } from "./mapPaths";
import { regions } from "./subregions";

// Standard Robinson coefficients, sampled every 5deg of latitude (0..90).
const AA = [
    1.0000, 0.9986, 0.9954, 0.9900, 0.9822, 0.9730, 0.9600, 0.9427,
    0.9216, 0.8962, 0.8679, 0.8350, 0.7986, 0.7597, 0.7186, 0.6732,
    0.6213, 0.5722, 0.5322,
];
const BB = [
    0.0000, 0.0620, 0.1240, 0.1860, 0.2480, 0.3100, 0.3720, 0.4340,
    0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936,
    0.9394, 0.9761, 1.0000,
];

function interpTable(table: number[], absLatDeg: number): number {
    const t = absLatDeg / 5;
    const i = Math.floor(t);
    if (i >= 18) return table[18];
    if (i < 0) return table[0];
    const frac = t - i;
    return table[i] * (1 - frac) + table[i + 1] * frac;
}

function bbSigned(latDeg: number): number {
    return Math.sign(latDeg) * interpTable(BB, Math.abs(latDeg));
}

function invertBB(target: number): number {
    const absTarget = Math.abs(target);
    let lo = 0, hi = 18;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (BB[mid] <= absTarget) lo = mid;
        else hi = mid;
    }
    const span = BB[hi] - BB[lo];
    const frac = span === 0 ? 0 : (absTarget - BB[lo]) / span;
    const absLat = (lo + frac) * 5;
    return Math.sign(target) * absLat;
}

function wrapLon(lon: number): number {
    return ((lon + 180) % 360 + 360) % 360 - 180;
}

// --- Dot-map Robinson inverse (parameters mirror globeGeometry.ts) ---------------
// Used only at calibration time to recover ground-truth lon/lat for each region.
const DOT_W = 1440;
const DOT_H = 720;
const DOT_X_SCALE = 1.014;
const DOT_Y_TOP = bbSigned(90);
const DOT_Y_BOT = bbSigned(-60);

function dotPixelToLonLat(px: number, py: number): [number, number] {
    const nx = (px - DOT_W / 2) / (DOT_W / 2 * DOT_X_SCALE);
    const ny = DOT_Y_TOP + (py / DOT_H) * (DOT_Y_BOT - DOT_Y_TOP);
    const latDeg = invertBB(ny);
    const a = interpTable(AA, Math.abs(latDeg));
    return [(nx / a) * 180, latDeg];
}

const DOT_RE = /M\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+m\s+-3,0\s+a\s+3,3/g;
function parseDots(d: string): [number, number][] {
    const out: [number, number][] = [];
    for (const m of d.matchAll(DOT_RE)) out.push([parseFloat(m[1]), parseFloat(m[2])]);
    return out;
}

// --- Contour path parsing (paths are M/L/Z polylines only) -----------------------
type PathCmd = { c: "M" | "L" | "Z"; x: number; y: number };

function parsePath(d: string): PathCmd[] {
    const out: PathCmd[] = [];
    const toks = d.match(/[MLZ][^MLZ]*/g) ?? [];
    for (const t of toks) {
        const c = t[0] as "M" | "L" | "Z";
        if (c === "Z") { out.push({ c, x: 0, y: 0 }); continue; }
        const [x, y] = t.slice(1).trim().split(",").map(parseFloat);
        out.push({ c, x, y });
    }
    return out;
}

// --- Calibrate the contour coordinate system's Robinson placement (run once) ------
// Solve px = CX + KX*X and py = CY - KY*Y by least squares, where X/Y are the
// normalized Robinson coordinates of each region's lon/lat centroid (from its dots)
// and (px,py) is the vertex centroid of its contour outline. Regions whose outline
// spans more than half the map width (antimeridian wrappers / very wide) are skipped
// so their split pixels don't bias the fit; they are still reprojected at runtime.
function calibrate(): { CX: number; KX: number; CY: number; KY: number } {
    const dotById = new Map(regionDots.map(r => [r.id, r.d]));
    const Xs: number[] = [], pxs: number[] = [], Ys: number[] = [], pys: number[] = [];
    for (const c of allContours) {
        const dd = dotById.get(c.id);
        if (!dd) continue;
        const dots = parseDots(dd);
        if (dots.length === 0) continue;
        // lon/lat centroid via mean unit vector (handles antimeridian correctly).
        let vx = 0, vy = 0, vz = 0;
        for (const [px, py] of dots) {
            const [lon, lat] = dotPixelToLonLat(px, py);
            const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180, cp = Math.cos(phi);
            vx += cp * Math.cos(lam); vy += Math.sin(phi); vz += cp * Math.sin(lam);
        }
        const lat = Math.asin(Math.max(-1, Math.min(1, vy / dots.length))) * 180 / Math.PI;
        const lon = Math.atan2(vz, vx) * 180 / Math.PI;
        // contour vertex centroid + x-span.
        let sx = 0, sy = 0, n = 0, minx = Infinity, maxx = -Infinity;
        for (const cmd of parsePath(c.d)) {
            if (cmd.c === "Z") continue;
            sx += cmd.x; sy += cmd.y; n++;
            if (cmd.x < minx) minx = cmd.x;
            if (cmd.x > maxx) maxx = cmd.x;
        }
        if (n === 0 || maxx - minx > 600) continue;
        Xs.push(interpTable(AA, Math.abs(lat)) * (lon / 180)); pxs.push(sx / n);
        Ys.push(bbSigned(lat)); pys.push(sy / n);
    }
    const fit = (xs: number[], ys: number[]) => {
        const k = xs.length;
        const mx = xs.reduce((a, b) => a + b, 0) / k, my = ys.reduce((a, b) => a + b, 0) / k;
        let sxy = 0, sxx = 0;
        for (let i = 0; i < k; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
        const slope = sxy / sxx;
        return { slope, intercept: my - slope * mx };
    };
    const fx = fit(Xs, pxs), fy = fit(Ys, pys);
    return { CX: fx.intercept, KX: fx.slope, CY: fy.intercept, KY: -fy.slope };
}

// --- Refine CX/KX against the antimeridian seam (run once) ------------------------
// The centroid fit recovers the x placement only to within a few percent, which is
// invisible mid-map but glaring at the edges: the halves of the antimeridian-split
// region (Chukotka + Wrangel Island in ASNO) inverted to lon ~±171 instead of ~±180,
// so on the globe the left-edge pieces stopped ~7° short of the Siberian mainland.
// The map data itself pins the x placement exactly: where the split halves are meant
// to meet, the drawing has a vertex at the same y on both edges (the drawn cut), and
// that pair satisfies xL = CX - KX*AA(lat(y)) and xR = CX + KX*AA(lat(y)). Detect
// those pairs — same-y vertices of one region spanning close to the full 360° width,
// where the left vertex is its ring's west extreme or the right vertex its ring's
// east extreme (a drawn cut line, not coastline) — then least-squares CX and KX.
function refineSeam(cal: { CX: number; KX: number; CY: number; KY: number }): { CX: number; KX: number } {
    const pairs: { a: number; xL: number; xR: number }[] = [];
    for (const c of allContours) {
        const rings = parseContourRings(c.d);
        const ringMin = rings.map(r => Math.min(...r.map(p => p[0])));
        const ringMax = rings.map(r => Math.max(...r.map(p => p[0])));
        const byY = new Map<number, { minX: number; minRing: number; maxX: number; maxRing: number }>();
        rings.forEach((ring, ri) => {
            for (const [x, y] of ring) {
                const e = byY.get(y);
                if (!e) byY.set(y, { minX: x, minRing: ri, maxX: x, maxRing: ri });
                else {
                    if (x < e.minX) { e.minX = x; e.minRing = ri; }
                    if (x > e.maxX) { e.maxX = x; e.maxRing = ri; }
                }
            }
        });
        for (const [y, e] of byY) {
            const lat = invertBB((cal.CY - y) / cal.KY);
            const a = interpTable(AA, Math.abs(lat));
            if (e.maxX - e.minX < 0.8 * 2 * cal.KX * a) continue;
            if (e.minX - ringMin[e.minRing] < 2.5 || ringMax[e.maxRing] - e.maxX < 2.5) {
                pairs.push({ a, xL: e.minX, xR: e.maxX });
            }
        }
    }
    if (pairs.length === 0) return cal;
    let sx = 0, sax = 0, saa = 0;
    for (const p of pairs) { sx += p.xL + p.xR; sax += p.a * (p.xR - p.xL); saa += 2 * p.a * p.a; }
    return { CX: sx / (2 * pairs.length), KX: sax / saa };
}

const CAL = calibrate();
const { CX, KX } = refineSeam(CAL);
const { CY, KY } = CAL;

// Parse a contour `d` (M/L/Z polylines) into its rings; each ring is the list of
// [px, py] vertices between an M and its closing Z (or the next M). Used by the
// globe geometry builder to drape and triangulate each ring on the sphere.
export function parseContourRings(d: string): [number, number][][] {
    const rings: [number, number][][] = [];
    let cur: [number, number][] = [];
    for (const cmd of parsePath(d)) {
        if (cmd.c === "Z") { if (cur.length) { rings.push(cur); cur = []; } continue; }
        if (cmd.c === "M") { if (cur.length) rings.push(cur); cur = [[cmd.x, cmd.y]]; }
        else cur.push([cmd.x, cmd.y]);
    }
    if (cur.length) rings.push(cur);
    return rings;
}

// pixel -> lon/lat (contour space)
export function contourPixelToLonLat(px: number, py: number): [number, number] {
    return pixelToLonLat(px, py);
}
function pixelToLonLat(px: number, py: number): [number, number] {
    const X = (px - CX) / KX;
    const Y = (CY - py) / KY;
    const lat = invertBB(Y);
    const a = interpTable(AA, Math.abs(lat));
    return [(X / a) * 180, lat];
}

// lon/lat -> pixel (contour space)
function lonLatToPixel(lon: number, lat: number): [number, number] {
    const a = interpTable(AA, Math.abs(lat));
    return [CX + KX * a * (lon / 180), CY - KY * bbSigned(lat)];
}

function isInRegion(id: string, mapID: string): boolean {
    return regions.find(r => r.id === mapID)?.code?.includes(id.slice(0, 2).toUpperCase()) ?? false;
}

// Reproject one path so that `centerLon` becomes the central meridian. Returns the
// rebuilt `d` and the bbox of the result. A jump of more than 180deg in shifted
// longitude between consecutive vertices means the segment crossed the new
// antimeridian, so we start a fresh subpath (M) there to avoid a line streaking
// across the map.
function reprojectPath(d: string, centerLon: number): { d: string; bbox: [number, number, number, number] } {
    let out = "";
    let prevLon = NaN;
    let inSub = false;
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const cmd of parsePath(d)) {
        if (cmd.c === "Z") { out += "Z"; inSub = false; prevLon = NaN; continue; }
        const [lon, lat] = pixelToLonLat(cmd.x, cmd.y);
        const shifted = wrapLon(lon - centerLon);
        const [px, py] = lonLatToPixel(shifted, lat);
        const cmdChar = cmd.c === "M" || !inSub || Math.abs(shifted - prevLon) > 180 ? "M" : "L";
        out += `${cmdChar}${px.toFixed(2)},${py.toFixed(2)}`;
        prevLon = shifted;
        inSub = true;
        if (px < minx) minx = px;
        if (px > maxx) maxx = px;
        if (py < miny) miny = py;
        if (py > maxy) maxy = py;
    }
    return { d: out, bbox: [minx, miny, maxx, maxy] };
}

export type DynamicContour = { id: string; color: string; d: string };
export type DynamicMap = { contours: DynamicContour[]; viewBox: string; stroke: number };

const FULL_VIEWBOX_WIDTH = 1235.27;
const FULL_STROKE = 1.8;
const CROP_PADDING = 0.06;

// Build a map recentered on the whole active region (every subregion belonging to
// `mapID`): all contours reprojected onto that region's center meridian, plus a tight
// square viewBox around the region and a stroke width scaled to the crop.
export function buildDynamicMap(mapID: string): DynamicMap {
    // center meridian = lon centroid of the active region's outline points.
    let vx = 0, vy = 0, vz = 0;
    for (const c of allContours) {
        if (!isInRegion(c.id, mapID)) continue;
        for (const cmd of parsePath(c.d)) {
            if (cmd.c === "Z") continue;
            const [lon, lat] = pixelToLonLat(cmd.x, cmd.y);
            const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180, cp = Math.cos(phi);
            vx += cp * Math.cos(lam); vy += Math.sin(phi); vz += cp * Math.sin(lam);
        }
    }
    const centerLon = Math.atan2(vz, vx) * 180 / Math.PI;

    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    const contours: DynamicContour[] = allContours.map(c => {
        const { d, bbox } = reprojectPath(c.d, centerLon);
        if (isInRegion(c.id, mapID)) {
            if (bbox[0] < minx) minx = bbox[0];
            if (bbox[1] < miny) miny = bbox[1];
            if (bbox[2] > maxx) maxx = bbox[2];
            if (bbox[3] > maxy) maxy = bbox[3];
        }
        return { id: c.id, color: c.color, d };
    });

    const side = Math.max(maxx - minx, maxy - miny) * (1 + CROP_PADDING);
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    const viewBox = `${(cx - side / 2).toFixed(2)} ${(cy - side / 2).toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}`;
    const stroke = FULL_STROKE * side / FULL_VIEWBOX_WIDTH;
    return { contours, viewBox, stroke };
}
