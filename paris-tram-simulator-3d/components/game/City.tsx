
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { MAP_NODES, TRACKS, MATERIALS, STOPS } from '../../constants';
import { Stop } from '../../types';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { TEXTURE_URLS } from '../../textures/generatedTextures';
import TrafficInstanced from './TrafficInstanced';
import StreetLightsInstanced from './StreetLightsInstanced';
import CatenaryOptimized from './CatenaryOptimized';
import { TramGarage, TramWash, EiffelTower } from './Structures';
import TrafficLightSystem from './TrafficLightSystem';


// Reusable geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const planeGeo = new THREE.PlaneGeometry(1, 1);

// Helper for View Distance
const getViewDistance = (weather: string, time: number, setting: number) => {
    // Respect user setting primarily
    return setting;
};



const TrackHighlights: React.FC = () => {
    const currentTrackMesh = useRef<THREE.Mesh>(null);
    const nextTrackMesh = useRef<THREE.Mesh>(null);

    const { indicatorLeft, indicatorRight } = useGameStore(useShallow(state => ({
        indicatorLeft: state.indicatorLeft,
        indicatorRight: state.indicatorRight
    })));

    useFrame(() => {
        if (!currentTrackMesh.current || !nextTrackMesh.current) return;

        const isActive = indicatorLeft || indicatorRight;
        currentTrackMesh.current.visible = isActive;
        nextTrackMesh.current.visible = isActive;

        if (!isActive) return;

        const trackId = tramRealtimeData.currentTrackId;
        const progress = tramRealtimeData.positionOnTrack;
        const currentTrack = TRACKS.find(t => t.id === trackId);
        if (!currentTrack) return;

        const startNode = MAP_NODES[currentTrack.from];
        const endNode = MAP_NODES[currentTrack.to];
        const fullLength = currentTrack.length;
        const remainingLength = Math.max(0, fullLength - progress);

        const angle = Math.atan2(endNode.z - startNode.z, endNode.x - startNode.x);
        const midDist = (progress + fullLength) / 2;
        const t = midDist / fullLength;
        const midX = startNode.x + (endNode.x - startNode.x) * t;
        const midZ = startNode.z + (endNode.z - startNode.z) * t;

        currentTrackMesh.current.position.set(midX, 0.2, midZ);
        currentTrackMesh.current.rotation.y = -angle;
        currentTrackMesh.current.scale.set(remainingLength, 0.25, 2.5);

        const nextOptions = TRACKS.filter(t => t.from === currentTrack.to && t.to !== currentTrack.from);
        if (nextOptions.length > 0) {
            let chosen = nextOptions[0];
            if (nextOptions.length > 1) {
                const choices = nextOptions.map(opt => {
                    const os = MAP_NODES[opt.from];
                    const oe = MAP_NODES[opt.to];
                    const nextAngle = Math.atan2(oe.z - os.z, oe.x - os.x);
                    let diff = nextAngle - angle;
                    while (diff <= -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    return { track: opt, diff };
                });

                if (indicatorLeft) {
                    choices.sort((a, b) => a.diff - b.diff);
                    chosen = choices[0].track;
                } else if (indicatorRight) {
                    choices.sort((a, b) => b.diff - a.diff);
                    chosen = choices[0].track;
                }
            }
            const s = MAP_NODES[chosen.from];
            const e = MAP_NODES[chosen.to];
            const cx = (s.x + e.x) / 2;
            const cz = (s.z + e.z) / 2;
            const nextAngle = Math.atan2(e.z - s.z, e.x - s.x);

            nextTrackMesh.current.position.set(cx, 0.2, cz);
            nextTrackMesh.current.rotation.y = -nextAngle;
            nextTrackMesh.current.scale.set(chosen.length, 0.25, 2.5);
        } else {
            nextTrackMesh.current.visible = false;
        }
    });

    return (
        <group>
            <mesh ref={currentTrackMesh} geometry={boxGeo}>
                <meshBasicMaterial color="#facc15" transparent opacity={0.6} />
            </mesh>
            <mesh ref={nextTrackMesh} geometry={boxGeo}>
                <meshBasicMaterial color="#facc15" transparent opacity={0.6} />
            </mesh>
        </group>
    );
};

const Passenger: React.FC<{
    position: { x: number, z: number },
    color: number,
    isDisabled: boolean,
    shouldBoard: boolean,
    onBoarded: () => void
}> = ({ position, color, isDisabled, shouldBoard, onBoarded }) => {
    const ref = useRef<THREE.Group>(null);
    const [isBoarding, setIsBoarding] = useState(false);

    useEffect(() => {
        if (shouldBoard) setIsBoarding(true);
    }, [shouldBoard]);

    useFrame((_, delta) => {
        if (isBoarding && ref.current) {
            ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, 0, delta * 2);
            if (Math.abs(ref.current.position.z) < 0.5) {
                onBoarded();
            }
        }
    });

    return (
        <group ref={ref} position={[position.x, 0, position.z + 2.0]}>
            {isDisabled ? (
                <group>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[0.6, 0.1, 0.6]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, 0.9, 0]}>
                        <cylinderGeometry args={[0.4, 0.4, 0.9, 8]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    <mesh position={[0.35, 0.4, 0]} rotation-z={Math.PI / 2}>
                        <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <mesh position={[-0.35, 0.4, 0]} rotation-z={Math.PI / 2}>
                        <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <mesh position={[0, 1.8, 0]}>
                        <sphereGeometry args={[0.15, 8, 8]} />
                        <meshBasicMaterial color="#00ffff" />
                    </mesh>
                </group>
            ) : (
                <mesh position={[0, 0.75, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 1.5, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )}
        </group>
    );
};

const DepartureBoard: React.FC<{ position: THREE.Vector3, stopPosition: THREE.Vector3, hasPassengers: boolean, stationName: string }> = ({ position, stopPosition, hasPassengers, stationName }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [eta, setEta] = useState<string>("-");
    const lastUpdate = useRef(0);
    const lastScrollUpdate = useRef(0);
    const scrollOffset = useRef(0);

    // Canvas & Texture Setup
    const { canvas, texture } = useMemo(() => {
        const c = document.createElement('canvas');
        // Aspect ratio for 1.5 x 0.5 is 3:1.
        c.width = 768;
        c.height = 256;
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return { canvas: c, texture: t };
    }, []);

    const draw = (text: string) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border (simulated inner shadow/bezel)
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 16;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Header Line
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 40px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText('TRAM 802', 40, 50);

        // Red Dot (Static)
        ctx.fillStyle = '#ff0000';
        ctx.font = '60px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('●', canvas.width - 40, 50);
        ctx.textAlign = 'left'; // Reset

        // Divider
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, 80);
        ctx.lineTo(canvas.width - 20, 80);
        ctx.stroke();

        // Main Content Row
        const y = 180;

        // Destination
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px sans-serif';

        let displayStation = stationName.toUpperCase();
        if (displayStation.length > 8) {
            const spacer = "   "; // 3 spaces
            const fullText = displayStation + spacer;
            // Create a window
            const repeated = fullText.repeat(3);
            // scrollOffset is current index
            displayStation = repeated.substring(scrollOffset.current, scrollOffset.current + 8);
        }

        ctx.fillText(displayStation, 40, y);

        // ETA
        ctx.fillStyle = '#ffaa00'; // Orange
        ctx.font = 'bold 110px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(text, canvas.width - 40, y);
        ctx.textAlign = 'left'; // Reset

        texture.needsUpdate = true;
    };

    // Initial draw
    useEffect(() => {
        draw(eta);
    }, []);

    // Reset scroll if station name changes
    useEffect(() => {
        scrollOffset.current = 0;
        draw(eta);
    }, [stationName]);

    useFrame(({ camera, clock }) => {
        if (!groupRef.current) return;

        // No internal culling needed - StopMarker culls the whole group

        const now = clock.elapsedTime;
        let needsRedraw = false;
        let currentEta = eta;

        // 1. Scroll Update logic (Every 1.0s)
        if (stationName.length > 8) {
            if (now - lastScrollUpdate.current > 1.0) {
                lastScrollUpdate.current = now;
                const spacer = "   "; // Must match spacer above
                const loopLen = stationName.length + spacer.length;
                scrollOffset.current = (scrollOffset.current + 1) % loopLen;
                needsRedraw = true;
            }
        }

        // 2. ETA Update logic (Every 0.5s)
        if (now - lastUpdate.current > 0.5) {
            lastUpdate.current = now; // Update timestamp

            let newEta = "-";
            if (hasPassengers) {
                const tramPos = new THREE.Vector3(tramRealtimeData.x, 0, tramRealtimeData.z);
                const tramDist = tramPos.distanceTo(stopPosition);
                const timeSeconds = tramDist / 15; // Approx speed factor

                if (timeSeconds <= 2) {
                    newEta = "DUE";
                } else {
                    newEta = `${Math.ceil(timeSeconds)}s`;
                }
            }

            if (newEta !== eta) {
                setEta(newEta);
                currentEta = newEta;
                needsRedraw = true;
            }
        }

        if (needsRedraw) {
            draw(currentEta);
        }
    });

    return (
        <group ref={groupRef} position={position} rotation-y={Math.PI}>
            {/* Pole */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Board Box - Scaled Up 1.5x */}
            <mesh position={[0, 2.8, 0.1]}>
                <boxGeometry args={[2.25, 0.75, 0.1]} />
                <meshStandardMaterial color="#111" />
            </mesh>

            {/* Canvas Screen Mesh - Scaled Up 1.5x */}
            <mesh position={[0, 2.8, 0.16]}>
                <planeGeometry args={[2.1, 0.6]} />
                <meshBasicMaterial map={texture} />
            </mesh>
        </group>
    )
};

