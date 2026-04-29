'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

const getColorHex = (colorName: string) => {
  switch (colorName) {
    case 'Red':
      return '#ef4444';
    case 'Blue':
      return '#3b82f6';
    case 'Black':
      return '#18181b';
    case 'White':
      return '#f8fafc';
    case 'Silver':
      return '#94a3b8';
    case 'Gray':
      return '#475569';
    default:
      return '#ffffff';
  }
};

function CarModel({ color }: { color: string }) {
  const { scene } = useGLTF('/suv_model.glb');

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material.color.set(getColorHex(color));
      }
    });
  }, [color, scene]);

  return <primitive object={scene} />;
}

export default function DigitalTwin({ color }: { color: string }) {
  return <Canvas camera={{ position: [2.8, 1.4, 3.2], fov: 45 }}><ambientLight intensity={0.9} /><Environment preset="city" /><OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} /><CarModel color={color} /><ContactShadows position={[0, -1.1, 0]} opacity={0.35} blur={2.5} scale={8} far={3.5} /></Canvas>;
}
