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
const SUBDIVIDE_MAX_DEPTH = 5;

type V3 = [number, number, number];
type P2 = [number, number];

export function lonLatToUnit(lon: number, lat: number): V3 {
    const phi = lat * DEG, lam = lon * DEG, cphi = Math.cos(phi);
    return [cphi * Math.cos(lam), Math.sin(phi), -cphi * Math.sin(lam)];
}

// lon/lat re-expressed in a frame rotated so (lon0, lat0) sits at the origin
// (prime meridian / equator). Triangulating in this centered equirectangular frame
// avoids the Robinson pixel map's severe high-latitude distortion, which otherwise
// folds the lifted mesh for wide, high-latitude regions (e.g. ASNO near the Bering).
function centerLonLat(lon: number, lat: number, lon0: number, lat0: number): P2 {
    const [x, y, z] = lonLatToUnit(lon, lat);
    const a = -lon0 * DEG;
    const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a), y1 = y;
    const b = -lat0 * DEG;
    const y2 = y1 * Math.cos(b) - z1 * Math.sin(b), z2 = y1 * Math.sin(b) + z1 * Math.cos(b);
    return [Math.atan2(-z2, x1) / DEG, Math.asin(Math.max(-1, Math.min(1, y2))) / DEG];
}

// Inverse of centerLonLat: a centered lon/lat back to a world-space unit vector.
// Subdivided vertices are lifted through this so the whole fill is the equirectangular
// image of a planar triangulation (fold- and overlap-free), rather than drifting off
// it via great-circle midpoints.
function liftCentered(clon: number, clat: number, lon0: number, lat0: number): V3 {
    const [x2, y2, z2] = lonLatToUnit(clon, clat);
    const b = -lat0 * DEG;
    const x1 = x2, y1 = y2 * Math.cos(b) + z2 * Math.sin(b), z1 = -y2 * Math.sin(b) + z2 * Math.cos(b);
    const a = -lon0 * DEG;
    return [x1 * Math.cos(a) - z1 * Math.sin(a), y1, x1 * Math.sin(a) + z1 * Math.cos(a)];
}

// Push a triangle's final vertices (flat, 9 numbers) into `out`, wound so it faces
// outward from the sphere center (lets the fill render single-sided so a region's far
// side doesn't bleed through its near side).
function pushOutward(a: V3, b: V3, c: V3, out: number[]): void {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const outward = nx * (a[0] + b[0] + c[0]) + ny * (a[1] + b[1] + c[1]) + nz * (a[2] + b[2] + c[2]);
    if (outward >= 0) out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    else out.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
}

const MAX_EDGE_DEG = 10;
const mid = (p: P2, q: P2): P2 => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const tooLong = (p: P2, q: P2) => Math.hypot(p[0] - q[0], p[1] - q[1]) > MAX_EDGE_DEG;

// Red-green refinement in centered lon/lat: split ONLY the edges that are too long, so
// two triangles sharing an edge always make the same decision about it. That keeps the
// mesh conforming (no T-junction cracks) while subdividing just the few oversized
// triangles. Leaves are lifted to the sphere and emitted outward-facing.
function refine(a: P2, b: P2, c: P2, out: number[], lon0: number, lat0: number, depth: number): void {
    const lab = tooLong(a, b), lbc = tooLong(b, c), lca = tooLong(c, a);
    if (depth <= 0 || (!lab && !lbc && !lca)) {
        pushOutward(liftCentered(a[0], a[1], lon0, lat0), liftCentered(b[0], b[1], lon0, lat0), liftCentered(c[0], c[1], lon0, lat0), out);
        return;
    }
    const r = (x: P2, y: P2, z: P2) => refine(x, y, z, out, lon0, lat0, depth - 1);
    const n = (lab ? 1 : 0) + (lbc ? 1 : 0) + (lca ? 1 : 0);
    if (n === 3) {
        const mab = mid(a, b), mbc = mid(b, c), mca = mid(c, a);
        r(a, mab, mca); r(mab, b, mbc); r(mca, mbc, c); r(mab, mbc, mca);
    } else if (n === 1) {
        if (lab) { const m = mid(a, b); r(a, m, c); r(m, b, c); }
        else if (lbc) { const m = mid(b, c); r(a, b, m); r(a, m, c); }
        else { const m = mid(c, a); r(a, b, m); r(b, c, m); }
    } else { // n === 2: split the two long edges (they share a vertex)
        if (lab && lbc) { const mab = mid(a, b), mbc = mid(b, c); r(mab, b, mbc); r(a, mab, mbc); r(a, mbc, c); }
        else if (lbc && lca) { const mbc = mid(b, c), mca = mid(c, a); r(mbc, c, mca); r(a, b, mbc); r(a, mbc, mca); }
        else { const mab = mid(a, b), mca = mid(c, a); r(a, mab, mca); r(mab, b, c); r(mab, c, mca); }
    }
}

