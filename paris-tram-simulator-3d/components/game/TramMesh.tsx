import React from 'react';
import * as THREE from 'three';
import { MATERIALS } from '../../constants';
import { useFrame } from '@react-three/fiber';


interface TramMeshProps {
    lightsOn?: boolean;
    doorsOpen?: boolean;
    rampExtended?: boolean;
    pantographUp?: boolean;
    wipersOn?: boolean;
    windowsOpen?: boolean;
    platformSide?: 'left' | 'right' | null;
    variant?: 'default' | 'rubber_tyred' | 'express' | 'tram_train';
    children?: React.ReactNode;
    excludeBulbs?: boolean;
    onToggleDoors?: () => void;
}

const TramMesh = React.forwardRef<THREE.Group, TramMeshProps>(({
    lightsOn = false,
    doorsOpen = false,
    rampExtended = false,
    pantographUp = false,
    wipersOn = false,
    windowsOpen = false,
    platformSide = 'right',
    variant = 'default',
    children,
    excludeBulbs = false,
    onToggleDoors
}, ref) => {
    const internalRef = React.useRef<THREE.Group>(null);
    const animState = React.useRef({ door: 0, ramp: 0, panto: 0 });

    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    useFrame((state, delta) => {
        if (!internalRef.current) return;

        // Smoothly interpolate animation states
        const targetDoor = doorsOpen ? 0.65 : 0;
        animState.current.door = THREE.MathUtils.lerp(animState.current.door, targetDoor, delta * 5); // Speed roughly matching previous 0.1 per frame @ 60fps

        const targetRamp = rampExtended ? 1 : 0;
        animState.current.ramp = THREE.MathUtils.lerp(animState.current.ramp, targetRamp, delta * 2);

        const targetPanto = pantographUp ? 1 : 0;
        animState.current.panto = THREE.MathUtils.lerp(animState.current.panto, targetPanto, delta * 2);

        // Animate Wipers
        const wiper = internalRef.current.getObjectByName('wiper');

        if (wiper) {
            if (wipersOn) wiper.rotation.x = Math.sin(state.clock.elapsedTime * 8) * 0.5;
            else wiper.rotation.x = 0;
        }

        // Handle Doors Animation (Simplistic lerp for visual component if not controlled by parent)
        // Note: In the main game, animation state might be passed down or handled here if purely visual. 
        // For static trams, we assume static state. For the main tram, the parent handles physics/logic, 
        // but passing precise animation values might be better. 
        // For now, let's keep it simple: if props change, we update positions directly or lerp in useFrame if we want smooth.
        // Given the requirement for "inactive" trams, we might not need smooth transitions for them.

        // Update components
        const doorSlide = animState.current.door;
        ['r', 'l'].forEach(doorSideChar => {
            const isSideActive = (doorSideChar === 'r' && platformSide === 'right') || (doorSideChar === 'l' && platformSide === 'left');
            const currentSlide = isSideActive ? doorSlide : 0;

            [-1.65, 1.65].forEach(xPos => {
                const doorL = internalRef.current?.getObjectByName(`door_l_${xPos}_${doorSideChar}`);
                const doorR = internalRef.current?.getObjectByName(`door_r_${xPos}_${doorSideChar}`);
                if (doorL) doorL.position.x = -0.35 - currentSlide;
                if (doorR) doorR.position.x = 0.35 + currentSlide;
            });
        });

        const rampR = internalRef.current.getObjectByName('ramp_r');
        if (rampR) rampR.position.z = 1.0 + ((platformSide === 'right' ? animState.current.ramp : 0) * 1.5);

        const rampL = internalRef.current.getObjectByName('ramp_l');
        if (rampL) rampL.position.z = -1.0 - ((platformSide === 'left' ? animState.current.ramp : 0) * 1.5);

        const panto = internalRef.current.getObjectByName('pantoArm');
        if (panto) panto.position.y = 4.2 + (animState.current.panto * 0.8);
    });

    const renderDoors = (side: 'left' | 'right') => {
        const isRight = side === 'right';
        const zPos = isRight ? 1.41 : -1.41;
        const rotation = isRight ? 0 : Math.PI;
        const suffix = isRight ? '_r' : '_l';

        return [-1.65, 1.65].map(x => (
            <group key={`${side}_${x}`} position={[x, 1.5, zPos]} rotation-y={rotation}>
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[1.3, 2.2]} />
                    <meshBasicMaterial color={MATERIALS.doorVoid} />
                </mesh>
                <mesh position={[-0.35, 0, 0.05]} name={`door_l_${x}${suffix}`}>
                    <boxGeometry args={[0.7, 2.2, 0.1]} />
                    <meshStandardMaterial color={MATERIALS.door} />
                </mesh>
                <mesh position={[0.35, 0, 0.05]} name={`door_r_${x}${suffix}`}>
                    <boxGeometry args={[0.7, 2.2, 0.1]} />
                    <meshStandardMaterial color={MATERIALS.door} />

                    {/* Door Button */}
                    <mesh
                        position={[-0.2, 0, 0.06]}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleDoors) onToggleDoors();
                        }}
                        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                    >
                        <circleGeometry args={[0.08, 16]} />
                        <meshStandardMaterial color="#00ff00" emissive="#00cc00" emissiveIntensity={0.5} />
                    </mesh>
                </mesh>
            </group>
        ));
    };

    // Variant customization
    const bodyColor = React.useMemo(() => {
        switch (variant) {
            case 'rubber_tyred': return '#d9534f'; // Reddish
            case 'express': return '#337ab7'; // Blueish
            case 'tram_train': return '#5cb85c'; // Greenish
            default: return MATERIALS.tramBody;
        }
    }, [variant]);

    return (
        <group ref={internalRef}>
            <mesh position={[0, 2.2, 0]} castShadow>
                <boxGeometry args={[12, 3.5, 2.8]} />
                <meshStandardMaterial color={bodyColor} />
            </mesh>
            <mesh position={[6.5, 2.1, 0]} castShadow>
                <boxGeometry args={[2, 3.3, 2.7]} />
                <meshStandardMaterial color={MATERIALS.tramAccent} />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
                {[-3.5, 0, 3.5].map(x => (
                    <group key={x}>
                        <mesh position={[x, 0, 1.41]}>
                            <planeGeometry args={[2, 1.5]} />
                            <meshStandardMaterial color={windowsOpen ? '#111' : MATERIALS.tramGlass} transparent opacity={0.6} />
                        </mesh>
                        <mesh position={[x, 0, -1.41]} rotation-y={Math.PI}>
                            <planeGeometry args={[2, 1.5]} />
                            <meshStandardMaterial color={windowsOpen ? '#111' : MATERIALS.tramGlass} transparent opacity={0.6} />
                        </mesh>
                    </group>
                ))}
                <mesh position={[7.51, 0, 0]} rotation-y={Math.PI / 2}>
                    <planeGeometry args={[2.5, 2]} />
                    <meshStandardMaterial color={MATERIALS.tramGlass} transparent opacity={0.6} />
                </mesh>
            </mesh>

            {renderDoors('right')}
            {renderDoors('left')}

            <group name="pantoArm" position={[0, 5, 0]}>
                <mesh position={[0, -0.5, 0]}>
                    <boxGeometry args={[0.1, 1.0, 0.1]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
                <group position={[0, 0, 0]}>
                    <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, 0.6]}>
                        <boxGeometry args={[0.08, 1.3, 0.08]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, -0.6]}>
                        <boxGeometry args={[0.08, 1.3, 0.08]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, 1.05, 0]} rotation-y={Math.PI / 2}>
                        <boxGeometry args={[0.4, 0.05, 1.8]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>
                </group>
            </group>

            <group position={[7.6, 1.8, 0.5]} name="wiper">
                <mesh position={[0, 0.75, 0]}>
                    <boxGeometry args={[0.05, 1.5, 0.05]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
            </group>

            {/* Headlight Bulbs */}
            {!excludeBulbs && (
                <>
                    <mesh position={[7.6, 1.2, 0.8]} rotation-y={Math.PI / 2}>
                        <circleGeometry args={[0.2, 16]} />
                        <meshBasicMaterial color={lightsOn ? "#ffffaa" : "#222222"} />
                    </mesh>
                    <mesh position={[7.6, 1.2, -0.8]} rotation-y={Math.PI / 2}>
                        <circleGeometry args={[0.2, 16]} />
                        <meshBasicMaterial color={lightsOn ? "#ffffaa" : "#222222"} />
                    </mesh>
                </>
            )}

            <mesh name="ramp_r" position={[2, 0.3, 1.0]}>
                <boxGeometry args={[2, 0.1, 2.5]} />
                <meshStandardMaterial color="#444" />
            </mesh>

            <mesh name="ramp_l" position={[2, 0.3, -1.0]}>
                <boxGeometry args={[2, 0.1, 2.5]} />
                <meshStandardMaterial color="#444" />
            </mesh>


            {children}
        </group>
    );
});

export default TramMesh;
