// Square-grid dot fill of the contour regions, for the globe's dot-map view (mapMode 1).
//
// A SINGLE global grid is laid over the whole sphere; each contour region simply keeps the grid
// points that fall inside it (assigned by point-in-region test). This guarantees the dots of every
// region share one consistent lattice — no per-region phase differences and no overlapping dots at
// borders. The grid is a lat/lon SQUARE lattice (equal row/column pitch, no offset) with longitude
// arc-corrected by 1/cos(lat) and quantized per row so each latitude circle closes cleanly, so
// spacing stays ~uniform on the sphere instead of converging toward the poles. Data source is the
// same as the contour and satellite views: allContours -> lon/lat (contourProjection). For each
// region we build:
//   - a flat list of dot centres (unit vectors) + a per-dot region index, for one InstancedMesh
//     of small spheres, and
//   - an overlay mesh per region: a square cell around each of its dots, the semi-opaque
//     hover/click target (mirrors globeGeometry.buildRegionMeshes).
//
// Built once at module load.

import { allContours } from "./mapPaths";
import { parseContourRings, contourPixelToLonLat } from "./contourProjection";
import { lonLatToUnit } from "./contourGlobeGeometry";

const DEG = Math.PI / 180;
const SPACING_DEG = 1.2;                        // grid spacing (nearest-neighbour), tightened
const CELL_RC = (SPACING_DEG / 2) * Math.SQRT2 * DEG; // square-cell corner distance, radians

type V3 = [number, number, number];
type P2 = [number, number];