export type ContourRegionMesh = {
    id: string;
    color: string;
    positions: Float32Array; // triangle fill, non-indexed
    outline: Float32Array;   // line segments (pairs of points)
    centroid: V3;            // unit vector, region center (for rotate-to-face)
};

// Shoelace area in pixel space; sign encodes winding, magnitude ranks nesting.
function signedArea(ring: P2[]): number {
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
}

// Ray-cast point-in-polygon in pixel space, used to detect which rings nest inside
// which (a ring drawn inside another is a lake/hole, not a separate island).
function pointInRing(pt: P2, ring: P2[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

type ClassifiedRing = { px: P2[]; ll: P2[]; unit: V3[]; area: number; hole: boolean; parent: number };

// Classify a region's rings the way the flat map's SVG fill-rule does: a ring nested
// inside an odd number of others is a hole (great lakes), otherwise it is a solid
// outer ring (continent or island). Each hole records its immediate container so it can
// be triangulated together with that outer ring, leaving the cutout empty.
function classifyRings(rings: { px: P2[]; ll: P2[]; unit: V3[] }[]): ClassifiedRing[] {
    return rings.map((r, i) => {
        const area = signedArea(r.px);
        const containers: number[] = [];
        for (let j = 0; j < rings.length; j++) {
            if (j === i) continue;
            if (Math.abs(signedArea(rings[j].px)) > Math.abs(area) && pointInRing(r.px[0], rings[j].px)) containers.push(j);
        }
        // Immediate container = the smallest-area (innermost) ring enclosing this one.
        let parent = -1;
        for (const j of containers) if (parent < 0 || Math.abs(signedArea(rings[j].px)) < Math.abs(signedArea(rings[parent].px))) parent = j;
        return { ...r, area, hole: containers.length % 2 === 1, parent };
    });
}

function build(): ContourRegionMesh[] {
    return allContours.map(c => {
        const fill: number[] = [];
        const outline: number[] = [];
        let cx = 0, cy = 0, cz = 0;

        const rings = classifyRings(
            parseContourRings(c.d)
                .filter(ring => ring.length >= 2)
                .map(ring => {
                    const ll = ring.map(([px, py]) => contourPixelToLonLat(px, py));
                    return { px: ring, ll, unit: ll.map(([lon, lat]) => lonLatToUnit(lon, lat)) };
                })
        );

        // Outlines + centroid over every ring (holes are stroked too, matching the flat map).
        for (const { unit } of rings) {
            for (let i = 0; i < unit.length; i++) {
                const a = unit[i], b = unit[(i + 1) % unit.length];
                outline.push(a[0], a[1], a[2], b[0], b[1], b[2]);
                cx += a[0]; cy += a[1]; cz += a[2];
            }
        }

        // Fill each solid outer ring together with its holes, so cutouts stay empty
        // instead of being filled a second time (double-dark). Triangulate in a frame
        // centered on the outer ring (see centerLonLat): valid and low-distortion, so
        // the lifted mesh doesn't fold. Vertices are still lifted from their true
        // lon/lat below, so placement is unchanged.
        for (let ri = 0; ri < rings.length; ri++) {
            if (rings[ri].hole || rings[ri].ll.length < 3) continue;
            const { unit, ll } = rings[ri];
            let rx = 0, ry = 0, rz = 0;
            for (const u of unit) { rx += u[0]; ry += u[1]; rz += u[2]; }
            const lon0 = Math.atan2(-rz, rx) / DEG;
            const lat0 = Math.asin(Math.max(-1, Math.min(1, ry / (Math.hypot(rx, ry, rz) || 1)))) / DEG;
            const cl: P2[] = ll.map(([lon, lat]) => centerLonLat(lon, lat, lon0, lat0));
            const holeIndices: number[] = [];
            for (let hi = 0; hi < rings.length; hi++) {
                if (!rings[hi].hole || rings[hi].parent !== ri || rings[hi].ll.length < 3) continue;
                holeIndices.push(cl.length);
                for (const [lon, lat] of rings[hi].ll) cl.push(centerLonLat(lon, lat, lon0, lat0));
            }
            const idx = earcut(cl.flat(), holeIndices.length ? holeIndices : undefined);
            for (let i = 0; i < idx.length; i += 3) {
                refine(cl[idx[i]], cl[idx[i + 1]], cl[idx[i + 2]], fill, lon0, lat0, SUBDIVIDE_MAX_DEPTH);
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
