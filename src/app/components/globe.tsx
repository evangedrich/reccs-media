"use client";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Dispatch, SetStateAction, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
    dotCount,
    dotPositions,
    dotRegionIds,
    dotRegionIndex,
    regionMeshes,
} from "@/app/lib/globeGeometry";

const DOT_RADIUS = 0.01;
const SPHERE_RADIUS = 1.01;
const REGION_RADIUS_OFFSET = 0.001;
const BG_RADIUS = SPHERE_RADIUS - 0.015;
const CAM_DIST = 100; // was 2.6
const AUTO_ROTATE_SPEED = 0.5;
const FOCUS_DURATION_MS = 400;
const RESUME_DELAY_MS = 3000; // was 1500

const GRATICULE_LINE_WIDTH = 1;
const GRATICULE_LAT_STEP_DEG = 15;
const GRATICULE_LON_STEP_DEG = 15;
const GRATICULE_SEGMENTS = 128;
const GRATICULE_RADIUS = SPHERE_RADIUS - 0.0005;
const GRATICULE_OPACITY = 0;

type GlobeProps = {
    currSubr: string;
    setCurrSubr: Dispatch<SetStateAction<string>>;
    setHovered: Dispatch<SetStateAction<string>>;
    hovered: string;
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
        for (const region of regionMeshes) {
            map.set(region.id, resolveColor(region.color, "#888888"));
        }
        return map;
    }, [version]);
    const bg = useMemo(
        () => resolveColor("var(--color-back)", "#181818"),
        [version]
    );
    const graticule = useMemo(
        () => resolveColor("var(--color-front)", "#888888"),
        [version]
    );
    useEffect(() => {
        const obs = new MutationObserver(() => setVersion(v => v + 1));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
        setVersion(v => v + 1);
        return () => obs.disconnect();
    }, []);
    return { colors, bg, graticule };
}

function BackgroundSphere({ color }: { color: THREE.Color }) {
    return (
        <mesh>
            <sphereGeometry args={[BG_RADIUS, 48, 48]} />
            <meshBasicMaterial color={color} />
        </mesh>
    );
}

function Graticule({ color }: { color: THREE.Color }) {
    const lineSegments = useMemo(() => {
        const positions: number[] = [];
        const r = GRATICULE_RADIUS;
        for (let lat = -90 + GRATICULE_LAT_STEP_DEG; lat < 90; lat += GRATICULE_LAT_STEP_DEG) {
            const phi = (lat * Math.PI) / 180;
            const cphi = Math.cos(phi);
            const y = Math.sin(phi) * r;
            for (let s = 0; s < GRATICULE_SEGMENTS; s++) {
                const a0 = (s / GRATICULE_SEGMENTS) * Math.PI * 2;
                const a1 = ((s + 1) / GRATICULE_SEGMENTS) * Math.PI * 2;
                positions.push(cphi * Math.cos(a0) * r, y, -cphi * Math.sin(a0) * r);
                positions.push(cphi * Math.cos(a1) * r, y, -cphi * Math.sin(a1) * r);
            }
        }
        for (let lon = -180; lon < 180; lon += GRATICULE_LON_STEP_DEG) {
            const lambda = (lon * Math.PI) / 180;
            const cl = Math.cos(lambda);
            const sl = Math.sin(lambda);
            for (let s = 0; s < GRATICULE_SEGMENTS; s++) {
                const a0 = -Math.PI / 2 + (s / GRATICULE_SEGMENTS) * Math.PI;
                const a1 = -Math.PI / 2 + ((s + 1) / GRATICULE_SEGMENTS) * Math.PI;
                const c0 = Math.cos(a0), s0 = Math.sin(a0);
                const c1 = Math.cos(a1), s1 = Math.sin(a1);
                positions.push(c0 * cl * r, s0 * r, -c0 * sl * r);
                positions.push(c1 * cl * r, s1 * r, -c1 * sl * r);
            }
        }
        return new Float32Array(positions);
    }, []);
    return (
        <lineSegments>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[lineSegments, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
                color={color}
                transparent
                opacity={GRATICULE_OPACITY}
                linewidth={GRATICULE_LINE_WIDTH}
                depthWrite={false}
            />
        </lineSegments>
    );
}

function DotLayer({ colors }: { colors: Map<string, THREE.Color> }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const obj = new THREE.Object3D();
        for (let i = 0; i < dotCount; i++) {
            obj.position.set(
                dotPositions[i * 3],
                dotPositions[i * 3 + 1],
                dotPositions[i * 3 + 2]
            );
            obj.updateMatrix();
            mesh.setMatrixAt(i, obj.matrix);
            const regionId = dotRegionIds[dotRegionIndex[i]];
            const c = colors.get(regionId) ?? new THREE.Color("#ffffff");
            mesh.setColorAt(i, c);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }, [colors]);
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, dotCount]}>
            <sphereGeometry args={[DOT_RADIUS, 6, 6]} />
            <meshBasicMaterial />
        </instancedMesh>
    );
}

