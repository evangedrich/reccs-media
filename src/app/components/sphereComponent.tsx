import { useTexture, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export function SphereComponent() {
  const texture = useTexture("/textures/map.png");
  const { viewport } = useThree();
  const radius = Math.min(viewport.width, viewport.height) / 2;

  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <OrbitControls enableZoom={false} />
    </>
  );
}