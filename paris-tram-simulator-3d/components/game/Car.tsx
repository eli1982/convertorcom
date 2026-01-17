import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACKS, MAP_NODES } from '../../constants';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';

export type CarType = 0 | 1 | 2 | 3 | 4;
export const CAR_COLORS = ["#ffffff", "#111111", "#ff0000", "#00ff00", "#0000ff", "#888888"];

interface CarProps {
    id: number;
    type: CarType;
    color: string;
    initialTrackId: number;
    initialProgress: number;
    speed: number;
    onUpdate?: (state: { trackId: number, progress: number, speed: number }) => void;
}

// Reuse geometries to prevent memory leaks and context loss
const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

// Pre-compute basic materials (colors will still need specific instances if unique)
const windowMat = new THREE.MeshStandardMaterial({ color: '#333' });
const wheelMat = new THREE.MeshStandardMaterial({ color: '#111' });

// Rotate cylinder for wheels once
wheelGeo.rotateX(Math.PI / 2);

const Wheels: React.FC = () => (
    <>
        <mesh position={[0.7, 0.35, 0.5]} geometry={wheelGeo} material={wheelMat} />
        <mesh position={[-0.7, 0.35, 0.5]} geometry={wheelGeo} material={wheelMat} />
        <mesh position={[0.7, 0.35, -0.5]} geometry={wheelGeo} material={wheelMat} />
        <mesh position={[-0.7, 0.35, -0.5]} geometry={wheelGeo} material={wheelMat} />
    </>
);

