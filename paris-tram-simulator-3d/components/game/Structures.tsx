import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import TramMesh from './TramMesh';

// Tram Garage Component
export const TramGarage: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation = 0 }) => {
    return (
        <group position={position} rotation-y={rotation}>
            {/* Garage Walls */}
            <mesh position={[-19.5, 4, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 8, 30]} />
                <meshStandardMaterial color="#556677" roughness={0.7} />
            </mesh>
            <mesh position={[19.5, 4, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 8, 30]} />
                <meshStandardMaterial color="#556677" roughness={0.7} />
            </mesh>
            <mesh position={[0, 4, -14.5]} castShadow receiveShadow>
                <boxGeometry args={[38, 8, 1]} />
                <meshStandardMaterial color="#556677" roughness={0.7} />
            </mesh>
            {/* Front Header */}
            <mesh position={[0, 7, 14.5]} castShadow receiveShadow>
                <boxGeometry args={[38, 2, 1]} />
                <meshStandardMaterial color="#556677" roughness={0.7} />
            </mesh>

            {/* Interior Floor */}
            <mesh position={[0, 0.1, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Openings (visualized as black voids or just assume open front) */}
            {/* Door is 90% open (only 10% visible at top) */}
            <mesh position={[0, 5.7, 15.1]}>
                <planeGeometry args={[36, 0.6]} />
                <meshBasicMaterial color="#111" />
            </mesh>

            {/* Roof Details */}
            <mesh position={[0, 8.2, 0]}>
                <boxGeometry args={[42, 0.4, 32]} />
                <meshStandardMaterial color="#334455" />
            </mesh>

            {/* Inactive Trams */}
            <group position={[-10, 0, 5]} rotation-y={-Math.PI / 2}>
                <TramMesh variant="rubber_tyred" />
            </group>
            <group position={[0, 0, -5]} rotation-y={-Math.PI / 2}>
                <TramMesh variant="express" />
            </group>
            <group position={[10, 0, 5]} rotation-y={-Math.PI / 2}>
                <TramMesh variant="tram_train" />
            </group>
        </group>
    );
};

// Tram Wash Component
export const TramWash: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation = 0 }) => {
    const brushRef1 = useRef<THREE.Mesh>(null);
    const brushRef2 = useRef<THREE.Mesh>(null);
    const topBrushRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);

    // Particle System for Water
    const particleCount = 100;
    const particles = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4; // x
            positions[i * 3 + 1] = Math.random() * 4;       // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4; // z
            speeds[i] = 1 + Math.random();
        }
        return { positions, speeds };
    }, []);

    useFrame((state, delta) => {
        // Spin Brushes
        if (brushRef1.current) brushRef1.current.rotation.y += delta * 5;
        if (brushRef2.current) brushRef2.current.rotation.y -= delta * 5;
        if (topBrushRef.current) topBrushRef.current.rotation.x += delta * 5;

        // Animate Water
        if (particlesRef.current) {
            const posAttr = particlesRef.current.geometry.attributes.position;
            const array = posAttr.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                // Drop water down
                array[i * 3 + 1] -= particles.speeds[i] * delta * 5;
                if (array[i * 3 + 1] < 0) {
                    array[i * 3 + 1] = 4;
                    // Reset to top with random x/z
                    array[i * 3] = (Math.random() - 0.5) * 3;
                    array[i * 3 + 2] = (Math.random() - 0.5) * 2;
                }
                // Squirting effect (horizontal movement)
                array[i * 3] += (Math.random() - 0.5) * 5 * delta;
            }
            posAttr.needsUpdate = true;
        }
    });

    return (
        <group position={position} rotation-y={rotation} scale={[1.2, 1.2, 1.2]}>
            {/* Frame Structure */}
            <mesh position={[-3.5, 2.5, 0]}>
                <boxGeometry args={[0.5, 5, 2]} />
                <meshStandardMaterial color="#888" />
            </mesh>
            <mesh position={[3.5, 2.5, 0]}>
                <boxGeometry args={[0.5, 5, 2]} />
                <meshStandardMaterial color="#888" />
            </mesh>
            <mesh position={[0, 5.25, 0]}>
                <boxGeometry args={[7.5, 0.5, 2]} />
                <meshStandardMaterial color="#888" />
            </mesh>

            {/* Base */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[8, 0.2, 10]} />
                <meshStandardMaterial color="#555" />
            </mesh>

            {/* Vertical Brushes */}
            <mesh ref={brushRef1} position={[-2, 2.5, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 4, 16]} />
                <meshStandardMaterial color="#3355ff" roughness={1} />
            </mesh>
            <mesh ref={brushRef2} position={[2, 2.5, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 4, 16]} />
                <meshStandardMaterial color="#3355ff" roughness={1} />
            </mesh>

            {/* Top Brush */}
            <mesh ref={topBrushRef} position={[0, 4, 0]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.5, 0.5, 4, 16]} />
                <meshStandardMaterial color="#3355ff" />
            </mesh>

            {/* Water Particles */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={particles.positions}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial color="#aaf" size={0.15} transparent opacity={0.6} />
            </points>
        </group>
    );
};
