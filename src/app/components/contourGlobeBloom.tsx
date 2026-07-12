"use client";

// Split out so @react-three/postprocessing (a large dep) is code-split via React.lazy
// and only fetched when the user opens the satellite view, not on every regions page load.
import { EffectComposer, SelectiveBloom } from "@react-three/postprocessing";
import type { Object3D } from "three";

export default function ContourGlobeBloom({
    enabled,
    selection,
    lights,
}: {
    enabled: boolean;
    selection: Object3D[];
    lights: Object3D[];
}) {
    return (
        <EffectComposer enabled={enabled} multisampling={4}>
            <SelectiveBloom selection={selection} lights={lights} luminanceThreshold={0} luminanceSmoothing={0.1} intensity={1.4} radius={0.7} mipmapBlur />
        </EffectComposer>
    );
}
