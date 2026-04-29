"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SphereComponent } from "./sphereComponent";

export default function Globe() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 10], fov: 0 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} />
        <Suspense fallback={null}>
          <SphereComponent />
        </Suspense>
      </Canvas>
    </div>
  );
}