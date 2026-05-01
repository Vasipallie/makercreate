import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function STLModel({ url }) {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        geometry.center();
        geometry.computeVertexNormals();
        geometry.scale(1, 1, 1);
        setGeometry(geometry);
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
      }
    );
  }, [url]);

  if (!geometry) {
    return <group />;
  }

  return (
    <mesh geometry={geometry} castShadow receiveShadow rotation={[Math.PI / -2, 0, 0]}>
      <meshStandardMaterial 
        color="#06b100" 
        metalness={0}
        roughness={0.9}
        envMapIntensity={1}
      />
    </mesh>
  );
}

export function STLViewer({ url }) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 200], fov:80 }}
      shadows
      gl={{ antialias: true, precision: 'highp' }}
    >
      <ambientLight intensity={0.4} />
      
      <directionalLight
        position={[0, 0, 20]}
        intensity={3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <directionalLight
        position={[0, 0, -20]}
        intensity={3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight intensity={0.6} groundColor="#ffffff" />

      <STLModel url={url} />
      
      <OrbitControls 
        autoRotate 
        autoRotateSpeed={2}
        enableDamping
        dampingFactor={0.05}
        enableZoom
      />
    </Canvas>
  );
}

export default STLViewer;
