"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, useTexture } from "@react-three/drei";
import { Dispatch, SetStateAction, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { contourRegionMeshes, type ContourRegionMesh } from "@/app/lib/contourGlobeGeometry";
import { dotPositions, dotRegionIndex, dotRegionIds, dotCount, contourDotRegionMeshes } from "@/app/lib/contourDotGeometry";
import { regions } from "@/app/lib/subregions";


const SPHERE_RADIUS = 1;
const BG_RADIUS = SPHERE_RADIUS - 0.015;
const FILL_SCALE = SPHERE_RADIUS + 0.001;
const OUTLINE_SCALE = SPHERE_RADIUS + 0.003;
const DOT_RADIUS = 0.009;      // dot sphere radius (scaled with the tightened grid spacing)
const DOT_OVERLAY_SCALE = SPHERE_RADIUS + 0.004; // honeycomb overlay sits just above the dots
const INACTIVE_DOT_OPACITY = 0.5;
const CAM_DIST = 100;
const AUTO_ROTATE_SPEED = 0.5;
const FOCUS_DURATION_MS = 400;
const RESUME_DELAY_MS = 3000;
const LINE_WIDTH = 1.5; // contour outline thickness, in screen pixels
// Slow auto-rotation is kept wired up but disabled: when nothing is selected we hold
// the globe centered on the mapID region instead. Flip to true to spin again.
const AUTO_ROTATE_ENABLED = false;

// Same inputs/interaction as <DynamicContourMap />: hover highlight, fill-on-select,
// clicks only on subregions belonging to mapID. Instead of cropping, selecting a
// subregion rotates the globe so that region faces the camera.
type ContourGlobeProps = {
    mapID: string;
    mapMode: number; // 0 = contour view (VIEW 1), 1 = satellite view (VIEW 2)
    currSubrID: string | null;
    setCurrSubrID: Dispatch<SetStateAction<string | null>>;
    hovered: string | null;
    setHovered: Dispatch<SetStateAction<string | null>>;
};

function resolveColor(cssValue: string, fallback: string): THREE.Color {
    const trimmed = cssValue.trim();
    const match = trimmed.match(/^var\((--[a-zA-Z0-9-]+)\)$/);
    if (match && typeof window !== "undefined") {
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
        if (resolved) return new THREE.Color(resolved);
    }
    if (trimmed.startsWith("#") || trimmed.startsWith("rgb")) return new THREE.Color(trimmed);
    return new THREE.Color(fallback);
}

function useResolvedColors() {
    const [version, setVersion] = useState(0);
    const colors = useMemo(() => {
        const map = new Map<string, THREE.Color>();
        for (const region of contourRegionMeshes) map.set(region.id, resolveColor(region.color, "#888888"));
        return map;
    }, [version]);
    const ui = useMemo(() => ({
        bg: resolveColor("var(--color-back)", "#181818"),
        mid: resolveColor("var(--color-mid)", "#888888"),
        front: resolveColor("var(--color-front)", "#eeeeee"),
        gray: new THREE.Color("gray"),
    }), [version]);
    useEffect(() => {
        const obs = new MutationObserver(() => setVersion(v => v + 1));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
        setVersion(v => v + 1);
        return () => obs.disconnect();
    }, []);
    return { colors, ...ui };
}

// Orthographic zoom (pixels per world unit) that fits the unit sphere to the smaller
// container dimension with a small margin. Applied both at canvas creation (onCreated,
// so the first painted frame is already correctly sized) and on resize (below).
function fitZoom(width: number, height: number): number {
    return Math.min(width, height) / (SPHERE_RADIUS * 1.96);
}

function ResponsiveZoom() {
    const camera = useThree(s => s.camera);
    const size = useThree(s => s.size);
    const invalidate = useThree(s => s.invalidate);
    // useLayoutEffect so a resize re-zooms before the browser paints (no visible jump).
    useLayoutEffect(() => {
        if (camera instanceof THREE.OrthographicCamera) {
            camera.zoom = fitZoom(size.width, size.height);
            camera.updateProjectionMatrix();
            invalidate(); // demand frameloop: redraw after an imperative camera change
        }
    }, [camera, size.width, size.height, invalidate]);
    return null;
}

function BackgroundSphere({ color }: { color: THREE.Color }) {
    return (
        <mesh>
            <sphereGeometry args={[BG_RADIUS, 48, 48]} />
            <meshBasicMaterial color={color} />
        </mesh>
    );
}

function RegionNode({
    region,
    isActive,
    selected,
    hovered,
    fillColor,
    outlineColor,
    setCurrSubrID,
    setHovered,
    currSubrID,
}: {
    region: ContourRegionMesh;
    isActive: boolean;
    selected: boolean;
    hovered: boolean;
    fillColor: THREE.Color;
    outlineColor: THREE.Color;
    setCurrSubrID: Dispatch<SetStateAction<string | null>>;
    setHovered: Dispatch<SetStateAction<string | null>>;
    currSubrID: string | null;
}) {
    const opacity = selected ? 0.25 : hovered && isActive ? 0.1 : 0;
    const outlinePoints = useMemo(() => {
        const pts: [number, number, number][] = [];
        for (let i = 0; i < region.outline.length; i += 3) {
            pts.push([region.outline[i], region.outline[i + 1], region.outline[i + 2]]);
        }
        return pts;
    }, [region]);
    return (
        <group>
            <mesh
                scale={FILL_SCALE}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                    if (e.camera.position.dot(e.point) < 0) return;
                    e.stopPropagation();
                    setHovered(region.id);
                    if (isActive) document.body.style.cursor = "pointer";
                }}
                onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                    e.stopPropagation();
                    setHovered(null);
                    document.body.style.cursor = "";
                }}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    if (e.camera.position.dot(e.point) < 0) return;
                    if (!isActive) return;
                    e.stopPropagation();
                    setCurrSubrID(region.id === currSubrID ? null : region.id);
                }}
            >
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[region.positions, 3]} />
                </bufferGeometry>
                <meshBasicMaterial color={fillColor} transparent opacity={opacity} side={THREE.FrontSide} depthWrite={false} />
            </mesh>
            <group scale={OUTLINE_SCALE}>
                <Line points={outlinePoints} color={outlineColor} lineWidth={LINE_WIDTH} segments />
            </group>
        </group>
    );
}