const TicketMachine: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
    const screenTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#00ffff'; // Teal background
            ctx.fillRect(0, 0, 256, 128);
            ctx.fillStyle = '#000000'; // Black text
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TICKETS', 128, 30);
            ctx.fillText('FOR SALE', 128, 64);
            ctx.fillText('£1.5', 128, 98);
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);

    return (
        <group position={position} rotation-y={Math.PI}>
            {/* Machine Body - Light Grey */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 2.0, 0.6]} />
                <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Screen (Lit up with text) */}
            <mesh position={[0, 1.5, 0.31]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshBasicMaterial map={screenTexture} toneMapped={false} />
            </mesh>
            {/* Interface Panel */}
            <mesh position={[0, 1.0, 0.31]}>
                <planeGeometry args={[0.6, 0.4]} />
                <meshStandardMaterial color="#888" />
            </mesh>
            {/* Ticket Slot */}
            <mesh position={[0, 0.5, 0.31]}>
                <planeGeometry args={[0.5, 0.15]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* Header Stripe - Dark Blue */}
            <mesh position={[0, 1.85, 0.31]}>
                <planeGeometry args={[0.7, 0.15]} />
                <meshStandardMaterial color="#00008b" />
            </mesh>
        </group>
    );
};

const StopMarker: React.FC<{ stop: Stop }> = ({ stop }) => {
    const spotTexture = useTexture(TEXTURE_URLS.spot);
    const maxCapacity = 15;
    const lightTarget = useRef(new THREE.Object3D());
    const groupRef = useRef<THREE.Group>(null);
    const lastDistCheck = useRef(Math.random());

    // Optimize store selection
    const { queue, lightsOn } = useGameStore(useShallow(state => ({
        queue: state.stopQueues[stop.id] || [],
        lightsOn: (state.timeOfDay >= 19.0 || state.timeOfDay <= 6.0) || (state.weather !== 'Clear' && (state.timeOfDay > 16 || state.timeOfDay < 8))
    })));

    const waitingCount = queue.length;

    // Distance Culling
    useFrame(({ camera }, delta) => {
        if (!groupRef.current) return;

        lastDistCheck.current += delta;
        if (lastDistCheck.current > 0.5) {
            lastDistCheck.current = 0;
            const { weather, timeOfDay, viewDistance } = useGameStore.getState();
            const maxDist = getViewDistance(weather, timeOfDay, viewDistance);
            const dist = camera.position.distanceTo(stop.position);

            // Just use distance check
            groupRef.current.visible = dist <= maxDist;
        }
    });

    const slots = useMemo(() => {
        return Array.from({ length: maxCapacity }).map((_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            return {
                id: i,
                x: (col - 2) * 1.2 + (Math.random() * 0.4 - 0.2),
                z: (row * 1.0) + (Math.random() * 0.2),
                color: Math.random() * 0xffffff
            };
        });
    }, []);

    const [animatingOut, setAnimatingOut] = useState<number[]>([]);
    const prevQueueLen = useRef(waitingCount);

    useEffect(() => {
        if (waitingCount < prevQueueLen.current) {
            const boardedIndex = waitingCount;
            setAnimatingOut(prev => [...prev, boardedIndex]);
        }
        prevQueueLen.current = waitingCount;
    }, [waitingCount]);

    const removeAnimation = (idx: number) => {
        setAnimatingOut(prev => prev.filter(i => i !== idx));
    };

    return (
        <group ref={groupRef} position={stop.position} rotation-y={stop.rotation || 0}>
            {/* Departure Board positioned to the side */}
            <DepartureBoard
                position={new THREE.Vector3(-4, 0, 3)}
                stopPosition={stop.position}
                hasPassengers={queue.length > 0}
                stationName={stop.name}
            />

            {/* Ticket Machine - Placed on the platform */}
            <TicketMachine position={new THREE.Vector3(3.5, 0.6, 3.5)} />

            {/* Platform Base */}
            <mesh position={[0, 0.3, 3.5]} geometry={boxGeo} scale={[10, 0.6, 4]} receiveShadow castShadow>
                <meshStandardMaterial color="#888888" roughness={0.8} />
            </mesh>
            {/* Back Wall */}
            <mesh position={[0, 0.15, 1.55]} geometry={boxGeo} scale={[10, 0.3, 0.1]}>
                <meshStandardMaterial color="#cccccc" />
            </mesh>

            {/* Roof Pole */}
            <mesh position={[0, 2, 2]} geometry={cylinderGeo} scale={[0.06, 2.5, 0.06]} castShadow>
                <meshStandardMaterial color={0x333333} />
            </mesh>

            {/* Roof */}
            <mesh position={[0, 3.3, 3]} geometry={boxGeo} scale={[5.1, 0.06, 2.0]}>
                <meshStandardMaterial color={0xaaeeff} transparent opacity={0.5} />
            </mesh>

            {/* Platform Lights (Linear Roof Light) */}
            {lightsOn && (
                <group position={[0, 3.25, 3]}>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[4.8, 0.05, 0.4]} />
                        <meshBasicMaterial color="#ffaa55" toneMapped={false} />
                    </mesh>

                    <primitive object={lightTarget.current} position={[0, -3, 0]} />
                    <spotLight
                        target={lightTarget.current}
                        color="#ffaa55"
                        intensity={15}
                        angle={1.0}
                        penumbra={0.5}
                        castShadow
                        shadow-bias={-0.001}
                    />

                    <mesh position={[0, -1.6, 0]}>
                        <boxGeometry args={[4.6, 3.2, 1.5]} />
                        <meshBasicMaterial
                            color="#ffaa55"
                            transparent
                            opacity={0.08}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    <mesh position={[0, -3.1, 0]} rotation-x={-Math.PI / 2} scale={[7, 3, 1]}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial
                            map={spotTexture}
                            color="#ffaa55"
                            transparent
                            opacity={0.5}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                </group>
            )}

            {queue.map((passenger, i) => {
                if (i >= maxCapacity) return null;
                const slot = slots[i];
                return (
                    <Passenger
                        key={passenger.id}
                        position={slot}
                        color={slot.color}
                        isDisabled={passenger.isDisabled}
                        shouldBoard={false}
                        onBoarded={() => { }}
                    />
                );
            })}

            {animatingOut.map((slotIdx) => {
                const slot = slots[slotIdx % maxCapacity];
                return (
                    <Passenger
                        key={`anim_${slotIdx}`}
                        position={slot}
                        color={slot.color}
                        isDisabled={false}
                        shouldBoard={true}
                        onBoarded={() => removeAnimation(slotIdx)}
                    />
                )
            })}
        </group>
    );
};

