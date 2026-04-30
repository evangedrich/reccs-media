import earcut from "earcut";
import { regionDots, regionPolygons } from "./mapPaths";

const MAP_W = 1440;
const MAP_H = 720;
const X_SCALE = 1.014;
const TOP_LAT_DEG = 90;
const BOTTOM_LAT_DEG = -60;
const SUBDIVIDE_PX = 4;
const SPHERE_RADIUS = 1;

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

const Y_TOP = bbSigned(TOP_LAT_DEG);
const Y_BOT = bbSigned(BOTTOM_LAT_DEG);

export function pixelToLonLat(px: number, py: number): [number, number] {
    const nx = (px - MAP_W / 2) / (MAP_W / 2 * X_SCALE);
    const ny = Y_TOP + (py / MAP_H) * (Y_BOT - Y_TOP);
    const latDeg = invertBB(ny);
    const a = interpTable(AA, Math.abs(latDeg));
    const lonDeg = (nx / a) * 180;
    return [lonDeg, latDeg];
}

export function lonLatToUnitVec(lonDeg: number, latDeg: number): [number, number, number] {
    const phi = (latDeg * Math.PI) / 180;
    const lambda = (lonDeg * Math.PI) / 180;
    const cphi = Math.cos(phi);
    return [cphi * Math.cos(lambda), Math.sin(phi), -cphi * Math.sin(lambda)];
}

function pixelToUnitVec(px: number, py: number): [number, number, number] {
    const [lon, lat] = pixelToLonLat(px, py);
    return lonLatToUnitVec(lon, lat);
}

const DOT_RE = /M\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+m\s+-3,0\s+a\s+3,3/g;
function parseDotPath(d: string): [number, number][] {
    const out: [number, number][] = [];
    for (const m of d.matchAll(DOT_RE)) {
        out.push([parseFloat(m[1]), parseFloat(m[2])]);
    }
    return out;
}

function parsePolygonPath(d: string): [number, number][][] {
    const rings: [number, number][][] = [];
    let current: [number, number][] = [];
    const tokens = d.match(/[MLZ]|-?\d+(?:\.\d+)?/g) ?? [];
    let i = 0;
    while (i < tokens.length) {
        const t = tokens[i];
        if (t === "M" || t === "L") {
            i++;
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            if (t === "M" && current.length > 0) {
                rings.push(current);
                current = [];
            }
            current.push([x, y]);
        } else if (t === "Z") {
            i++;
            if (current.length > 0) {
                rings.push(current);
                current = [];
            }
        } else {
            i++;
        }
    }
    if (current.length > 0) rings.push(current);
    return rings;
}

function subdivideRing(ring: [number, number][], maxSpacing: number): [number, number][] {
    const out: [number, number][] = [];
    const n = ring.length;
    for (let i = 0; i < n; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[(i + 1) % n];
        out.push([x0, y0]);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.hypot(dx, dy);
        const segments = Math.ceil(dist / maxSpacing);
        for (let s = 1; s < segments; s++) {
            const t = s / segments;
            out.push([x0 + dx * t, y0 + dy * t]);
        }
    }
    return out;
}

export type RegionMesh = {
    id: string;
    color: string;
    positions: Float32Array;
    indices: Uint32Array;
    centroid: [number, number, number];
};

function buildDotData(): { positions: Float32Array; regionIndex: Uint16Array; regionIds: string[] } {
    const allPoints: number[] = [];
    const allRegionIdx: number[] = [];
    const regionIds: string[] = [];
    regionDots.forEach((entry, idx) => {
        regionIds.push(entry.id);
        const dots = parseDotPath(entry.d);
        for (const [px, py] of dots) {
            const [x, y, z] = pixelToUnitVec(px, py);
            allPoints.push(x * SPHERE_RADIUS, y * SPHERE_RADIUS, z * SPHERE_RADIUS);
            allRegionIdx.push(idx);
        }
    });
    return {
        positions: new Float32Array(allPoints),
        regionIndex: new Uint16Array(allRegionIdx),
        regionIds,
    };
}

function buildRegionMeshes(): RegionMesh[] {
    return regionPolygons.map((poly) => {
        const rings = parsePolygonPath(poly.d);
        const positions: number[] = [];
        const indices: number[] = [];
        let centroidX = 0, centroidY = 0, centroidZ = 0, centroidCount = 0;
        for (const ring of rings) {
            const subdivided = subdivideRing(ring, SUBDIVIDE_PX);
            const flat: number[] = [];
            for (const [x, y] of subdivided) flat.push(x, y);
            const tris = earcut(flat);
            const baseVertex = positions.length / 3;
            for (const [px, py] of subdivided) {
                const [x, y, z] = pixelToUnitVec(px, py);
                positions.push(x * SPHERE_RADIUS, y * SPHERE_RADIUS, z * SPHERE_RADIUS);
                centroidX += x;
                centroidY += y;
                centroidZ += z;
                centroidCount++;
            }
            for (const idx of tris) indices.push(baseVertex + idx);
        }
        const cn = Math.hypot(centroidX, centroidY, centroidZ) || 1;
        const centroid: [number, number, number] = [
            (centroidX / cn) * SPHERE_RADIUS,
            (centroidY / cn) * SPHERE_RADIUS,
            (centroidZ / cn) * SPHERE_RADIUS,
        ];
        return {
            id: poly.id,
            color: poly.color,
            positions: new Float32Array(positions),
            indices: new Uint32Array(indices),
            centroid: centroidCount === 0 ? [0, 0, 1] : centroid,
        };
    });
}

const dotData = buildDotData();
export const dotPositions = dotData.positions;
export const dotRegionIndex = dotData.regionIndex;
export const dotRegionIds = dotData.regionIds;
export const dotCount = dotData.regionIndex.length;

export const regionMeshes: RegionMesh[] = buildRegionMeshes();