const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Orthonormal tangent basis (e1, e2) at unit direction c.
function tangentBasis(c: V3): [V3, V3] {
    const up: V3 = Math.abs(c[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];
    const d = dot3(c, up);
    let e1: V3 = [up[0] - c[0] * d, up[1] - c[1] * d, up[2] - c[2] * d];
    const n = Math.hypot(e1[0], e1[1], e1[2]) || 1;
    e1 = [e1[0] / n, e1[1] / n, e1[2] / n];
    const e2: V3 = [c[1] * e1[2] - c[2] * e1[1], c[2] * e1[0] - c[0] * e1[2], c[0] * e1[1] - c[1] * e1[0]];
    return [e1, e2];
}

// Azimuthal-equidistant projection of unit v around centre c: 2D radians of great-circle distance.
function project(v: V3, c: V3, e1: V3, e2: V3): P2 {
    const th = Math.acos(Math.max(-1, Math.min(1, dot3(v, c))));
    const a = dot3(v, e1), b = dot3(v, e2);
    const r = Math.hypot(a, b) || 1;
    return [(th * a) / r, (th * b) / r];
}

function inRing(px: number, py: number, ring: P2[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// Each contour ring as a bounded cap + azimuthal polygon, for fast point-in-region tests.
type RingFrame = { regionIdx: number; centre: V3; cosCap: number; e1: V3; e2: V3; poly: P2[] };
const ringFrames: RingFrame[] = [];
allContours.forEach((c, regionIdx) => {
    for (const ring of parseContourRings(c.d)) {
        if (ring.length < 3) continue;
        const unit = ring.map(([px, py]) => { const [lon, lat] = contourPixelToLonLat(px, py); return lonLatToUnit(lon, lat); });
        let rx = 0, ry = 0, rz = 0;
        for (const [x, y, z] of unit) { rx += x; ry += y; rz += z; }
        const rn = Math.hypot(rx, ry, rz) || 1;
        const centre: V3 = [rx / rn, ry / rn, rz / rn];
        const [e1, e2] = tangentBasis(centre);
        let cosCap = 1;
        for (const v of unit) cosCap = Math.min(cosCap, dot3(v, centre));
        ringFrames.push({ regionIdx, centre, cosCap: cosCap - 1e-6, e1, e2, poly: unit.map(v => project(v, centre, e1, e2)) });
    }
});

// Ring-frame index containing unit q, or -1 (ocean). First matching ring wins (land partitions).
function frameOf(q: V3): number {
    for (let i = 0; i < ringFrames.length; i++) {
        const f = ringFrames[i];
        if (dot3(q, f.centre) < f.cosCap) continue;
        const [px, py] = project(q, f.centre, f.e1, f.e2);
        if (inRing(px, py, f.poly)) return i;
    }
    return -1;
}

export type ContourDotRegionMesh = {
    id: string;
    color: string;
    positions: Float32Array; // overlay square-cell triangles (indexed via `indices`)
    indices: Uint32Array;
    centroid: V3;            // unit vector, dot-mean (rotate-to-face)
};

const dotPos: number[] = [];
const dotRegionIdx: number[] = [];
const dotRegionIds = allContours.map(c => c.id);
type Acc = { overlayPos: number[]; overlayIdx: number[]; sx: number; sy: number; sz: number; n: number };
const acc: Acc[] = allContours.map(() => ({ overlayPos: [], overlayIdx: [], sx: 0, sy: 0, sz: 0, n: 0 }));

// Place a dot (grid point q) into region regionIdx: sphere position + its square overlay cell.
function addDot(q: V3, regionIdx: number) {
    dotPos.push(q[0], q[1], q[2]);
    dotRegionIdx.push(regionIdx);
    const a = acc[regionIdx];
    a.sx += q[0]; a.sy += q[1]; a.sz += q[2]; a.n++;
    let east: V3 = [q[2], 0, -q[0]]; // cross([0,1,0], q) — points east; degenerate only at poles
    const en = Math.hypot(east[0], east[1], east[2]) || 1;
    east = [east[0] / en, east[1] / en, east[2] / en];
    const north: V3 = [q[1] * east[2] - q[2] * east[1], q[2] * east[0] - q[0] * east[2], q[0] * east[1] - q[1] * east[0]];
    const base = a.overlayPos.length / 3;
    const cr = Math.cos(CELL_RC), sr = Math.sin(CELL_RC);
    for (let k = 0; k < 4; k++) {
        const th = (45 + k * 90) * DEG, ct = Math.cos(th), st = Math.sin(th);
        a.overlayPos.push(
            q[0] * cr + (ct * east[0] + st * north[0]) * sr,
            q[1] * cr + (ct * east[1] + st * north[1]) * sr,
            q[2] * cr + (ct * east[2] + st * north[2]) * sr,
        );
    }
    a.overlayIdx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

const LAT_TOP = 85, LAT_BOT = -58;             // covered latitude band (regions live here)
const maxRow = Math.floor((LAT_TOP - LAT_BOT) / SPACING_DEG);
const colsAt = (lat: number) => Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / SPACING_DEG));
const rowLat = (row: number) => LAT_TOP - row * SPACING_DEG;
const cellLon = (col: number, cols: number) => -180 + (((col % cols) + cols) % cols) * (360 / cols);

// Global square grid: rows every SPACING_DEG, columns arc-corrected + quantized per row.
// Each occupied cell key is recorded so island snapping (below) never reuses a cell (no overlaps).
const used = new Set<string>();
const ringHit = new Array(ringFrames.length).fill(false);
for (let row = 0; row <= maxRow; row++) {
    const lat = rowLat(row), cols = colsAt(lat);
    for (let col = 0; col < cols; col++) {
        const q = lonLatToUnit(cellLon(col, cols), lat);
        const fi = frameOf(q);
        if (fi < 0) continue;
        ringHit[fi] = true;
        used.add(`${row}:${col}`);
        addDot(q, ringFrames[fi].regionIdx);
    }
}

// Islands smaller than a grid cell catch no interior point above; snap each such ring to the single
// NEAREST grid cell. If that cell is already taken, skip it — so a lone-ocean island always shows a
// dot, but tight island clusters (Lesser Antilles, eastern Melanesia) collapse to grid resolution
// instead of piling up extra dots.
for (let fi = 0; fi < ringFrames.length; fi++) {
    if (ringHit[fi]) continue;
    const c = ringFrames[fi].centre;
    const lat0 = Math.asin(Math.max(-1, Math.min(1, c[1]))) / DEG;
    const lon0 = Math.atan2(-c[2], c[0]) / DEG;
    const row0 = Math.max(0, Math.min(maxRow, Math.round((LAT_TOP - lat0) / SPACING_DEG)));
    let best: { row: number; col: number; q: V3 } | null = null, bestAng = Infinity;
    for (let dr = -1; dr <= 1; dr++) {
        const row = row0 + dr;
        if (row < 0 || row > maxRow) continue;
        const lat = rowLat(row), cols = colsAt(lat), step = 360 / cols;
        const cc = Math.round((lon0 + 180) / step);
        for (let dc = -1; dc <= 1; dc++) {
            const col = (((cc + dc) % cols) + cols) % cols;
            const q = lonLatToUnit(cellLon(col, cols), lat);
            const ang = Math.acos(Math.max(-1, Math.min(1, dot3(q, c))));
            if (ang < bestAng) { bestAng = ang; best = { row, col, q }; }
        }
    }
    if (best && !used.has(`${best.row}:${best.col}`)) { used.add(`${best.row}:${best.col}`); addDot(best.q, ringFrames[fi].regionIdx); }
}

export const dotPositions = new Float32Array(dotPos);
export const dotRegionIndex = new Uint16Array(dotRegionIdx);
export const dotCount = dotRegionIdx.length;
export { dotRegionIds };
export const contourDotRegionMeshes: ContourDotRegionMesh[] = allContours.map((c, i) => {
    const a = acc[i];
    const n = Math.hypot(a.sx, a.sy, a.sz) || 1;
    return {
        id: c.id,
        color: c.color,
        positions: new Float32Array(a.overlayPos),
        indices: new Uint32Array(a.overlayIdx),
        centroid: a.n ? [a.sx / n, a.sy / n, a.sz / n] : [0, 0, 1],
    };
});