// ===================================================================
//  VIEW 2 — Satellite view (mapMode === 1)
// ===================================================================
// The Blue Marble equirectangular image is draped on the sphere and the region
// contours act purely as a selection overlay. The default sphere UVs share the
// same lon/lat convention as contourGlobeGeometry's lonLatToUnit, so the texture
// aligns with the contours without any rotation offset (the contour projection is
// coastline-calibrated, see contourProjection.ts).

function useBlueMarble() {
    const texture = useTexture("/textures/blueMarble.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
}

function SatelliteSphere() {
    const texture = useBlueMarble();
    return (
        <mesh renderOrder={0}>
            <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
}

// Dark overlay dimming the whole near hemisphere while a region is selected; the
// selected region's full-brightness textured fill renders above it. depthTest is
// off so it shades uniformly instead of z-fighting the satellite sphere.
function ShadeOverlay() {
    return (
        <mesh renderOrder={1}>
            <sphereGeometry args={[SPHERE_RADIUS + 0.002, 64, 64]} />
            <meshBasicMaterial color="black" transparent opacity={0.55} depthWrite={false} depthTest={false} />
        </mesh>
    );
}

// Equirectangular UVs matching the (rotated) satellite sphere, so the selected
// region's fill reproduces the underlying image at full brightness — i.e. the
// region simply isn't dimmed by the shade, giving a clean spotlight look.
function fillUVs(positions: Float32Array): Float32Array {
    const uv = new Float32Array((positions.length / 3) * 2);
    for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
        const lam = Math.atan2(-positions[i + 2], positions[i]);
        uv[j] = lam / (2 * Math.PI) + 0.5;
        uv[j + 1] = 0.5 + Math.asin(Math.max(-1, Math.min(1, positions[i + 1]))) / Math.PI;
    }
    return uv;
}

// Outline points (segment pairs) with every long edge slerp-subdivided so it follows
// the sphere surface instead of chording through it. A single long straight edge (e.g.
// the near-polar AMNO/AMIN boundary) otherwise dips below the satellite sphere and gets
// occluded; short great-circle steps keep it hugging the surface.
function greatCircleOutline(outline: Float32Array, maxDeg = 3): [number, number, number][] {
    const pts: [number, number, number][] = [];
    const maxRad = (maxDeg * Math.PI) / 180;
    for (let i = 0; i < outline.length; i += 6) {
        const ax = outline[i], ay = outline[i + 1], az = outline[i + 2];
        const bx = outline[i + 3], by = outline[i + 4], bz = outline[i + 5];
        const ang = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz)));
        const n = Math.max(1, Math.ceil(ang / maxRad));
        const sinA = Math.sin(ang);
        let prev: [number, number, number] = [ax, ay, az];
        for (let s = 1; s <= n; s++) {
            const t = s / n;
            let cur: [number, number, number];
            if (sinA < 1e-6) cur = [bx, by, bz];
            else {
                const w0 = Math.sin((1 - t) * ang) / sinA, w1 = Math.sin(t * ang) / sinA;
                cur = [w0 * ax + w1 * bx, w0 * ay + w1 * by, w0 * az + w1 * bz];
            }
            pts.push(prev, cur);
            prev = cur;
        }
    }
    return pts;
}

