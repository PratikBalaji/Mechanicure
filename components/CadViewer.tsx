'use client';

import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Bounds, OrbitControls, Stage } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';

function STLModel({ url }: { url: string }) {
  const geom = useLoader(STLLoader, url);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#22d3ee" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export default function CadViewer({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.5}>
          <Bounds fit clip observe margin={1.4}>
            <STLModel url={url} />
          </Bounds>
        </Stage>
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
    </Canvas>
  );
}
