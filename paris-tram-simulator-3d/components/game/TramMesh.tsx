import React from 'react';
import * as THREE from 'three';
import { MATERIALS } from '../../constants';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';


interface TramMeshProps {
    lightsOn?: boolean;
    doorsOpen?: boolean;
    driverDoorOpen?: boolean; // New Prop
    rampExtended?: boolean;
    pantographUp?: boolean;
    wipersOn?: boolean;
    windowsOpen?: boolean;
    platformSide?: 'left' | 'right' | null;
    sunblindDown?: boolean;
    indicatorLeft?: boolean;
    indicatorRight?: boolean;
    driverVisible?: boolean;
    variant?: 'default' | 'rubber_tyred' | 'express' | 'tram_train';
    children?: React.ReactNode;
    excludeBulbs?: boolean;
    onToggleDoors?: () => void;
}

const TramMesh = React.forwardRef<THREE.Group, TramMeshProps>(({
    lightsOn = false,
    doorsOpen = false,
    driverDoorOpen = false,
    rampExtended = false,
    pantographUp = false,
    wipersOn = false,
    windowsOpen = false,
    platformSide = 'right',
    variant = 'default',
    sunblindDown = false,
    indicatorLeft = false,
    indicatorRight = false,
    driverVisible = false,
    children,
    excludeBulbs = false,
    onToggleDoors
}, ref) => {
    const internalRef = React.useRef<THREE.Group>(null);
    const animState = React.useRef({ door: 0, driverDoor: 0, ramp: 0, panto: 0 }); // Added driverDoor state

    // Material Refs for dynamic updates
    const flIndMat = React.useRef<THREE.MeshBasicMaterial>(null);
    const frIndMat = React.useRef<THREE.MeshBasicMaterial>(null);
    const blIndMat = React.useRef<THREE.MeshBasicMaterial>(null);
    const brIndMat = React.useRef<THREE.MeshBasicMaterial>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    useFrame((state, delta) => {
        if (!internalRef.current) return;

        // Smoothly interpolate animation states
        const targetDoor = doorsOpen ? 0.65 : 0;
        animState.current.door = THREE.MathUtils.lerp(animState.current.door, targetDoor, delta * 5);

        const targetDriverDoor = driverDoorOpen ? 0.65 : 0;
        animState.current.driverDoor = THREE.MathUtils.lerp(animState.current.driverDoor, targetDriverDoor, delta * 5);

        const targetRamp = rampExtended ? 1 : 0;
        animState.current.ramp = THREE.MathUtils.lerp(animState.current.ramp, targetRamp, delta * 2);

        const targetPanto = pantographUp ? 1 : 0;
        animState.current.panto = THREE.MathUtils.lerp(animState.current.panto, targetPanto, delta * 2);

        // Update components
        const doorSlide = animState.current.door;
        const driverDoorSlide = animState.current.driverDoor;

        ['r', 'l'].forEach(doorSideChar => {
            const isRight = doorSideChar === 'r';

            // Passenger Doors Logic (respect platform side if needed, or open all if requested)
            // For now, let's open ALL passenger doors if doorsOpen is true, unless platformSide restricts it.
            // But usually 'doorsOpen' means "open active side".
            // Let's stick to existing logic for passenger doors:
            const isSideActive = (doorSideChar === 'r' && platformSide === 'right') || (doorSideChar === 'l' && platformSide === 'left');

            [-1.65, 1.65].forEach(xPos => {
                const doorL = internalRef.current?.getObjectByName(`door_l_${xPos}_${doorSideChar}`);
                const doorR = internalRef.current?.getObjectByName(`door_r_${xPos}_${doorSideChar}`);

                let currentSlide = 0;

                // Check if this is the Driver Door (Front Right: x=1.65, side='r')
                if (xPos === 1.65 && doorSideChar === 'r') {
                    // This is the Driver Door.
                    // It opens if driverDoorOpen is true OR if it's an active passenger stop (optional, but requested separate).
                    // Request: "only the door that the driver comes out of should open up. the rest should close."
                    // So if driverDoorOpen, override.
                    if (driverDoorOpen) {
                        currentSlide = driverDoorSlide;
                    } else if (doorsOpen && isSideActive) {
                        currentSlide = doorSlide; // Also open for passengers if active side? Assume yes.
                    }
                } else {
                    // Normal Passenger Door
                    if (doorsOpen && isSideActive) {
                        currentSlide = doorSlide;
                    }
                }

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

        // Wiper Animation
        const wiperGroup = internalRef.current.getObjectByName('wiperGroup');
        if (wiperGroup) {
            if (wipersOn) {
                const time = state.clock.getElapsedTime();
                const angle = (Math.sin(time * 5) * 0.5); // -0.5 to 0.5
                wiperGroup.rotation.x = angle;
            } else {
                wiperGroup.rotation.x = 0; // Reset
            }
        }

        // Indicator Animation (smooth fade in/out)
        const time = state.clock.getElapsedTime();
        const cycle = time % 1; // 1 second cycle
        let opacity = 0;
        if (cycle < 0.5) {
            opacity = cycle * 2; // Fade in: 0 -> 1 over 0.5s
        } else {
            opacity = (1 - cycle) * 2; // Fade out: 1 -> 0 over 0.5s
        }

        const baseColor = new THREE.Color("#331100");
        const activeColor = new THREE.Color("#ffaa00");

        const leftColor = indicatorLeft ? baseColor.clone().lerp(activeColor, opacity) : baseColor;
        const rightColor = indicatorRight ? baseColor.clone().lerp(activeColor, opacity) : baseColor;

        if (flIndMat.current) flIndMat.current.color = leftColor;
        if (blIndMat.current) blIndMat.current.color = leftColor;
        if (frIndMat.current) frIndMat.current.color = rightColor;
        if (brIndMat.current) brIndMat.current.color = rightColor;
    });

    // Helper for Door Rendering
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

    // Tooltip Helpers
    const handlePointerOver = (name: string) => (e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'help';
        useGameStore.getState().setHoveredObject(name);
    };
    const handlePointerOut = (e: any) => {
        document.body.style.cursor = 'auto';
        useGameStore.getState().setHoveredObject(null);
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

            <group name="pantoArm" position={[0, 5, 0]} rotation-y={Math.PI / 2}>
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

            {/* Sunblind - Moved further forward (x=7.5) and wider */}
            <mesh position={[7.5, 3.2 - (sunblindDown ? 0.3 : 0), 0]} rotation-z={Math.PI / 16}>
                <boxGeometry args={[0.05, 0.5, 2.7]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Sunblind Visor (Animated) */}
            <mesh position={[7.5, 3.2 - (sunblindDown ? 0.6 : 0), 0]} rotation-z={Math.PI / 16}>
                <planeGeometry args={[0.05, sunblindDown ? 1.0 : 0.1]} />
                <meshStandardMaterial color="#111" transparent opacity={0.95} side={THREE.DoubleSide} />
            </mesh>


            {/* Driver - RATP Suit and Hat */}
            {driverVisible && (
                <group position={[6.2, 1.4, 0]}>
                    {/* Body - Dark Blue Suit */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.5, 1.0, 0.6]} />
                        <meshStandardMaterial color="#003366" />
                    </mesh>
                    {/* Head */}
                    <mesh position={[0, 1.2, 0]}>
                        <sphereGeometry args={[0.22, 16, 16]} />
                        <meshStandardMaterial color="#ffccaa" />
                    </mesh>
                    {/* Hat - Cap style */}
                    <group position={[0, 1.35, 0]}>
                        <mesh position={[0, 0.05, 0]}>
                            <cylinderGeometry args={[0.23, 0.23, 0.1, 16]} />
                            <meshStandardMaterial color="#003366" />
                        </mesh>
                        <mesh position={[0.15, 0, 0]} rotation-z={-0.2}>
                            <boxGeometry args={[0.2, 0.02, 0.2]} />
                            <meshStandardMaterial color="#000" />
                        </mesh>
                    </group>
                </group>
            )}

            {/* Wiper */}
            <group name="wiperGroup" position={[7.62, 1.8, 0]}>
                <mesh position={[0, 0.75, 0]}
                    onPointerOver={handlePointerOver("Windshield Wiper")} onPointerOut={handlePointerOut}>
                    <boxGeometry args={[0.05, 1.3, 0.05]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>

            {/* Dashboard */}
            <mesh position={[6.8, 1.5, 0]} rotation-y={-Math.PI / 2}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                onPointerOver={handlePointerOver("Dashboard")} onPointerOut={handlePointerOut}
            >
                <boxGeometry args={[2.5, 0.5, 1]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* External Indicators */}
            {/* Front Left */}
            <mesh position={[7.5, 1.0, -1.2]} onPointerOver={handlePointerOver("Left Indicator")} onPointerOut={handlePointerOut}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial ref={flIndMat} color="#331100" />
            </mesh>
            {/* Front Right */}
            <mesh position={[7.5, 1.0, 1.2]} onPointerOver={handlePointerOver("Right Indicator")} onPointerOut={handlePointerOut}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial ref={frIndMat} color="#331100" />
            </mesh>
            {/* Back Left */}
            <mesh position={[-6.0, 1.0, -1.2]} onPointerOver={handlePointerOver("Left Indicator")} onPointerOut={handlePointerOut}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial ref={blIndMat} color="#331100" />
            </mesh>
            {/* Back Right */}
            <mesh position={[-6.0, 1.0, 1.2]} onPointerOver={handlePointerOver("Right Indicator")} onPointerOut={handlePointerOut}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial ref={brIndMat} color="#331100" />
            </mesh>

            {/* Mirrors */}
            {/* Left Mirror */}
            <group position={[7.2, 2.0, 1.5]} rotation-y={0.2}>
                <mesh>
                    <boxGeometry args={[0.2, 0.6, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[-0.05, 0, 0]}>
                    <planeGeometry args={[0.1, 0.5]} />
                    <meshStandardMaterial color="#ccccff" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[-0.1, 0, 0]} rotation-z={Math.PI / 2} scale={[0.1, 1, 0.1]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.4]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </group>
            {/* Right Mirror */}
            <group position={[7.2, 2.0, -1.5]} rotation-y={-0.2}>
                <mesh>
                    <boxGeometry args={[0.2, 0.6, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[-0.05, 0, 0]}>
                    <planeGeometry args={[0.1, 0.5]} />
                    <meshStandardMaterial color="#ccccff" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[-0.1, 0, 0]} rotation-z={Math.PI / 2} scale={[0.1, 1, 0.1]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.4]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </group>

            {children}
        </group>
    );
});

export default TramMesh;