// Only rendered for active regions, so inactive regions are inherently
// non-hoverable/non-selectable. Same fill geometry + pointer/click logic as
// RegionNode; the fill is an invisible hit target unless selected.
function SatelliteRegionNode({
    region,
    selected,
    hovered,
    anyHovered,
    someSelected,
    setCurrSubrID,
    setHovered,
    currSubrID,
}: {
    region: ContourRegionMesh;
    selected: boolean;
    hovered: boolean;
    anyHovered: boolean;
    someSelected: boolean;
    setCurrSubrID: Dispatch<SetStateAction<string | null>>;
    setHovered: Dispatch<SetStateAction<string | null>>;
    currSubrID: string | null;
}) {
    const texture = useBlueMarble();
    const outlinePoints = useMemo(() => greatCircleOutline(region.outline), [region]);
    const uv = useMemo(() => fillUVs(region.positions), [region]);
    // idle → every active region's outline; hover or a selection → only the hovered region's;
    // the selected region itself never shows an outline (its bright fill marks it instead).
    const showOutline = selected ? false : (someSelected || anyHovered) ? hovered : true;
    return (
        <group>
            <mesh
                scale={FILL_SCALE}
                renderOrder={2}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                    if (e.camera.position.dot(e.point) < 0) return;
                    e.stopPropagation();
                    setHovered(region.id);
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                    e.stopPropagation();
                    setHovered(null);
                    document.body.style.cursor = "";
                }}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    if (e.camera.position.dot(e.point) < 0) return;
                    e.stopPropagation();
                    setCurrSubrID(region.id === currSubrID ? null : region.id);
                }}
            >
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[region.positions, 3]} />
                    <bufferAttribute attach="attributes-uv" args={[uv, 2]} />
                </bufferGeometry>
                {/* selected → full-brightness satellite fill; otherwise an invisible hit
                    target. depthTest off so the coarse fill can't z-fight the satellite
                    sphere (blotches). */}
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={selected ? 1 : 0}
                    side={THREE.FrontSide}
                    depthWrite={false}
                    depthTest={!selected}
                />
            </mesh>
            {showOutline && (
                <Line points={outlinePoints} color="rgb(160,160,160)" lineWidth={LINE_WIDTH} transparent opacity={1} renderOrder={4} scale={OUTLINE_SCALE} segments />
            )}
        </group>
    );
}

// ===================================================================
//  VIEW: Dot map (mapMode === 1)
// ===================================================================
// Hex-packed dots filling each region (contourDotGeometry, from the same allContours data),
// plus a honeycomb overlay per active region as the semi-opaque hover/select target.

// Two InstancedMeshes so active-region dots render at full colour and inactive regions at 50%
// opacity of their own colour. The split depends only on mapID, so it's static per page.
function DotLayers({ colors, mapID }: { colors: Map<string, THREE.Color>; mapID: string }) {
    const activeRef = useRef<THREE.InstancedMesh>(null);
    const inactiveRef = useRef<THREE.InstancedMesh>(null);
    const { activeIdx, inactiveIdx } = useMemo(() => {
        const codes = regions.find(r => r.id === mapID)?.code ?? [];
        const a: number[] = [], n: number[] = [];
        for (let i = 0; i < dotCount; i++) {
            (codes.includes(dotRegionIds[dotRegionIndex[i]].slice(0, 2).toUpperCase()) ? a : n).push(i);
        }
        return { activeIdx: a, inactiveIdx: n };
    }, [mapID]);
    useEffect(() => {
        const obj = new THREE.Object3D();
        const fill = (mesh: THREE.InstancedMesh | null, idxs: number[]) => {
            if (!mesh) return;
            idxs.forEach((di, i) => {
                obj.position.set(dotPositions[di * 3], dotPositions[di * 3 + 1], dotPositions[di * 3 + 2]);
                obj.updateMatrix();
                mesh.setMatrixAt(i, obj.matrix);
                mesh.setColorAt(i, colors.get(dotRegionIds[dotRegionIndex[di]]) ?? new THREE.Color("#ffffff"));
            });
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        };
        fill(activeRef.current, activeIdx);
        fill(inactiveRef.current, inactiveIdx);
    }, [colors, activeIdx, inactiveIdx]);
    return (
        <>
            {activeIdx.length > 0 && (
                <instancedMesh key={`a${activeIdx.length}`} ref={activeRef} args={[undefined, undefined, activeIdx.length]}>
                    <sphereGeometry args={[DOT_RADIUS, 6, 6]} />
                    <meshBasicMaterial />
                </instancedMesh>
            )}
            {inactiveIdx.length > 0 && (
                <instancedMesh key={`i${inactiveIdx.length}`} ref={inactiveRef} args={[undefined, undefined, inactiveIdx.length]}>
                    <sphereGeometry args={[DOT_RADIUS, 6, 6]} />
                    <meshBasicMaterial transparent opacity={INACTIVE_DOT_OPACITY} />
                </instancedMesh>
            )}
        </>
    );
}