function RegionMeshNode({
    region,
    color,
    active,
    setCurrSubr,
    setHovered,
}: {
    region: typeof regionMeshes[number];
    color: THREE.Color;
    active: boolean;
    setCurrSubr: Dispatch<SetStateAction<string>>;
    setHovered: Dispatch<SetStateAction<string>>;
}) {
    const positions = useMemo(() => {
        const scaled = new Float32Array(region.positions.length);
        const factor = 1 + REGION_RADIUS_OFFSET;
        for (let i = 0; i < region.positions.length; i++) scaled[i] = region.positions[i] * factor;
        return scaled;
    }, [region]);
    return (
        <mesh
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                if (e.camera.position.dot(e.point) < 0) return;
                e.stopPropagation();
                setHovered(region.id);
                document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setHovered("X");
                document.body.style.cursor = "";
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                if (e.camera.position.dot(e.point) < 0) return;
                e.stopPropagation();
                setCurrSubr(region.id);
            }}
        >
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="index" args={[region.indices, 1]} />
            </bufferGeometry>
            <meshBasicMaterial
                color={color}
                transparent
                opacity={active ? 0.25 : 0}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function RegionLayer({
    colors,
    currSubr,
    hovered,
    setCurrSubr,
    setHovered,
}: {
    colors: Map<string, THREE.Color>;
    currSubr: string;
    hovered: string;
    setCurrSubr: Dispatch<SetStateAction<string>>;
    setHovered: Dispatch<SetStateAction<string>>;
}) {
    return (
        <>
            {regionMeshes.map((region) => {
                const active = currSubr === region.id || hovered === region.id;
                const color = colors.get(region.id) ?? new THREE.Color("#ffffff");
                return (
                    <RegionMeshNode
                        key={region.id}
                        region={region}
                        color={color}
                        active={active}
                        setCurrSubr={setCurrSubr}
                        setHovered={setHovered}
                    />
                );
            })}
        </>
    );
}

function GlobeScene({ currSubr, setCurrSubr, setHovered, hovered }: GlobeProps) {
    const { colors, bg, graticule } = useResolvedColors();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const tweenRef = useRef<{
        startAz: number;
        startPol: number;
        endAz: number;
        endPol: number;
        elapsedMs: number;
    } | null>(null);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const controls = controlsRef.current;
        if (currSubr === "X" || !controls) return;
        const region = regionMeshes.find(r => r.id === currSubr);
        if (!region) return;
        const [cx, cy, cz] = region.centroid;
        const endPol = Math.acos(Math.max(-1, Math.min(1, cy)));
        const endAz = Math.atan2(cx, cz);
        const startAz = controls.getAzimuthalAngle();
        const startPol = controls.getPolarAngle();
        let normalizedEndAz = endAz;
        let dAz = normalizedEndAz - startAz;
        while (dAz > Math.PI) { normalizedEndAz -= 2 * Math.PI; dAz = normalizedEndAz - startAz; }
        while (dAz < -Math.PI) { normalizedEndAz += 2 * Math.PI; dAz = normalizedEndAz - startAz; }
        tweenRef.current = { startAz, startPol, endAz: normalizedEndAz, endPol, elapsedMs: 0 };
        setAutoRotate(false);
    }, [currSubr]);

    useEffect(() => {
        if (currSubr === "X") setAutoRotate(true);
    }, [currSubr]);

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
            <Graticule color={graticule} />
            <DotLayer colors={colors} />
            <RegionLayer
                colors={colors}
                currSubr={currSubr}
                hovered={hovered}
                setCurrSubr={setCurrSubr}
                setHovered={setHovered}
            />
            <OrbitControls
                ref={controlsRef}
                enableZoom={false}
                enablePan={false}
                autoRotate={autoRotate && currSubr === "X"}
                autoRotateSpeed={AUTO_ROTATE_SPEED}
                onStart={() => {
                    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                    tweenRef.current = null;
                    setAutoRotate(false);
                }}
                onEnd={() => {
                    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                    resumeTimerRef.current = setTimeout(() => {
                        if (currSubr === "X") setAutoRotate(true);
                    }, RESUME_DELAY_MS);
                }}
            />
        </>
    );
}

export default function Globe(props: GlobeProps) {
    return (
        <div className="w-full h-full relative">
            <Canvas
                orthographic
                camera={{ position: [0, 0, CAM_DIST], zoom: 224 }}
                flat
            >
                <ambientLight intensity={1} />
                <Suspense fallback={null}>
                    <GlobeScene {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
}
