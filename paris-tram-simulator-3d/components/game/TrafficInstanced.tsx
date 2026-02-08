
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { TRACKS, MAP_NODES, STOPS, GAME_CONFIG } from '../../constants';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';

// --- Types & Constants ---
export type CarType = 0 | 1 | 2 | 3 | 4;
export const CAR_COLORS = ["#ffffff", "#111111", "#ff0000", "#00ff00", "#0000ff", "#888888"];
const CAR_COUNT = 200;

interface CarState {
    id: number;
    type: CarType;
    color: THREE.Color;
    trackId: number;
    progress: number;
    speed: number;
    offset: number;
    rotation: number;
    tempSpeed: number;
    isOvertaking: boolean;
    isInitialized: boolean;
    // Position needed for matrix update
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
}

// --- Pre-calculations ---
const STOPS_ON_TRACKS = TRACKS.map(track => {
    const start = MAP_NODES[track.from];
    const end = MAP_NODES[track.to];
    const dir = new THREE.Vector2(end.x - start.x, end.z - start.z);
    const len = dir.length();
    dir.normalize();

    const stops = STOPS.filter(stop => {
        const toStop = new THREE.Vector2(stop.position.x - start.x, stop.position.z - start.z);
        const projection = toStop.dot(dir);
        if (projection < -5 || projection > len + 5) return false;

        const projV = dir.clone().multiplyScalar(projection);
        const perp = toStop.clone().sub(projV);
        return perp.length() < 12;
    }).map(stop => {
        const toStop = new THREE.Vector2(stop.position.x - start.x, stop.position.z - start.z);
        const projection = toStop.dot(dir);

        const stopAngle = stop.rotation || 0;
        const platformLocal = new THREE.Vector3(0, 0, 3.5);
        platformLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), stopAngle);
        const platformGlobal = stop.position.clone().add(platformLocal);

        const normal = new THREE.Vector2(-dir.y, dir.x);
        const toPlatform = new THREE.Vector2(platformGlobal.x - start.x, platformGlobal.z - start.z);
        const sideOffset = toPlatform.dot(normal);

        return {
            id: stop.id,
            progress: projection,
            sideOffset: sideOffset
        };
    });

    return { trackId: track.id, stops };
});


// --- Geometry Generation ---
const createCarGeometry = (type: CarType): THREE.BufferGeometry => {
    const parts: THREE.BufferGeometry[] = [];
    const mat = new THREE.Matrix4();

    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        geo.applyMatrix4(mat.makeTranslation(x, y, z));
        parts.push(geo);
    }

    if (type === 0) { // Sedan
        addBox(2.2, 0.5, 1.4, 0, 0.6, 0);
        addBox(1.2, 0.6, 1.3, -0.2, 1.1, 0);
    } else if (type === 1) { // Hatchback
        addBox(1.8, 0.8, 1.4, 0, 0.7, 0);
        addBox(1.2, 0.6, 1.3, 0, 1.25, 0);
    } else if (type === 2) { // SUV
        addBox(2.4, 0.8, 1.6, 0, 0.8, 0);
        addBox(1.6, 0.7, 1.5, -0.2, 1.5, 0);
    } else if (type === 3) { // Sports
        addBox(2.4, 0.4, 1.5, 0, 0.5, 0);
        addBox(1.0, 0.45, 1.3, -0.1, 0.9, 0);
    } else if (type === 4) { // Van
        addBox(2.4, 1.2, 1.5, 0, 1.0, 0);
    }

    // Merge logic
    if (parts.length > 0) {
        return mergeBufferGeometries(parts);
    }
    return new THREE.BoxGeometry(1, 1, 1);
};

// Wheel Geometry (Shared)
const wheelGeoBase = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
wheelGeoBase.rotateX(Math.PI / 2);
// 4 wheels per car, relative positions
const WHEEL_OFFSETS = [
    [0.7, 0.35, 0.5], [-0.7, 0.35, 0.5],
    [0.7, 0.35, -0.5], [-0.7, 0.35, -0.5]
];