// Semi-opaque honeycomb overlay for one active region: the hover/click target (opacity 0.25 when
// hovered or selected, invisible but still hit-testable otherwise). Same interaction as RegionNode.
function DotRegionNode({
    region,
    color,
    active,
    setCurrSubrID,
    setHovered,
    currSubrID,
}: {
    region: (typeof contourDotRegionMeshes)[number];
    color: THREE.Color;
    active: boolean;
    setCurrSubrID: Dispatch<SetStateAction<string | null>>;
    setHovered: Dispatch<SetStateAction<string | null>>;
    currSubrID: string | null;
}) {
    return (
        <mesh
            scale={DOT_OVERLAY_SCALE}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                if (e.camera.position.dot(e.point) < 0) return;
                e.stopPropagation();
                setHovered(region.id);
                document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setHovered(null);
                document.body.style.cursor = "";
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                if (e.camera.position.dot(e.point) < 0) return;
                e.stopPropagation();
                setCurrSubrID(region.id === currSubrID ? null : region.id);
            }}
        >
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[region.positions, 3]} />
                <bufferAttribute attach="index" args={[region.indices, 1]} />
            </bufferGeometry>
            <meshBasicMaterial color={color} transparent opacity={active ? 0.25 : 0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
    );
}

// ===================================================================
//  Shared scene (all views)
// ===================================================================