const Building: React.FC<{ position: [number, number, number], type: 'tower' | 'arc' | 'generic', texture: THREE.Texture }> = ({ position, type, texture }) => {
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: texture, color: '#ddd' }), [texture]);
    const groupRef = useRef<THREE.Group>(null);
    const posVector = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);
    const lastDistCheck = useRef(Math.random());

    useFrame(({ camera }, delta) => {
        if (!groupRef.current) return;

        lastDistCheck.current += delta;
        if (lastDistCheck.current > 0.5) {
            lastDistCheck.current = 0;
            const { weather, timeOfDay, viewDistance } = useGameStore.getState();
            const maxDist = getViewDistance(weather, timeOfDay, viewDistance);
            // Allow slightly further distance for large buildings so they don't pop as noticeably
            const dist = camera.position.distanceTo(posVector);

            groupRef.current.visible = dist <= (maxDist * 1.2);
        }
    });

    if (type === 'tower') {
        return (
            <group ref={groupRef}>
                <EiffelTower position={[position[0], 0, position[2]]} scale={0.5} />
            </group>
        );
    }
    if (type === 'arc') {
        return (
            <group ref={groupRef}>
                <mesh position={[position[0], 12.5, position[2]]} castShadow receiveShadow material={mat}>
                    <boxGeometry args={[20, 25, 10]} />
                </mesh>
            </group>
        );
    }
    const height = 15 + Math.random() * 15;
    return (
        <group ref={groupRef} position={[position[0], 0, position[2]]}>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow geometry={boxGeo} scale={[15, height, 15]} material={mat} />
            <mesh position={[0, height + 2.5, 0]} rotation-y={Math.PI / 4} geometry={new THREE.ConeGeometry(11, 5, 4)} material={new THREE.MeshStandardMaterial({ color: MATERIALS.roof })} />
        </group>
    );
};

