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
const SEAM = refineSeam(CAL);

// --- Coastline refit (offline, 2026-07) -------------------------------------------
// The calibration above only guarantees internal consistency; checked against real
// geography (satellite texture in the globe's view 2), it left systematic offsets of
// 1.5-3deg (Australia/Kamchatka east, the Americas west). These constants were fit by
// ICP against the Natural Earth ne_50m coastline: every contour vertex within 1.2deg
// of a real coast matched to its nearest coastline point, then least-squares on
// px = CX + KX*X, py = CY - KY*Y, iterated 4x. Coastal RMS 0.76deg -> 0.49deg; the
// remaining error is local hand-tracing noise with no global trend. Trade-off: the
// antimeridian cut (which refineSeam pinned to +-180) now inverts to +-(178..181.5),
// a ~2px seam artifact near Chukotka - accepted in exchange for the coastline fit.
// Set to null to fall back to the runtime calibration; refit if the contours change.
const COAST_FIT: { CX: number; KX: number; CY: number; KY: number } | null =
    { CX: 622.667, KX: 617.815, CY: 355.757, KY: 315.192 };

const { CX, KX } = COAST_FIT ?? SEAM;
const { CY, KY } = COAST_FIT ?? CAL;

// --- Residual correction field (offline, 2026-07) ----------------------------------
// After the linear coast fit, ~0.5-1.2deg regional offsets remain (local hand-tracing
// bias: e.g. New Zealand east, Tasmania west). This smooth displacement field removes
// them: Gaussian kernel regression (sigma 4.5deg, shrinkage toward 0 where no coast
// data) of the same contour-vertex -> ne_50m-coastline residuals, iterated with
// re-matching. Coastal RMS 0.53deg -> 0.27deg, i.e. at the resolution floor of the
// traced polylines themselves. Values are deg*100 on a lon x lat grid, bilinearly
// sampled; corrections are ADDED to the linear inversion (see fieldCorrection), and
// lonLatToPixel undoes them by fixed-point iteration so forward/inverse stay exact.
// Regenerate alongside COAST_FIT if the contours change.
const FGRID = { lon0: -180, lat0: -60, step: 5, nx: 73, ny: 30 };
const FIELD_LON = [
    -1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,26,43,50,51,49,45,39,31,18,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-4,-6,-4,-1,
    -26,-8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,40,52,54,54,51,48,43,37,29,15,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-7,-19,-22,-19,-24,-39,-47,-42,-26,
    -59,-37,-10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,41,51,53,53,52,49,45,38,29,15,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-22,-56,-79,-86,-76,-64,-69,-71,-68,-59,
    -60,-50,-24,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,7,34,48,51,52,51,49,45,38,26,8,0,0,0,0,0,0,0,0,0,0,-1,-4,-7,-8,-6,-2,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-9,-21,-26,-20,-28,-54,-77,-95,-105,-105,-84,-70,-68,-65,-60,
    -53,-47,-27,-2,0,0,0,0,0,0,0,0,0,4,6,3,0,0,21,42,47,47,45,45,43,39,30,15,2,0,0,0,0,0,0,0,0,-1,-5,-11,-16,-21,-22,-15,-4,0,0,0,0,0,0,0,0,0,0,0,0,-12,-43,-64,-68,-58,-50,-58,-70,-87,-104,-112,-93,-59,-55,-55,-53,
    -46,-37,-19,0,0,0,0,0,0,0,0,0,10,29,38,27,8,0,5,27,35,31,28,33,40,37,31,22,9,0,0,0,0,0,0,0,0,-1,-4,-9,-16,-24,-30,-28,-18,-10,-7,-3,-1,0,0,0,0,0,0,0,-1,-30,-67,-81,-80,-67,-54,-55,-63,-79,-104,-118,-104,-57,-49,-49,-46,
    -5,45,50,18,0,29,38,26,8,3,0,3,25,54,63,51,20,2,0,13,25,25,22,23,33,34,30,24,15,5,0,0,0,0,0,0,0,2,3,-1,-9,-22,-32,-32,-28,-25,-23,-16,-8,-2,0,0,0,0,0,0,-4,-44,-76,-85,-81,-65,-49,-49,-56,-71,-97,-108,-89,-73,-73,-59,-5,
    31,106,102,70,57,87,92,84,61,26,4,3,23,52,61,49,19,2,0,8,28,37,36,29,28,35,31,24,16,10,2,0,0,0,0,0,1,4,6,5,0,-16,-30,-32,-32,-32,-32,-27,-19,-7,-1,0,0,0,0,0,-5,-45,-76,-82,-77,-62,-48,-48,-57,-65,-73,-79,-76,-78,-81,-73,31,
    31,111,110,93,85,101,103,99,87,63,15,0,7,24,32,21,6,0,1,15,36,48,49,36,20,30,28,21,16,13,6,0,0,0,0,0,0,2,2,2,2,-10,-26,-31,-34,-37,-37,-32,-23,-8,-1,0,0,0,0,0,-1,-29,-61,-68,-63,-60,-59,-65,-72,-73,-67,-65,-75,-81,-84,-77,31,
    43,110,108,94,84,101,103,98,91,81,42,0,0,2,4,2,0,4,9,1,7,21,35,27,7,12,17,17,18,16,10,1,0,0,0,0,0,-3,-6,-6,-5,-5,-18,-27,-31,-36,-38,-34,-19,-4,0,0,0,0,0,-1,-11,-21,-28,-33,-40,-48,-57,-65,-72,-74,-66,-59,-73,-82,-85,-76,43,
    55,105,102,79,51,81,90,91,91,85,52,0,0,0,0,0,23,38,35,-1,-28,-30,-15,4,5,15,18,20,21,21,15,3,0,0,0,0,0,-3,-7,-9,-8,-2,-9,-18,-23,-29,-34,-27,-10,0,-1,-3,-1,0,-2,-13,-23,-27,-28,-29,-33,-40,-51,-60,-65,-66,-61,-56,-64,-77,-83,-69,55,
    -16,72,79,39,0,15,57,81,85,76,36,0,0,0,0,8,39,45,43,18,-22,-36,-32,-2,16,23,24,24,26,25,17,4,0,2,4,2,0,-1,-4,-6,-7,-2,-8,-20,-25,-28,-26,-13,-1,-5,-18,-24,-17,-6,-18,-24,-25,-28,-32,-35,-37,-41,-48,-54,-57,-58,-56,-55,-57,-70,-84,-84,-16,
    -81,-15,18,4,0,0,10,43,53,36,0,0,0,0,0,12,40,45,44,30,5,-2,7,20,24,26,26,24,24,21,11,2,7,12,11,5,0,-2,-3,-4,-4,-1,-6,-21,-29,-32,-29,-16,-3,-16,-35,-40,-37,-34,-37,-33,-28,-29,-36,-44,-45,-47,-51,-51,-51,-50,-51,-56,-68,-85,-96,-97,-81,
    -77,-25,0,0,2,4,0,0,0,0,0,0,0,0,0,5,34,43,43,36,27,23,21,25,26,27,27,22,14,7,2,6,17,20,16,7,0,-2,-4,-4,-2,0,-2,-13,-23,-27,-28,-24,-13,-18,-37,-42,-42,-45,-46,-42,-35,-32,-40,-50,-50,-51,-54,-55,-59,-59,-56,-72,-84,-90,-93,-92,-77,
    -50,-4,2,43,57,58,42,5,0,0,0,0,0,5,19,31,38,42,43,39,32,26,24,27,27,27,25,12,2,0,1,11,19,21,18,8,0,-2,-5,-4,-1,0,-2,-10,-18,-23,-26,-26,-22,-16,-31,-39,-43,-49,-52,-49,-43,-38,-44,-49,-47,-48,-50,-58,-73,-75,-71,-71,-79,-82,-84,-78,-50,
    -13,0,44,65,69,69,64,34,0,0,0,0,11,23,33,41,47,46,43,41,37,31,28,29,29,28,23,1,0,0,2,10,15,16,14,6,-1,-1,-2,-2,0,0,-3,-8,-14,-21,-25,-25,-22,-17,-21,-32,-43,-50,-53,-53,-48,-42,-44,-47,-47,-46,-46,-50,-70,-76,-71,-52,-45,-46,-50,-39,-13,
    0,9,56,68,70,70,67,45,0,0,0,14,28,27,25,30,42,45,42,41,40,37,32,30,30,28,16,0,0,0,1,5,6,6,3,-1,-1,0,1,0,0,-3,-4,-5,-8,-15,-20,-20,-18,-15,-16,-22,-37,-49,-52,-52,-46,-40,-41,-47,-51,-50,-44,-29,-45,-59,-51,-20,-4,0,-5,-2,0,
    0,6,50,66,69,68,63,33,0,0,12,35,37,28,18,15,29,35,36,39,40,38,32,27,25,18,0,0,0,0,-1,-2,-3,-4,-5,-4,-1,1,3,1,-1,-4,-6,-7,-7,-11,-14,-15,-14,-12,-13,-16,-26,-44,-48,-48,-39,-35,-39,-46,-51,-47,-35,-29,-30,-27,-15,0,0,0,0,0,0,
    0,0,19,51,60,58,40,0,0,11,37,51,47,35,19,10,22,28,30,33,31,24,15,6,2,0,0,0,0,0,-1,-4,-7,-6,-3,-1,-1,0,3,2,-1,-3,-7,-9,-9,-11,-12,-13,-12,-10,-9,-8,-9,-24,-34,-32,-19,-19,-26,-31,-32,-31,-31,-33,-38,-39,-30,-6,0,0,0,0,0,
    0,0,0,0,8,0,0,0,5,29,52,59,57,46,28,11,17,23,24,20,13,8,5,4,3,2,2,1,0,0,0,-1,-1,1,2,0,-1,-1,2,2,-1,-3,-6,-9,-10,-9,-10,-12,-13,-10,-4,-1,0,-1,-4,-3,0,0,-6,-13,-19,-24,-29,-35,-41,-45,-42,-24,-2,0,0,0,0,
    0,0,0,0,0,0,0,0,18,40,53,57,56,48,28,4,5,10,13,11,9,7,5,4,5,5,5,4,2,0,0,1,3,4,3,1,-2,-2,0,0,-1,-4,-7,-9,-9,-7,-6,-7,-9,-8,-3,0,0,0,0,0,0,1,0,-4,-10,-16,-24,-34,-42,-44,-43,-34,-15,-5,-2,0,0,
    -1,-1,-1,0,1,2,5,21,35,43,48,49,48,42,25,4,5,12,19,19,14,9,6,6,6,7,7,6,4,1,0,1,1,1,0,-1,-4,-5,-5,-3,-4,-6,-8,-8,-8,-4,-1,-2,-4,-4,-1,0,0,0,0,0,0,2,4,3,-3,-11,-23,-35,-42,-43,-43,-40,-37,-32,-23,-10,-1,
    -11,0,3,4,5,8,15,26,34,38,41,43,43,39,27,13,19,24,26,25,21,14,9,8,9,9,9,9,7,4,1,-2,-2,-2,-3,-5,-7,-10,-10,-9,-7,-7,-8,-8,-6,-1,2,1,0,-1,0,0,0,0,0,0,0,0,3,5,-2,-16,-30,-38,-42,-42,-42,-43,-43,-42,-38,-29,-11,
    -10,3,8,9,10,12,16,23,29,32,34,35,35,31,19,16,19,22,22,22,21,18,16,15,15,15,15,14,10,3,-4,-8,-7,-7,-7,-8,-10,-12,-13,-12,-10,-9,-8,-6,-3,1,4,4,2,2,2,1,0,-1,-1,0,0,0,0,-1,-13,-27,-35,-38,-40,-40,-40,-41,-41,-40,-37,-28,-10,
    -3,7,10,11,12,13,16,20,25,27,28,27,23,16,12,12,12,13,13,14,14,14,15,16,17,17,16,11,4,-5,-13,-18,-18,-16,-15,-16,-18,-20,-19,-17,-14,-10,-6,-1,4,6,7,8,8,8,7,6,5,3,2,1,1,1,2,3,-5,-18,-29,-34,-36,-36,-36,-36,-36,-34,-28,-17,-3,
    4,8,10,10,11,12,15,18,21,21,19,16,13,11,10,9,9,8,8,8,9,10,11,12,13,13,10,4,-5,-13,-20,-23,-24,-25,-24,-25,-27,-26,-24,-19,-13,-7,-1,3,5,6,6,7,8,9,8,7,6,6,5,6,8,10,13,15,16,15,11,4,-3,-8,-12,-15,-16,-15,-10,-2,4,
    7,8,8,9,11,13,15,17,17,16,14,11,10,8,7,6,5,4,4,4,5,6,7,8,8,8,5,0,-8,-15,-21,-24,-26,-27,-27,-25,-24,-21,-18,-14,-10,-6,-2,0,1,1,1,2,3,4,5,5,5,6,7,9,12,14,17,19,21,23,24,24,24,22,19,15,11,8,7,6,7,
    9,8,7,8,10,12,13,13,12,10,9,7,5,4,3,1,0,-1,-1,-2,-2,-2,-1,-1,-1,-1,-3,-6,-10,-15,-19,-21,-22,-23,-22,-21,-19,-18,-16,-15,-14,-12,-12,-11,-11,-10,-9,-8,-6,-4,-1,1,4,7,11,14,16,19,21,22,24,25,26,27,28,27,26,24,22,19,15,12,9,
    8,5,3,4,5,6,6,6,5,4,3,2,1,0,-2,-3,-4,-5,-6,-7,-7,-8,-8,-9,-9,-10,-10,-11,-13,-14,-15,-16,-17,-17,-17,-17,-17,-17,-17,-16,-17,-17,-17,-17,-17,-17,-16,-14,-11,-7,-3,2,7,12,15,19,21,23,24,25,26,27,27,28,28,27,27,25,23,20,16,13,8,
    1,-1,-2,-1,-1,-1,-1,-1,-1,-1,-2,-2,-3,-4,-4,-5,-6,-7,-7,-8,-9,-9,-9,-10,-10,-9,-9,-9,-8,-8,-8,-8,-9,-9,-10,-10,-11,-11,-12,-13,-13,-14,-14,-15,-15,-14,-13,-11,-8,-4,0,5,10,14,18,20,22,24,24,25,25,24,24,23,21,20,17,14,11,9,6,3,1
];
const FIELD_LAT = [
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,17,29,34,36,37,36,34,29,19,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,5,4,1,
    22,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,24,31,33,34,35,36,36,35,29,16,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,9,10,10,19,32,39,35,22,
    43,27,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,20,26,27,28,30,32,33,33,28,15,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,27,37,40,37,42,53,56,52,43,
    38,31,15,1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,14,20,21,22,24,27,30,31,25,10,0,0,0,0,0,0,0,0,0,0,4,14,21,20,12,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1,7,15,20,18,17,26,36,43,47,47,46,49,47,42,38,
    24,21,12,1,0,0,0,0,0,0,0,0,0,3,4,3,0,0,8,14,16,16,18,25,34,37,33,18,3,0,0,0,0,0,0,0,0,4,22,40,48,49,41,24,6,0,0,0,0,0,0,0,0,0,0,0,0,7,27,44,51,48,32,26,30,37,44,47,42,34,29,26,24,
    12,12,5,0,0,0,0,0,0,0,0,0,8,23,30,21,6,0,1,6,8,9,12,23,36,37,30,22,12,1,0,0,0,0,0,0,0,11,33,46,52,54,50,39,24,17,12,5,1,0,0,0,0,0,0,0,0,17,39,51,58,56,37,24,23,30,40,44,38,21,16,14,12,
    28,41,36,12,0,19,25,17,4,2,0,2,19,43,50,40,16,2,0,2,5,6,8,17,29,26,21,22,23,14,2,0,0,0,0,0,0,12,29,38,45,48,45,41,38,39,36,25,14,4,0,0,0,0,0,0,2,24,43,50,54,54,38,22,18,20,26,28,25,23,23,21,28,
    52,72,66,44,37,57,61,54,36,14,2,2,18,41,48,39,15,2,0,3,10,13,12,12,12,13,17,24,27,22,6,0,0,0,0,0,1,11,22,26,29,33,37,38,40,42,42,39,30,12,1,0,0,0,0,0,3,26,46,53,57,56,43,31,26,18,11,12,18,20,20,24,52,
    50,74,71,60,55,67,68,64,55,39,9,0,6,19,25,17,5,0,1,13,27,30,26,17,4,8,16,24,27,23,11,0,0,0,0,0,2,14,22,23,18,16,29,35,38,39,39,39,33,14,2,0,0,0,0,0,1,21,44,55,61,63,58,48,41,30,17,13,14,14,13,16,50,
    49,73,72,62,54,66,68,65,61,55,29,0,0,2,3,2,0,4,11,10,17,24,26,16,2,4,14,23,27,26,17,2,0,0,0,0,3,17,26,26,20,8,20,29,32,35,36,34,23,6,0,0,0,0,0,1,16,32,41,47,54,60,59,51,44,38,34,29,14,9,7,10,49,
    52,70,68,53,33,53,60,63,63,59,36,0,0,0,0,0,24,41,40,16,2,1,5,4,8,25,33,36,38,36,25,6,0,0,1,0,4,20,28,28,21,5,11,19,22,26,30,25,10,0,2,4,1,0,2,12,25,35,42,45,48,53,55,50,44,42,44,41,24,11,6,10,52,
    43,55,52,26,0,9,39,56,59,53,25,0,0,0,0,8,41,48,47,30,8,2,0,3,26,38,42,45,49,43,27,5,0,7,16,20,23,29,30,28,19,3,6,14,16,19,21,12,1,7,24,31,22,8,15,21,24,31,40,46,46,46,46,45,44,42,46,44,33,26,30,35,43,
    40,23,11,3,0,0,7,30,37,25,0,0,0,0,0,12,42,48,48,36,21,20,28,33,35,40,42,44,46,37,17,2,12,30,42,46,41,35,31,27,14,1,2,8,15,25,33,23,5,20,46,51,46,32,26,26,25,28,38,47,45,42,40,40,42,40,43,44,44,50,52,49,40,
    41,12,0,0,2,4,0,0,0,0,0,0,0,0,0,6,37,46,47,40,34,36,40,37,36,38,40,37,27,13,3,8,27,38,46,50,46,37,29,23,9,0,1,16,35,47,51,46,26,24,47,51,48,35,28,27,28,30,40,46,39,33,32,37,48,47,42,49,54,56,57,53,41,
    31,3,1,36,49,49,35,4,0,0,0,0,0,5,18,34,46,51,51,46,42,41,41,38,37,37,35,17,3,0,1,16,29,35,38,41,40,32,23,13,2,0,10,36,50,56,58,55,45,27,37,43,43,34,28,27,28,32,39,37,29,24,24,36,56,57,52,47,51,53,54,50,31,
    9,0,37,56,59,59,55,29,0,0,0,0,11,22,31,41,52,54,53,51,48,46,42,38,37,36,29,1,0,0,2,17,25,28,27,19,16,15,8,1,0,3,23,39,48,54,57,55,49,38,33,36,39,34,29,28,29,33,38,33,24,20,19,30,53,56,52,37,29,30,33,27,9,
    0,8,47,58,60,60,57,38,0,0,0,12,26,27,25,29,40,47,48,50,52,51,45,39,37,34,19,0,0,0,3,16,24,25,24,14,2,1,5,10,14,23,35,39,42,47,51,50,46,40,35,34,36,36,32,30,29,35,40,39,29,23,19,18,35,44,38,15,3,0,3,2,0,
    0,4,43,57,59,59,54,28,0,0,7,23,28,25,20,17,25,35,42,47,49,48,43,36,31,22,0,0,0,0,3,17,26,30,32,31,25,23,30,37,40,42,43,43,41,42,45,45,42,37,34,31,28,32,30,27,24,32,39,40,35,30,29,32,32,27,12,0,0,0,0,0,0,
    0,0,16,44,52,50,35,0,0,6,18,27,28,24,17,12,21,31,38,41,39,35,27,14,3,0,0,0,0,0,2,14,28,36,41,45,45,44,44,44,44,44,46,47,44,41,42,41,37,31,27,20,11,16,19,15,10,18,23,21,21,24,30,36,40,40,29,6,0,0,0,0,0,
    0,0,0,0,7,0,0,0,2,14,26,29,28,24,17,9,17,26,31,32,29,27,27,28,27,20,11,4,0,0,1,8,27,41,47,49,49,47,45,44,41,41,44,47,46,41,38,36,32,22,9,3,0,0,2,1,0,-6,-14,-10,-2,10,23,34,40,42,38,22,2,0,0,0,0,
    0,0,1,1,0,0,0,0,9,19,25,27,27,23,13,1,4,10,19,25,29,32,35,38,39,36,32,22,9,0,0,5,28,43,48,50,48,46,43,41,39,39,42,45,45,39,36,34,32,24,7,0,0,0,0,0,0,-14,-30,-31,-22,-6,12,28,37,39,38,31,13,4,1,0,0,
    5,10,15,18,18,15,10,12,18,22,24,25,24,21,13,3,8,18,28,34,36,39,41,41,40,38,35,31,19,4,0,9,30,42,46,47,46,43,40,38,37,39,42,45,43,37,33,31,29,21,5,0,0,0,0,0,0,-11,-35,-43,-34,-12,11,27,35,37,36,34,30,26,19,9,5,
    27,28,32,33,34,32,27,22,20,21,22,22,22,21,16,17,28,36,40,41,41,41,41,40,39,36,34,31,22,10,7,18,32,39,42,43,43,42,41,41,41,41,42,43,39,32,27,26,22,12,2,0,0,0,0,0,0,0,-15,-32,-23,3,24,33,35,36,36,38,40,40,38,32,27,
    42,41,41,40,39,37,32,25,21,19,19,19,19,18,20,29,35,38,40,40,39,38,36,35,34,33,31,30,27,25,24,27,33,36,38,40,41,42,43,43,43,43,42,40,36,30,25,22,19,15,13,11,9,5,3,0,0,0,0,0,13,29,36,38,39,39,41,42,43,44,44,43,42,
    49,49,48,46,44,42,36,29,23,20,19,20,22,25,28,29,30,32,32,33,33,32,31,30,29,28,28,28,29,30,31,33,35,36,37,39,41,42,43,43,42,42,42,42,42,42,42,42,41,41,39,37,34,30,24,17,11,7,8,10,19,30,37,40,42,43,44,44,45,45,46,48,49,
    51,52,51,51,50,48,44,39,34,31,30,31,31,30,28,27,26,26,26,27,27,27,26,26,25,24,24,25,27,29,31,32,33,34,35,37,39,41,41,41,40,40,41,42,43,43,44,44,44,43,42,40,38,36,34,32,31,31,33,35,37,39,41,42,43,44,45,46,47,48,49,50,51,
    51,52,52,52,51,49,46,42,38,35,32,30,29,27,25,24,23,22,22,21,21,21,21,21,20,20,20,22,24,26,28,29,29,29,29,29,31,33,34,35,36,36,38,39,40,41,41,42,41,41,40,38,37,36,35,35,36,37,38,39,41,42,43,43,44,45,46,48,49,50,51,51,51,
    46,46,46,45,43,39,35,31,28,26,25,24,23,22,21,20,19,18,18,17,17,18,18,18,19,19,20,21,22,23,24,25,25,25,25,25,26,27,28,29,30,31,32,33,34,35,36,36,36,36,36,36,35,35,35,35,36,36,37,38,39,40,41,42,43,43,44,45,46,46,47,47,46,
    26,22,20,19,19,19,19,18,18,18,18,17,17,17,16,16,16,15,15,15,16,16,17,18,19,20,21,21,22,23,23,24,24,24,24,24,25,25,26,26,27,27,27,27,28,28,29,30,30,31,31,32,32,32,33,33,33,33,34,34,35,35,36,37,38,39,39,39,38,36,34,30,26,
    2,0,1,1,3,5,7,9,10,12,12,13,13,13,14,14,14,14,14,15,15,16,17,18,19,20,20,21,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,25,25,26,27,27,27,27,27,27,27,26,26,25,24,23,22,20,18,15,11,8,5,2
];