function ContourGlobeScene({ mapID, mapMode, currSubrID, setCurrSubrID, hovered, setHovered }: ContourGlobeProps) {
    const { colors, bg, mid, front, gray } = useResolvedColors();
    const invalidate = useThree(s => s.invalidate);
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const tweenRef = useRef<{ startAz: number; startPol: number; endAz: number; endPol: number; elapsedMs: number } | null>(null);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isRegion = (id: string) => regions.find(r => r.id === mapID)?.code?.includes(id.slice(0, 2).toUpperCase()) ?? false;

    // Center of the whole active region (mapID): used when no subregion is selected.
    const mapCentroid = useMemo<[number, number, number]>(() => {
        const codes = regions.find(r => r.id === mapID)?.code ?? [];
        let x = 0, y = 0, z = 0;
        for (const r of contourRegionMeshes) {
            if (!codes.includes(r.id.slice(0, 2).toUpperCase())) continue;
            x += r.centroid[0]; y += r.centroid[1]; z += r.centroid[2];
        }
        const n = Math.hypot(x, y, z) || 1;
        return [x / n, y / n, z / n];
    }, [mapID]);

    // Rotate to face the selected subregion, or the whole mapID region when nothing is
    // selected. Auto-rotation (kept wired below) takes over only if re-enabled.
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        if (AUTO_ROTATE_ENABLED && currSubrID === null) { setAutoRotate(true); return; }
        setAutoRotate(false);
        const target = currSubrID !== null
            ? contourRegionMeshes.find(r => r.id === currSubrID)?.centroid
            : mapCentroid;
        if (!target) return;
        const [cx, cy, cz] = target;
        const endPol = Math.acos(Math.max(-1, Math.min(1, cy)));
        const endAz = Math.atan2(cx, cz);
        const startAz = controls.getAzimuthalAngle();
        const startPol = controls.getPolarAngle();
        let normalizedEndAz = endAz;
        let dAz = normalizedEndAz - startAz;
        while (dAz > Math.PI) { normalizedEndAz -= 2 * Math.PI; dAz = normalizedEndAz - startAz; }
        while (dAz < -Math.PI) { normalizedEndAz += 2 * Math.PI; dAz = normalizedEndAz - startAz; }
        tweenRef.current = { startAz, startPol, endAz: normalizedEndAz, endPol, elapsedMs: 0 };
        invalidate(); // demand frameloop: start driving the focus animation
    }, [currSubrID, mapID, mapCentroid, invalidate]);

    useFrame((_, delta) => {
        const controls = controlsRef.current;
        const tween = tweenRef.current;
        if (!controls || !tween) return;
        tween.elapsedMs += delta * 1000;
        const t = Math.min(tween.elapsedMs / FOCUS_DURATION_MS, 1);
        const eased = t * t * (3 - 2 * t);
        controls.setAzimuthalAngle(tween.startAz + (tween.endAz - tween.startAz) * eased);
        controls.setPolarAngle(tween.startPol + (tween.endPol - tween.startPol) * eased);
        if (t >= 1) tweenRef.current = null;
        else invalidate(); // keep requesting frames until the tween completes
    });

    const someSelected = currSubrID !== null;
    const anyHovered = hovered !== null;

    return (
        <>
            {mapMode === 2 ? (
                // VIEW 3 — satellite: textured sphere + contours as a selection overlay,
                // rendered only for active regions (inactive ones are non-interactive).
                <>
                    <SatelliteSphere />
                    {someSelected && <ShadeOverlay />}
                    {contourRegionMeshes.filter(region => isRegion(region.id)).map(region => (
                        <SatelliteRegionNode
                            key={region.id}
                            region={region}
                            selected={currSubrID === region.id}
                            hovered={hovered === region.id}
                            anyHovered={anyHovered}
                            someSelected={someSelected}
                            setCurrSubrID={setCurrSubrID}
                            setHovered={setHovered}
                            currSubrID={currSubrID}
                        />
                    ))}
                </>
            ) : mapMode === 1 ? (
                // VIEW 2 — dot map: hex dots over a background sphere, honeycomb overlay per
                // active region as the selection target (inactive regions are non-interactive).
                <>
                    <BackgroundSphere color={bg} />
                    <DotLayers colors={colors} mapID={mapID} />
                    {contourDotRegionMeshes.filter(region => isRegion(region.id)).map(region => (
                        <DotRegionNode
                            key={region.id}
                            region={region}
                            color={colors.get(region.id) ?? mid}
                            active={hovered === region.id || currSubrID === region.id}
                            setCurrSubrID={setCurrSubrID}
                            setHovered={setHovered}
                            currSubrID={currSubrID}
                        />
                    ))}
                </>
            ) : (
                // VIEW 1 — contour globe (original)
                <>
                    <BackgroundSphere color={bg} />
                    {contourRegionMeshes.map(region => {
                        const active = isRegion(region.id);
                        const selected = currSubrID === region.id;
                        return (
                            <RegionNode
                                key={region.id}
                                region={region}
                                isActive={active}
                                selected={selected}
                                hovered={hovered === region.id}
                                fillColor={selected ? (colors.get(region.id) ?? mid) : mid}
                                outlineColor={active ? front : gray}
                                setCurrSubrID={setCurrSubrID}
                                setHovered={setHovered}
                                currSubrID={currSubrID}
                            />
                        );
                    })}
                </>
            )}
            <OrbitControls
                ref={controlsRef}
                enableZoom={false}
                enablePan={false}
                // drei defaults enableDamping to true, which runs controls.update() every
                // frame and re-invalidates the scene — defeating frameloop="demand" and
                // pinning the GPU at ~60fps forever. Off = the globe renders only on
                // interaction/tween, then rests at 0 draw calls when idle.
                enableDamping={false}
                autoRotate={AUTO_ROTATE_ENABLED && autoRotate && currSubrID === null}
                autoRotateSpeed={AUTO_ROTATE_SPEED}
                onStart={() => {
                    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                    tweenRef.current = null;
                    setAutoRotate(false);
                }}
                onEnd={() => {
                    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                    resumeTimerRef.current = setTimeout(() => {
                        if (AUTO_ROTATE_ENABLED && currSubrID === null) setAutoRotate(true);
                    }, RESUME_DELAY_MS);
                }}
            />
        </>
    );
}

export default function ContourGlobe(props: ContourGlobeProps) {
    return (
        <div className="w-full h-full relative">
            <Canvas
                orthographic
                camera={{ position: [0, 0, CAM_DIST], zoom: 224 }}
                flat
                frameloop="demand"
                // Size the camera from the measured container before the first render so the
                // globe appears already filling its container (no initial small-then-jump).
                onCreated={({ camera, size }) => {
                    if (camera instanceof THREE.OrthographicCamera) {
                        camera.zoom = fitZoom(size.width, size.height);
                        camera.updateProjectionMatrix();
                    }
                }}
            >
                <ambientLight intensity={1} />
                <ResponsiveZoom />
                <Suspense fallback={null}>
                    <ContourGlobeScene {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
}
