"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { Dispatch, SetStateAction, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { contourRegionMeshes, type ContourRegionMesh } from "@/app/lib/contourGlobeGeometry";
import { regions } from "@/app/lib/subregions";

const SPHERE_RADIUS = 1;
const BG_RADIUS = SPHERE_RADIUS - 0.015;
const FILL_SCALE = SPHERE_RADIUS + 0.001;
const OUTLINE_SCALE = SPHERE_RADIUS + 0.003;
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

function ResponsiveZoom() {
    const camera = useThree(s => s.camera);
    const size = useThree(s => s.size);
    useEffect(() => {
        if (camera instanceof THREE.OrthographicCamera) {
            const fit = Math.min(size.width, size.height);
            camera.zoom = fit / (SPHERE_RADIUS * 1.96);
            camera.updateProjectionMatrix();
        }
    }, [camera, size.width, size.height]);
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

function ContourGlobeScene({ mapID, currSubrID, setCurrSubrID, hovered, setHovered }: ContourGlobeProps) {
    const { colors, bg, mid, front, gray } = useResolvedColors();
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
    }, [currSubrID, mapID, mapCentroid]);

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
    });

    return (
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
            <OrbitControls
                ref={controlsRef}
                enableZoom={false}
                enablePan={false}
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
            <Canvas orthographic camera={{ position: [0, 0, CAM_DIST], zoom: 224 }} flat>
                <ambientLight intensity={1} />
                <ResponsiveZoom />
                <Suspense fallback={null}>
                    <ContourGlobeScene {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
}