// Bilinear sample of the correction field at an (uncorrected) lon/lat, in degrees.
function fieldCorrection(lon: number, lat: number): [number, number] {
    const { lon0, lat0, step, nx, ny } = FGRID;
    const gx = (wrapLon(lon) - lon0) / step;
    const gy = (Math.min(lat0 + (ny - 1) * step, Math.max(lat0, lat)) - lat0) / step;
    const ix = Math.min(nx - 2, Math.max(0, Math.floor(gx))), fx = gx - ix;
    const iy = Math.min(ny - 2, Math.max(0, Math.floor(gy))), fy = gy - iy;
    const s = (f: number[]) =>
        f[iy * nx + ix] * (1 - fx) * (1 - fy) + f[iy * nx + ix + 1] * fx * (1 - fy) +
        f[(iy + 1) * nx + ix] * (1 - fx) * fy + f[(iy + 1) * nx + ix + 1] * fx * fy;
    return [s(FIELD_LON) / 100, s(FIELD_LAT) / 100];
}

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
    const lon = (X / a) * 180; // may exceed +-180 at the antimeridian cut; keep unwrapped
    const [dl, dt] = fieldCorrection(lon, lat);
    return [lon + dl, lat + dt];
}

// lon/lat -> pixel (contour space). Undo the field first (fixed-point: the field is
// smooth and small, so three iterations recover the pre-correction lon/lat exactly
// enough that forward(inverse(p)) === p to within 0.02px across all contour vertices).
function lonLatToPixel(lon: number, lat: number): [number, number] {
    let lon0 = lon, lat0 = lat;
    for (let i = 0; i < 3; i++) {
        const [dl, dt] = fieldCorrection(lon0, lat0);
        lon0 = lon - dl; lat0 = lat - dt;
    }
    const a = interpTable(AA, Math.abs(lat0));
    return [CX + KX * a * (lon0 / 180), CY - KY * bbSigned(lat0)];
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