// --- Component ---
const TrafficInstanced: React.FC = () => {
    const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]); // 5 refs for 5 types
    const wheelMeshRef = useRef<THREE.InstancedMesh>(null);
    const windowMeshRef = useRef<THREE.InstancedMesh>(null); // Optional: Simple window block for all? Skip for now to save draw calls

    const carStates = useRef<CarState[]>([]);

    // Initialize Cars
    useMemo(() => {
        const cars: CarState[] = [];
        for (let i = 0; i < CAR_COUNT; i++) {
            const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
            cars.push({
                id: i,
                type: Math.floor(Math.random() * 5) as CarType,
                color: new THREE.Color(CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]),
                trackId: track.id,
                progress: Math.random() * track.length,
                speed: 30 + Math.random() * 20,
                tempSpeed: 30 + Math.random() * 20,
                offset: 0,
                rotation: 0,
                isOvertaking: false,
                isInitialized: false,
                position: new THREE.Vector3(),
                quaternion: new THREE.Quaternion()
            });
        }
        carStates.current = cars;
    }, []);

    // Geometries
    const geometries = useMemo(() => {
        return [0, 1, 2, 3, 4].map(t => createCarGeometry(t as CarType));
    }, []);

    // Game Loop
    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.1);
        const cars = carStates.current;
        const tramSpeed = useGameStore.getState().speed;
        const tramPos = new THREE.Vector3(tramRealtimeData.x, 0, tramRealtimeData.z);
        const currentTrackId = tramRealtimeData.currentTrackId;
        const driverPos = tramRealtimeData.driverPosition;

        // --- 1. Physics Update Loop ---
        // Optimization: Spatial Hash or just Loop. For 200 items, nested loop is 40k.
        // Let's do a simple optimization: Sort by trackID?
        // Or just map cars by trackID for O(N) lookup.
        const carsByTrack: { [key: number]: CarState[] } = {};
        for (let c of cars) {
            if (!carsByTrack[c.trackId]) carsByTrack[c.trackId] = [];
            carsByTrack[c.trackId].push(c);
        }

        cars.forEach(s => {
            // Collision Logic
            let obstaclesAhead = false;
            let targetSpeed = s.speed;
            let shouldOvertake = false;

            // Check Tram
            if (currentTrackId === s.trackId) {
                const dist = tramRealtimeData.positionOnTrack - s.progress;
                if (dist > 0 && dist < 25) {
                    obstaclesAhead = true;
                    if (Math.abs(tramSpeed) < 1.0 || tramSpeed < 0) {
                        shouldOvertake = true;
                    } else {
                        targetSpeed = Math.min(s.speed, Math.abs(tramSpeed));
                    }
                }
                else if (s.isOvertaking && dist <= 0 && dist > -20) {
                    shouldOvertake = true;
                }
            }

            // Check Stops
            const trackStops = STOPS_ON_TRACKS.find(ts => ts.trackId === s.trackId)?.stops || [];
            let forceLeft = false;
            let forceRight = false;

            for (let stop of trackStops) {
                const dist = stop.progress - s.progress;
                if (dist > -15 && dist < 25) {
                    if (stop.sideOffset > 1.5) {
                        forceLeft = true;
                        if (s.offset > 0 && dist > 0 && dist < 12) {
                            obstaclesAhead = true;
                            targetSpeed = Math.min(targetSpeed, 10);
                        }
                    }
                    if (stop.sideOffset < -1.5) {
                        forceRight = true;
                        if (s.offset < 0 && dist > 0 && dist < 12) {
                            obstaclesAhead = true;
                            targetSpeed = Math.min(targetSpeed, 10);
                        }
                    }
                }
            }
            if (forceLeft) shouldOvertake = true;
            if (forceRight) shouldOvertake = false;

            // Check Other Cars (Only on same track)
            const others = carsByTrack[s.trackId] || [];
            for (let car of others) {
                if (car.id === s.id) continue;
                const dist = car.progress - s.progress;
                if (dist > 0 && dist < 8) {
                    obstaclesAhead = true;
                    targetSpeed = Math.min(targetSpeed, car.tempSpeed); // Use tempSpeed (current speed)
                    if (dist < 5) targetSpeed = 0;
                }
            }

            // Check Signals
            const trackInfo = TRACKS.find(t => t.id === s.trackId);
            if (trackInfo) {
                const signalMode = useGameStore.getState().getSignalMode(s.trackId);
                const distToEnd = trackInfo.length - s.progress;
                if (distToEnd < 15 && distToEnd > 0) {
                    if (signalMode === 'STOP') {
                        obstaclesAhead = true;
                        targetSpeed = 0;
                    } else if (signalMode === 'SLOW') {
                        obstaclesAhead = true;
                        targetSpeed = Math.min(targetSpeed, 15);
                    }
                }
            }

            // Check Driver on Road
            if (driverPos) {
                const distToDriver = s.position.distanceTo(driverPos);
                if (distToDriver < 8) { // Safety radius
                    obstaclesAhead = true;
                    targetSpeed = 0;
                }
            }

            // Apply Speed Limits
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

            // Move
            const moveDist = (s.tempSpeed * 1000 / 3600) * dt;
            s.progress += moveDist;

            // Track wrapping logic... (simplified for brevity but essential)
            let track = TRACKS.find(t => t.id === s.trackId) || TRACKS[0];
            if (s.progress > track.length) {
                s.progress -= track.length;
                const nextTracks = TRACKS.filter(t => t.from === track!.to && t.to !== track!.from);
                if (nextTracks.length > 0) {
                    const next = nextTracks[Math.floor(Math.random() * nextTracks.length)];
                    s.trackId = next.id;
                    track = next;
                } else {
                    const fallback = TRACKS.filter(t => t.from === track!.to);
                    if (fallback.length > 0) {
                        s.trackId = fallback[0].id; track = fallback[0];
                    } else {
                        s.progress = track.length; s.tempSpeed = 0;
                    }
                }
            }

            // Calculate Position & Rotation
            const start = MAP_NODES[track.from];
            const end = MAP_NODES[track.to];
            const t = s.progress / track.length;
            const bx = start.x + (end.x - start.x) * t;
            const bz = start.z + (end.z - start.z) * t;
            const currentAngle = Math.atan2(end.z - start.z, end.x - start.x);

            // Blending Logic (Lookahead)
            const lookAheadDistance = 15;
            const distToEnd = track.length - s.progress;
            let blendedAngle = currentAngle;

            if (distToEnd < lookAheadDistance && distToEnd > 0) {
                const nextTracks = TRACKS.filter(tr => tr.from === track!.to);
                if (nextTracks.length > 0) {
                    const nextTrack = nextTracks[0];
                    const nextStart = MAP_NODES[nextTrack.from];
                    const nextEnd = MAP_NODES[nextTrack.to];
                    const nextAngle = Math.atan2(nextEnd.z - nextStart.z, nextEnd.x - nextStart.x);
                    const blendFactor = 1 - (distToEnd / lookAheadDistance);
                    const angleDiff = Math.atan2(Math.sin(nextAngle - currentAngle), Math.cos(nextAngle - currentAngle));
                    blendedAngle = currentAngle + angleDiff * blendFactor * 0.5;
                }
            }

            let currentRotation = s.rotation;
            let targetVisualRotation = -blendedAngle;
            const diff = targetVisualRotation - currentRotation;
            const wrappedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
            s.rotation = THREE.MathUtils.damp(currentRotation, currentRotation + wrappedDiff, 5, dt);

            const offX = -Math.sin(blendedAngle) * s.offset;
            const offZ = Math.cos(blendedAngle) * s.offset;
            const targetX = bx + offX;
            const targetZ = bz + offZ;

            if (!s.isInitialized) {
                s.position.set(targetX, 0, targetZ);
                s.isInitialized = true;
            } else {
                s.position.x = THREE.MathUtils.damp(s.position.x, targetX, 5, dt);
                s.position.z = THREE.MathUtils.damp(s.position.z, targetZ, 5, dt);
            }

            // Rotation quaternion
            const laneChangeTilt = (s.offset - targetOffset) * -0.1;
            // s.rotation is Y rotation
            const euler = new THREE.Euler(0, s.rotation, laneChangeTilt);
            s.quaternion.setFromEuler(euler);
        });

        // --- 2. Render Update Loop ---
        const dummy = new THREE.Object3D();
        const wheelDummy = new THREE.Object3D();

        // Counters for each instance mesh
        const counts = [0, 0, 0, 0, 0];
        let wheelIndex = 0;

        cars.forEach(car => {
            const mesh = meshRefs.current[car.type];
            if (mesh) {
                const idx = counts[car.type]++;
                dummy.position.copy(car.position);
                dummy.quaternion.copy(car.quaternion);
                dummy.updateMatrix();
                mesh.setMatrixAt(idx, dummy.matrix);
                mesh.setColorAt(idx, car.color);
            }

            // Wheels
            if (wheelMeshRef.current) {
                // 4 wheels
                for (let w = 0; w < 4; w++) {
                    const [wx, wy, wz] = WHEEL_OFFSETS[w];
                    // Local to Car
                    wheelDummy.position.set(wx, wy, wz);
                    wheelDummy.rotation.set(0, 0, 0); // Wheels rotation (if animating spin, add here)
                    wheelDummy.updateMatrix();

                    // Multiply with Car Matrix
                    const carMatrix = dummy.matrix;
                    const finalMatrix = carMatrix.clone().multiply(wheelDummy.matrix);

                    wheelMeshRef.current.setMatrixAt(wheelIndex++, finalMatrix);
                }
            }
        });

        // Update Instance Matrices
        [0, 1, 2, 3, 4].forEach(i => {
            if (meshRefs.current[i]) {
                meshRefs.current[i]!.count = counts[i]; // Needed? No, count is total capacity usually
                meshRefs.current[i]!.instanceMatrix.needsUpdate = true;
                if (meshRefs.current[i]!.instanceColor) meshRefs.current[i]!.instanceColor!.needsUpdate = true;
            }
        });
        if (wheelMeshRef.current) {
            wheelMeshRef.current.instanceMatrix.needsUpdate = true;
        }

    });

    return (
        <group>
            {[0, 1, 2, 3, 4].map((type) => (
                <instancedMesh
                    key={type}
                    ref={(el) => (meshRefs.current[type] = el)}
                    args={[geometries[type], undefined, CAR_COUNT]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial />
                </instancedMesh>
            ))}
            <instancedMesh
                ref={wheelMeshRef}
                args={[wheelGeoBase, undefined, CAR_COUNT * 4]}
                castShadow
            >
                <meshStandardMaterial color="#111" />
            </instancedMesh>
        </group>
    );
};

export default TrafficInstanced;
