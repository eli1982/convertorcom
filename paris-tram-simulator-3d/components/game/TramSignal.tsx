import React, { useMemo } from 'react';
import * as THREE from 'three';

export type SignalMode = 'STOP' | 'SLOW' | 'GO_STRAIGHT' | 'GO_LEFT' | 'GO_RIGHT';

interface TramSignalProps {
    position: [number, number, number];
    rotation: number; // Y rotation in radians
    mode: SignalMode;
}

const TramSignal: React.FC<TramSignalProps> = ({ position, rotation, mode }) => {
    // Signal colors
    const activeColor = "#ffffff";
    const inactiveColor = "#222222";
    const glowIntensity = 2.5;

    return (
        <group position={position} rotation-y={rotation}>
            {/* Pole */}
            <mesh position={[0, 2.75, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.15, 5.5, 8]} />
                <meshStandardMaterial color="#222" roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Signal Box */}
            <group position={[0, 5.5, 0.15]} scale={[1.4, 1.4, 1.4]}>
                <mesh castShadow>
                    <boxGeometry args={[0.5, 0.7, 0.3]} />
                    <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
                </mesh>

                {/* Bezel/Frame for visibility */}
                <mesh position={[0, 0, 0.155]}>
                    <planeGeometry args={[0.48, 0.68]} />
                    <meshBasicMaterial color="#333" />
                </mesh>

                {/* Signal Face (Black background for lights) */}
                <mesh position={[0, 0, 0.16]}>
                    <planeGeometry args={[0.42, 0.62]} />
                    <meshBasicMaterial color="#000" />
                </mesh>

                {/* STOP (Horizontal Bar) */}
                <group position={[0, 0.18, 0.17]}>
                    <mesh>
                        <planeGeometry args={[0.3, 0.06]} />
                        <meshBasicMaterial
                            color={mode === 'STOP' ? activeColor : inactiveColor}
                            toneMapped={false}
                        />
                    </mesh>
                    {mode === 'STOP' && (
                        <mesh scale={[1.5, 2, 1]}>
                            <planeGeometry args={[0.3, 0.06]} />
                            <meshBasicMaterial color={activeColor} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
                        </mesh>
                    )}
                </group>

                {/* SLOW (Dot) */}
                <group position={[0, 0, 0.17]}>
                    <mesh>
                        <circleGeometry args={[0.06, 16]} />
                        <meshBasicMaterial
                            color={mode === 'SLOW' ? activeColor : inactiveColor}
                            toneMapped={false}
                        />
                    </mesh>
                    {mode === 'SLOW' && (
                        <mesh scale={[2.5, 2.5, 1]}>
                            <circleGeometry args={[0.06, 16]} />
                            <meshBasicMaterial color={activeColor} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
                        </mesh>
                    )}
                </group>

                {/* GO (Vertical/Diagonal Bar) */}
                <group position={[0, -0.18, 0.17]} rotation-z={
                    mode === 'GO_STRAIGHT' ? 0 :
                        mode === 'GO_LEFT' ? Math.PI / 4 :
                            mode === 'GO_RIGHT' ? -Math.PI / 4 : 0
                }>
                    <mesh>
                        <planeGeometry args={[0.06, 0.25]} />
                        <meshBasicMaterial
                            color={['GO_STRAIGHT', 'GO_LEFT', 'GO_RIGHT'].includes(mode) ? activeColor : inactiveColor}
                            toneMapped={false}
                        />
                    </mesh>
                    {['GO_STRAIGHT', 'GO_LEFT', 'GO_RIGHT'].includes(mode) && (
                        <mesh scale={[2, 1.5, 1]}>
                            <planeGeometry args={[0.06, 0.25]} />
                            <meshBasicMaterial color={activeColor} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
                        </mesh>
                    )}
                </group>

                {/* Shared Light Glow - Point Light for Scene Lighting */}
                {mode !== 'STOP' && mode !== 'SLOW' && !['GO_STRAIGHT', 'GO_LEFT', 'GO_RIGHT'].includes(mode) ? null : (
                    <pointLight
                        position={[0,
                            mode === 'STOP' ? 0.18 :
                                mode === 'SLOW' ? 0 : -0.18,
                            0.25]}
                        color={activeColor}
                        intensity={glowIntensity}
                        distance={8}
                        decay={1.5}
                    />
                )}
            </group>
        </group>
    );
};

export default TramSignal;