const City: React.FC = () => {
    const grassTexture = useTexture(TEXTURE_URLS.grass);
    const brickTexture = useTexture(TEXTURE_URLS.brick);
    const asphaltTexture = useTexture(TEXTURE_URLS.asphalt);


    // Texture Configuration
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50);

    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
    brickTexture.repeat.set(1, 1);

    // Asphalt for the road background (Wider)
    asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(20, 2);



    const buildings = useMemo(() => {
        return [
            { x: -130, z: 0, type: 'tower' }, // Reverted to 0 as requested
            { x: -130, z: -200, type: 'arc' }
        ] as { x: number, z: number, type: 'tower' | 'arc' | 'generic' }[];
    }, []);

    return (
        <group>

            <mesh rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[2000, 2000]} />
                <meshStandardMaterial map={grassTexture} />
            </mesh>

            {TRACKS.map((track) => {
                const start = MAP_NODES[track.from];
                const end = MAP_NODES[track.to];
                const length = Math.hypot(end.x - start.x, end.z - start.z);
                const angle = Math.atan2(end.z - start.z, end.x - start.x);
                const cx = (start.x + end.x) / 2;
                const cz = (start.z + end.z) / 2;

                return (
                    <group key={track.id} position={[cx, 0, cz]} rotation-y={-angle}>
                        {/* Left Rail */}
                        <mesh position={[0, 0.1, -0.5]} geometry={boxGeo} scale={[length, 0.15, 0.1]}>
                            <meshStandardMaterial color={MATERIALS.rail} roughness={0.4} metalness={0.7} />
                        </mesh>
                        {/* Right Rail */}
                        <mesh position={[0, 0.1, 0.5]} geometry={boxGeo} scale={[length, 0.15, 0.1]}>
                            <meshStandardMaterial color={MATERIALS.rail} roughness={0.4} metalness={0.7} />
                        </mesh>
                        {/* The wider road underneath */}
                        <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2} geometry={planeGeo} scale={[length, 12, 1]} receiveShadow>
                            <meshStandardMaterial map={asphaltTexture} color="#ffffff" roughness={0.9} metalness={0.1} />
                        </mesh>
                    </group>
                );
            })
            }

            {/* Tram Garage - Track is at X=200, facing it from 240 */}
            <TramGarage position={[240, 0, 100]} rotation={-Math.PI / 2} />

            {/* Tram Wash - Side of the track at Track X=0, Z=-100 */}
            <TramWash position={[-35, 0, -100]} rotation={Math.PI / 2} />

            {/* Traffic and Atmosphere */}
            <TrafficInstanced />
            <TrafficLightSystem />
            <StreetLightsInstanced />
            <TrackHighlights />
            <CatenaryOptimized />

            {/* Render only explicit landmarks if any additional ones are needed, but 'buildings' array only has landmarks now */}
            {
                buildings.map((b, i) => (
                    <Building key={i} position={[b.x, 0, b.z]} type={b.type} texture={brickTexture} />
                ))
            }

            {STOPS.map(stop => <StopMarker key={stop.id} stop={stop} />)}
        </group >
    );
};

export default City;
