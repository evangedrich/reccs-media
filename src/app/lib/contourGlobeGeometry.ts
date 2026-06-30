// Drape the Robinson contour map onto a unit sphere for the 3D globe.
//
// The contour `d` paths are flat Robinson pixels; contourProjection inverts them to
// lon/lat, and here each region's rings are converted to sphere positions. For each
// region we build:
//   - a triangulated fill mesh (earcut on the raw pixel polygon, then each triangle
//     subdivided on the sphere so large regions hug the surface instead of chording
//     through it), used as the hover/click/select target, and
//   - an outline (line segments) for the always-visible region borders,
//   - a centroid unit vector used to rotate that region to face the camera.
//
// Geometry is independent of which region is "active" (that only affects color and
// interaction), so it is built once at module load, mirroring globeGeometry.ts.

import earcut from "earcut";
import { allContours } from "./mapPaths";
import { parseContourRings, contourPixelToLonLat } from "./contourProjection";

const DEG = Math.PI / 180;
// Subdivide any fill triangle whose edges exceed this arc length so the flat triangle
// stays close to the sphere surface (sagitta for ~10deg is ~0.004 of the radius, well
// clear of the inner background sphere).
const MAX_EDGE_RAD = 10 * DEG;
const SUBDIVIDE_MAX_DEPTH = 5;

type V3 = [number, number, number];

function lonLatToUnit(lon: number, lat: number): V3 {
    const phi = lat * DEG, lam = lon * DEG, cphi = Math.cos(phi);
    return [cphi * Math.cos(lam), Math.sin(phi), -cphi * Math.sin(lam)];
}

function angleBetween(a: V3, b: V3): number {
    return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
}

// lon/lat re-expressed in a frame rotated so (lon0, lat0) sits at the origin
// (prime meridian / equator). Triangulating in this centered equirectangular frame
// avoids the Robinson pixel map's severe high-latitude distortion, which otherwise
// folds the lifted mesh for wide, high-latitude regions (e.g. ASNO near the Bering).
function centerLonLat(lon: number, lat: number, lon0: number, lat0: number): [number, number] {
    const [x, y, z] = lonLatToUnit(lon, lat);
    const a = -lon0 * DEG;
    const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a), y1 = y;
    const b = -lat0 * DEG;
    const y2 = y1 * Math.cos(b) - z1 * Math.sin(b), z2 = y1 * Math.sin(b) + z1 * Math.cos(b);
    return [Math.atan2(-z2, x1) / DEG, Math.asin(Math.max(-1, Math.min(1, y2))) / DEG];
}

function midUnit(a: V3, b: V3): V3 {
    const x = a[0] + b[0], y = a[1] + b[1], z = a[2] + b[2];
    const n = Math.hypot(x, y, z) || 1;
    return [x / n, y / n, z / n];
}

// Recursively 4-split a spherical triangle until its edges are short enough, pushing
// final vertices (flat, 9 numbers per triangle) into `out`, wound so the triangle
// faces outward from the sphere center (so the fill can be rendered single-sided and
// the region's far side doesn't bleed through its near side).
function pushOutward(a: V3, b: V3, c: V3, out: number[]): void {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const outward = nx * (a[0] + b[0] + c[0]) + ny * (a[1] + b[1] + c[1]) + nz * (a[2] + b[2] + c[2]);
    if (outward >= 0) out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    else out.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
}

function emitTriangle(a: V3, b: V3, c: V3, out: number[], depth: number): void {
    if (depth <= 0 || (angleBetween(a, b) <= MAX_EDGE_RAD && angleBetween(b, c) <= MAX_EDGE_RAD && angleBetween(c, a) <= MAX_EDGE_RAD)) {
        pushOutward(a, b, c, out);
        return;
    }
    const ab = midUnit(a, b), bc = midUnit(b, c), ca = midUnit(c, a);
    emitTriangle(a, ab, ca, out, depth - 1);
    emitTriangle(ab, b, bc, out, depth - 1);
    emitTriangle(ca, bc, c, out, depth - 1);
    emitTriangle(ab, bc, ca, out, depth - 1);
}

export type ContourRegionMesh = {
    id: string;
    color: string;
    positions: Float32Array; // triangle fill, non-indexed
    outline: Float32Array;   // line segments (pairs of points)
    centroid: V3;            // unit vector, region center (for rotate-to-face)
};

function build(): ContourRegionMesh[] {
    return allContours.map(c => {
        const fill: number[] = [];
        const outline: number[] = [];
        let cx = 0, cy = 0, cz = 0;
        for (const ring of parseContourRings(c.d)) {
            if (ring.length < 2) continue;
            const ll = ring.map(([px, py]) => contourPixelToLonLat(px, py));
            const unit = ll.map(([lon, lat]) => lonLatToUnit(lon, lat));
            for (let i = 0; i < unit.length; i++) {
                const a = unit[i], b = unit[(i + 1) % unit.length];
                outline.push(a[0], a[1], a[2], b[0], b[1], b[2]);
                cx += a[0]; cy += a[1]; cz += a[2];
            }
            if (ring.length < 3) continue;
            // Triangulate in a frame centered on this ring (see centerLonLat): valid and
            // low-distortion, so the lifted mesh doesn't fold. Vertices are still lifted
            // from their true lon/lat below, so placement is unchanged. Each ring is
            // filled solid (islands are separate rings, the rare lake harmlessly filled).
            let rx = 0, ry = 0, rz = 0;
            for (const u of unit) { rx += u[0]; ry += u[1]; rz += u[2]; }
            const lon0 = Math.atan2(-rz, rx) / DEG;
            const lat0 = Math.asin(Math.max(-1, Math.min(1, ry / (Math.hypot(rx, ry, rz) || 1)))) / DEG;
            const flat: number[] = [];
            for (const [lon, lat] of ll) {
                const [clon, clat] = centerLonLat(lon, lat, lon0, lat0);
                flat.push(clon, clat);
            }
            const idx = earcut(flat);
            for (let i = 0; i < idx.length; i += 3) {
                emitTriangle(unit[idx[i]], unit[idx[i + 1]], unit[idx[i + 2]], fill, SUBDIVIDE_MAX_DEPTH);
            }
        }
        const n = Math.hypot(cx, cy, cz) || 1;
        return {
            id: c.id,
            color: c.color,
            positions: new Float32Array(fill),
            outline: new Float32Array(outline),
            centroid: [cx / n, cy / n, cz / n],
        };
    });
}

export const contourRegionMeshes: ContourRegionMesh[] = build();