const CarGeometry: React.FC<{ type: CarType, color: string }> = ({ type, color }) => {
    // Memoize material per color
    const material = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);

    // Sedan
    if (type === 0) {
        return (
            <group>
                <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[2.2, 0.5, 1.4]} />
                <mesh position={[-0.2, 1.1, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[1.2, 0.6, 1.3]} />
                <mesh position={[-0.2, 1.1, 0]} material={windowMat} geometry={boxGeo} scale={[1.25, 0.58, 1.35]} />
                <Wheels />
            </group>
        );
    }
    // Hatchback
    if (type === 1) {
        return (
            <group>
                <mesh position={[0, 0.7, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[1.8, 0.8, 1.4]} />
                <mesh position={[0, 1.25, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[1.2, 0.6, 1.3]} />
                <Wheels />
            </group>
        );
    }
    // SUV
    if (type === 2) {
        return (
            <group>
                <mesh position={[0, 0.8, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[2.4, 0.8, 1.6]} />
                <mesh position={[-0.2, 1.5, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[1.6, 0.7, 1.5]} />
                <Wheels />
            </group>
        );
    }
    // Sports Car
    if (type === 3) {
        return (
            <group>
                <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[2.4, 0.4, 1.5]} />
                <mesh position={[-0.1, 0.9, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[1.0, 0.45, 1.3]} />
                <Wheels />
            </group>
        );
    }
    // Van
    if (type === 4) {
        return (
            <group>
                <mesh position={[0, 1.0, 0]} castShadow receiveShadow material={material} geometry={boxGeo} scale={[2.4, 1.2, 1.5]} />
                <Wheels />
            </group>
        );
    }
    return null;
};

const Car: React.FC<CarProps & { getOtherCars: () => { id: number, position: THREE.Vector3, speed: number, trackId: number, progress: number }[] }> = ({ id, type, color, initialTrackId, initialProgress, speed, getOtherCars, onUpdate }) => {
    const group = useRef<THREE.Group>(null);
    const state = useRef({
        trackId: initialTrackId,
        progress: initialProgress,
        speed: speed,
        offset: 0,
        rotation: 0,
        tempSpeed: speed,
        isOvertaking: false,
        isInitialized: false
    });

    useFrame((_, delta) => {
        if (!group.current) return;

        const s = state.current;
        const dt = Math.min(delta, 0.1);

        // --- Tram Interaction & Collision Logic ---
        const tramPos = new THREE.Vector3(tramRealtimeData.x, 0, tramRealtimeData.z);
        const myPos = group.current.position;
        // distanceTo is expensive with new Vector3 every frame? No, Vector3 creation is cheap in JS.
        // But logic is fine.

        const tramSpeed = useGameStore.getState().speed;

        let obstaclesAhead = false;
        let targetSpeed = s.speed;
        let shouldOvertake = false;

        // Check Tram

        if (tramRealtimeData.currentTrackId === s.trackId) {
            const dist = tramRealtimeData.positionOnTrack - s.progress;

            // If tram is ahead and within interaction range
            if (dist > 0 && dist < 25) {
                obstaclesAhead = true;
                if (Math.abs(tramSpeed) < 1.0 || tramSpeed < 0) {
                    shouldOvertake = true;
                } else {
                    targetSpeed = Math.min(s.speed, Math.abs(tramSpeed));
                }
            }
            // If we are already overtaking and haven't cleared the tram by 20 units yet
            // dist is negative when car is ahead (Tram - Car)
            else if (s.isOvertaking && dist <= 0 && dist > -20) {
                shouldOvertake = true;
            }
        }

        // Check Other Cars
        const others = getOtherCars();
        for (let car of others) {
            if (car.id === id) continue;
            if (car.trackId === s.trackId) {
                const dist = car.progress - s.progress;
                if (dist > 0 && dist < 8) {
                    obstaclesAhead = true;
                    targetSpeed = Math.min(targetSpeed, car.speed);
                    if (dist < 5) targetSpeed = 0;
                }
            }
        }

        if (obstaclesAhead && !shouldOvertake) {
            s.tempSpeed = THREE.MathUtils.damp(s.tempSpeed, targetSpeed, 5, dt);
        } else if (shouldOvertake) {
            s.isOvertaking = true;
            s.tempSpeed = THREE.MathUtils.damp(s.tempSpeed, s.speed, 2, dt);
        } else {
            s.isOvertaking = false;
            s.tempSpeed = THREE.MathUtils.damp(s.tempSpeed, s.speed, 2, dt);
        }

        const targetOffset = s.isOvertaking ? -3.5 : 3.5;
        s.offset = THREE.MathUtils.damp(s.offset, targetOffset, 2, dt);

        // --- Movement ---
        const moveDist = (s.tempSpeed * 1000 / 3600) * dt;
        s.progress += moveDist;

        // Track wrapping
        // Track wrapping
        // FIX: Look up track by ID as array indices might not match IDs (sparse array)
        let track = TRACKS.find(t => t.id === s.trackId);

        // Fallback or crash prevention
        if (!track) {
            // Reset to a safe track if lost
            s.trackId = TRACKS[0].id;
            s.progress = 0;
            track = TRACKS[0];
        }

        if (s.progress > track.length) {
            s.progress -= track.length;
            const nextTracks = TRACKS.filter(t => t.from === track!.to);
            if (nextTracks.length > 0) {
                const next = nextTracks[Math.floor(Math.random() * nextTracks.length)];
                s.trackId = next.id;
                track = next; // Update current track reference for immediate use
            } else {
                s.progress = track.length;
                s.tempSpeed = 0;
            }
        }

        // Position Calculation
        // track variable is already safe here
        const start = MAP_NODES[track.from];
        const end = MAP_NODES[track.to];
        const t = s.progress / track.length;

        const bx = start.x + (end.x - start.x) * t;
        const bz = start.z + (end.z - start.z) * t;

        const currentAngle = Math.atan2(end.z - start.z, end.x - start.x);

        // Look-ahead: blend with next track angle near end of current track
        const lookAheadDistance = 15; // Start blending 15 units before end
        const distToEnd = track.length - s.progress;
        let blendedAngle = currentAngle;

        if (distToEnd < lookAheadDistance && distToEnd > 0) {
            // Find next track
            const nextTracks = TRACKS.filter(tr => tr.from === track!.to);
            if (nextTracks.length > 0) {
                // Use first available (we can't know which one will be chosen until switch)
                const nextTrack = nextTracks[0];
                const nextStart = MAP_NODES[nextTrack.from];
                const nextEnd = MAP_NODES[nextTrack.to];
                const nextAngle = Math.atan2(nextEnd.z - nextStart.z, nextEnd.x - nextStart.x);

                // Blend factor: 0 at lookAheadDistance, 1 at junction
                const blendFactor = 1 - (distToEnd / lookAheadDistance);

                // Blend angles using shortest path
                const angleDiff = Math.atan2(Math.sin(nextAngle - currentAngle), Math.cos(nextAngle - currentAngle));
                blendedAngle = currentAngle + angleDiff * blendFactor * 0.5; // 0.5 = partial blend, not full
            }
        }

        // Smooth Rotation
        // Calculate shortest angular distance
        let currentRotation = s.rotation;
        let targetVisualRotation = -blendedAngle;

        // Normalize angles to -PI..PI
        const diff = targetVisualRotation - currentRotation;
        const wrappedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

        // Apply damping to the rotation
        s.rotation = THREE.MathUtils.damp(currentRotation, currentRotation + wrappedDiff, 5, dt);

        // Use blended angle for offset direction too
        const offX = -Math.sin(blendedAngle) * s.offset;
        const offZ = Math.cos(blendedAngle) * s.offset;

        const targetX = bx + offX;
        const targetZ = bz + offZ;

        // Smooth position transitions for turns
        if (!s.isInitialized) {
            // First frame: snap to position
            group.current.position.set(targetX, 0, targetZ);
            s.isInitialized = true;
        } else {
            // Subsequent frames: damp towards target
            group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 5, dt);
            group.current.position.z = THREE.MathUtils.damp(group.current.position.z, targetZ, 5, dt);
        }
        group.current.rotation.y = s.rotation;

        // Lane change tilt
        const laneChangeTilt = (s.offset - targetOffset) * -0.1;
        group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, laneChangeTilt, 2, dt);

        if (onUpdate) {
            onUpdate({
                trackId: s.trackId,
                progress: s.progress,
                speed: s.tempSpeed
            });
        }
    });

    return (
        <group ref={group}>
            <CarGeometry type={type} color={color} />
        </group>
    );
};

export default Car;
