import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import TramMesh from './TramMesh';
import TramModelGLB from './TramModelGLB';

import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { GAME_CONFIG, TRACKS, MAP_NODES, STOPS, MATERIALS, ROUTE_IDS } from '../../constants';
import { playBell, playDoorSound, playIndicatorSound } from '../../utils/audioUtils';

const Headlights: React.FC<{ lightsOn: boolean, target: THREE.Object3D }> = ({ lightsOn, target }) => {
    const timeOfDay = useGameStore(state => state.timeOfDay);
    const leftLightRef = useRef<THREE.SpotLight>(null);
    const rightLightRef = useRef<THREE.SpotLight>(null);
    const leftBulbRef = useRef<THREE.MeshBasicMaterial>(null);
    const rightBulbRef = useRef<THREE.MeshBasicMaterial>(null);
    const lightFadeRef = useRef(0);

    const maxHeadlightIntensity = useMemo(() => {
        const distFromNoon = Math.abs(timeOfDay - 12);
        const darkness = distFromNoon / 12;
        const boost = 1 + (darkness * 3);
        return 30 * boost;
    }, [timeOfDay]);

    useFrame((state, delta) => {
        const targetLight = lightsOn ? 1.0 : 0.0;
        lightFadeRef.current = THREE.MathUtils.lerp(lightFadeRef.current, targetLight, delta * 12.0);
        const currentIntensity = maxHeadlightIntensity * lightFadeRef.current;
        const bulbColor = new THREE.Color("#ffffaa").lerp(new THREE.Color("#222222"), 1 - lightFadeRef.current);

        if (leftLightRef.current) leftLightRef.current.intensity = currentIntensity;
        if (rightLightRef.current) rightLightRef.current.intensity = currentIntensity;
        if (leftBulbRef.current) leftBulbRef.current.color = bulbColor;
        if (rightBulbRef.current) rightBulbRef.current.color = bulbColor;
    });

    return (
        <group>
            <spotLight ref={leftLightRef} position={[7.7, 1.2, 0.8]} target={target} angle={0.6} penumbra={0.5} intensity={0} color="#ffffee" castShadow />
            <spotLight ref={rightLightRef} position={[7.7, 1.2, -0.8]} target={target} angle={0.6} penumbra={0.5} intensity={0} color="#ffffee" castShadow />
            <mesh position={[7.6, 1.2, 0.8]} rotation-y={Math.PI / 2}>
                <circleGeometry args={[0.2, 16]} />
                <meshBasicMaterial ref={leftBulbRef} color="#222222" />
            </mesh>
            <mesh position={[7.6, 1.2, -0.8]} rotation-y={Math.PI / 2}>
                <circleGeometry args={[0.2, 16]} />
                <meshBasicMaterial ref={rightBulbRef} color="#222222" />
            </mesh>
        </group>
    );
};

interface SoapBubblesProps {
    tramRef: React.RefObject<THREE.Group>;
}

const SoapBubbles: React.FC<SoapBubblesProps> = ({ tramRef }) => {
    const bubblesRef = React.useRef<THREE.Points>(null);
    const soapEffectEndTime = useGameStore(state => state.soapEffectEndTime);

    // Increased particle count for a more trail-like effect
    const particleCount = 1000;
    const particles = React.useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const spawnTimes = new Float32Array(particleCount);

        // Start all far below ground/invisible
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] = -100;
            spawnTimes[i] = 0;
            // Init black (invisible with additive blending)
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0;
        }

        return { positions, velocities, colors, spawnTimes };
    }, []);

    const nextParticleIndex = React.useRef(0);

    // Reuse vectors to avoid GC pressure
    const _tramPos = React.useMemo(() => new THREE.Vector3(), []);
    const _tramQuat = React.useMemo(() => new THREE.Quaternion(), []);
    const _localOffset = React.useMemo(() => new THREE.Vector3(), []);

    useFrame((state, delta) => {
        if (!bubblesRef.current || !tramRef.current) return;

        // Force a matrix update to ensure we have the absolute latest world position/rotation
        tramRef.current.updateMatrixWorld(true);

        const colorAttr = bubblesRef.current.geometry.attributes.color;
        const colorArray = colorAttr.array as Float32Array;

        const posAttr = bubblesRef.current.geometry.attributes.position;
        const array = posAttr.array as Float32Array;
        const now = Date.now();
        const isActive = now < soapEffectEndTime;

        // Emit new bubbles if active
        if (isActive) {
            // Get current world transform of the tram
            tramRef.current.getWorldPosition(_tramPos);
            tramRef.current.getWorldQuaternion(_tramQuat);

            // Emit multiple bubbles per frame to create a dense trail if moving
            const emitCount = 5;
            for (let j = 0; j < emitCount; j++) {
                const i = nextParticleIndex.current;

                // Random offset within tram bounds (local space)
                // Tram is ~12m long (X), ~3.5m high (Y), ~2.8m wide (Z)
                // Offset slightly inwards to look like they're coming off the body
                const lx = (Math.random() - 0.5) * 11.5;
                const ly = 0.5 + Math.random() * 3.5;
                const lz = (Math.random() - 0.5) * 2.7;

                // Transform local offset to world space
                _localOffset.set(lx, ly, lz).applyQuaternion(_tramQuat);

                // Spawn at World Position
                array[i * 3] = _tramPos.x + _localOffset.x;
                array[i * 3 + 1] = _tramPos.y + _localOffset.y;
                array[i * 3 + 2] = _tramPos.z + _localOffset.z;

                // Reset color to white
                colorArray[i * 3] = 1;
                colorArray[i * 3 + 1] = 1;
                colorArray[i * 3 + 2] = 1;

                // Slight random drift + buoyancy
                particles.velocities[i * 3] = (Math.random() - 0.5) * 0.05;
                particles.velocities[i * 3 + 1] = Math.random() * 0.04 + 0.01; // Float up slowly
                particles.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
                particles.spawnTimes[i] = now;

                nextParticleIndex.current = (nextParticleIndex.current + 1) % particleCount;
            }
        }

        // Update existing bubbles (lifespan 5 seconds)
        for (let i = 0; i < particleCount; i++) {
            const age = now - particles.spawnTimes[i];
            if (age < 5000) {
                array[i * 3] += particles.velocities[i * 3];
                array[i * 3 + 1] += particles.velocities[i * 3 + 1];
                array[i * 3 + 2] += particles.velocities[i * 3 + 2];

                // Fading logic: Start fading at 3s (last 2s of 5s life)
                let brightness = 1.0;
                if (age > 3000) {
                    brightness = 1.0 - (age - 3000) / 2000;
                    brightness = Math.max(0, brightness);
                }
                colorArray[i * 3] = brightness;
                colorArray[i * 3 + 1] = brightness;
                colorArray[i * 3 + 2] = brightness;
            } else {
                // Kill (hide)
                array[i * 3 + 1] = -100;
                colorArray[i * 3] = 0;
                colorArray[i * 3 + 1] = 0;
                colorArray[i * 3 + 2] = 0;
            }
        }
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
    });

    return (
        <points ref={bubblesRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particleCount}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                vertexColors={true}
                size={0.18}
                transparent
                opacity={0.8}
                blending={THREE.NormalBlending}
                depthWrite={false}
            />
        </points>
    );
};

const Tram: React.FC = () => {
    const group = useRef<THREE.Group>(null);
    const meshGroup = useRef<THREE.Group>(null);
    const spotLightTarget = useRef(new THREE.Object3D());
    const { camera, scene } = useThree();

    // Track the nearby stop to use in event handlers
    const nearbyStopRef = useRef<{ id: number, name: string } | null>(null);

    useEffect(() => {
        scene.add(spotLightTarget.current);
        return () => { scene.remove(spotLightTarget.current); }
    }, [scene]);

    const camControl = useRef({
        angle: 0,
        tilt: 0.5, // Start with a ~28 degree tilt (radians)
        zoom: GAME_CONFIG.camDist,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0
    });

    const physics = useRef({
        speed: 0,
        targetSpeed: 0,
        currentTrackId: 0,
        positionOnTrack: 0,
        rotation: 0,
        lastViolationTrackId: -1
    });

    const boardingTimer = useRef(0);
    const wasDoorsOpen = useRef(false);
    const pendingLeftBehind = useRef(0);

    const {
        setSpeed, setPower, setNextStop, doorsOpen, driverDoorOpen, rampExtended, pantographUp, lightsOn, wipersOn,
        windowsOpen, indicatorLeft, indicatorRight, traction, eBrakeActive,
        toggleDoors, toggleRamp, togglePantograph, toggleLights, toggleWipers, toggleWindows, toggleEBrake, setIndicator,
        boardPassengers, showMessage, addScore, setPlatformSide, platformSide, toggleMinimap, stopQueues, advanceActiveStop, toggleDebugMode,
        teleportTrackId, clearTeleportRequest,
        sunblindDown, engineOn, driverVisible, toggleSunblind, toggleEngine, toggleDriver, useGLBModel
    } = useGameStore(useShallow(state => ({
        setSpeed: state.setSpeed,
        setPower: state.setPower,
        setNextStop: state.setNextStop,
        doorsOpen: state.doorsOpen,
        driverDoorOpen: state.driverDoorOpen,
        rampExtended: state.rampExtended,
        pantographUp: state.pantographUp,
        lightsOn: state.lightsOn,
        wipersOn: state.wipersOn,
        windowsOpen: state.windowsOpen,
        indicatorLeft: state.indicatorLeft,
        indicatorRight: state.indicatorRight,
        traction: state.traction,
        eBrakeActive: state.eBrakeActive,
        toggleDoors: state.toggleDoors,
        toggleRamp: state.toggleRamp,
        togglePantograph: state.togglePantograph,
        toggleLights: state.toggleLights,
        toggleWipers: state.toggleWipers,
        toggleWindows: state.toggleWindows,
        toggleEBrake: state.toggleEBrake,
        setIndicator: state.setIndicator,
        boardPassengers: state.boardPassengers,
        showMessage: state.showMessage,
        addScore: state.addScore,
        setPlatformSide: state.setPlatformSide,
        platformSide: state.platformSide,
        toggleMinimap: state.toggleMinimap,
        stopQueues: state.stopQueues,
        advanceActiveStop: state.advanceActiveStop,
        toggleDebugMode: state.toggleDebugMode,
        teleportTrackId: state.teleportTrackId,
        clearTeleportRequest: state.clearTeleportRequest,
        sunblindDown: state.sunblindDown,
        engineOn: state.engineOn,
        driverVisible: state.driverVisible,
        toggleSunblind: state.toggleSunblind,
        toggleEngine: state.toggleEngine,
        toggleDriver: state.toggleDriver,
        useGLBModel: state.useGLBModel
    })));

    // Handle Teleportation Request
    useEffect(() => {
        if (teleportTrackId !== null) {
            const track = TRACKS.find(tr => tr.id === teleportTrackId);
            if (track) {
                const s = MAP_NODES[track.from];
                const e = MAP_NODES[track.to];
                const angle = Math.atan2(e.z - s.z, e.x - s.x);

                // Update local physics state
                physics.current.currentTrackId = teleportTrackId;
                physics.current.positionOnTrack = 0;
                physics.current.speed = 0;
                physics.current.targetSpeed = 0;
                physics.current.rotation = -angle;

                // Sync the immediate position for camera and indicator
                tramRealtimeData.x = s.x;
                tramRealtimeData.z = s.z;
                tramRealtimeData.rotation = -angle;
                tramRealtimeData.currentTrackId = teleportTrackId;
                tramRealtimeData.positionOnTrack = 0;

                showMessage(`Teleported to Road ${teleportTrackId}`);
            }
            clearTeleportRequest();
        }
    }, [teleportTrackId, clearTeleportRequest, showMessage]);

    const handleToggleDoors = () => {
        if (Math.abs(physics.current.speed) < 0.5) {
            playDoorSound();
            toggleDoors();

            const state = useGameStore.getState();
            // If we are opening... (state might not be updated yet if sync, check previous?)
            // Actually play safe: if doors WERE closed, we open them.
            // But we just called toggleDoors(). Assuming it flips the boolean.
            // Let's use the assumption that if they are now open (or will be), we check stop.
            // Simplified: We assume we just performed an action.

            // Re-implement the check logic properly:
            // We want to advance stop ONLY if we just opened the doors at the correct stop.
            // Zustand set is synchronous. So getState() should reflect the new state immediately?
            // Yes usually.

            if (useGameStore.getState().doorsOpen && nearbyStopRef.current) {
                const stopId = ROUTE_IDS[state.activeRouteIndex];
                if (nearbyStopRef.current.id === stopId) {
                    advanceActiveStop();
                }
            }
        } else {
            showMessage("Stop to open doors!");
        }
    };

    const toggleDoorsRef = useRef(handleToggleDoors);
    toggleDoorsRef.current = handleToggleDoors;

    const keys = useRef<{ [key: string]: boolean }>({});

    // Debug Camera Refs
    const debugCameraMode = useRef(false);
    const debugStopIndex = useRef(-1);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            keys.current[e.code] = true;

            const k = e.key.toLowerCase();
            if (k === 'h') playBell();

            // P = Pantograph Control
            if (k === 'p') togglePantograph();

            // O = Debug Camera (Moved from P)
            if (k === 'o') {
                debugCameraMode.current = true;
                debugStopIndex.current = (debugStopIndex.current + 1) % STOPS.length;
            }

            // R = Sunblind
            if (k === 'r') toggleSunblind();

            // E = Engine
            if (k === 'e') toggleEngine();

            // I = Driver (Interior/Driver visibility)
            if (k === 'i') {
                toggleDriver();
            }

            if (k === 'c') toggleLights();
            if (k === 'g') {
                if (Math.abs(physics.current.speed) > 0.5) {
                    showMessage("Cannot use ramp while moving!");
                } else {
                    toggleRamp();
                }
            }
            if (k === 'b') toggleWipers();
            if (k === 'x') toggleWindows();
            if (k === 'n') {
                toggleEBrake();
            }
            if (k === 'm') toggleMinimap();

            if (e.code === 'Space') {
                toggleDoorsRef.current();
            }

            if (e.code === 'KeyA') setIndicator('left');
            if (e.code === 'KeyD') {
                if (e.shiftKey) {
                    toggleDebugMode();
                } else {
                    setIndicator('right');
                }
            }
        };

        const getActiveStopId = () => {
            const state = useGameStore.getState();
            return ROUTE_IDS[state.activeRouteIndex];
        };

        const onKeyUp = (e: KeyboardEvent) => {
            keys.current[e.code] = false;
        };

        const onBlur = () => {
            keys.current = {};
        };

        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 0) { // Left Click
                // We'll trust React Three Fiber's event system for specific meshes, 
                // but if we need global raycasting we can do it here.
                // However, since we are adding 'onClick' to meshes in TramMesh, 
                // we might not need global raycast for everything.
                // But for "interact with things on the tram and outside", 
                // let's stick to adding onClick handlers on the specific meshes in TramMesh.
                // If we need to click "outside", we can rely on standard pointer events.

                // For now, let's keep the camera drag logic but prevent it if we clicked an interactive object?
                // R3F events bubble. e.stopPropagation() in the mesh onClick will prevent this listener 
                // if we attach this listener to the window. 
                // Actually, window listener receives it last usually? No, native events vs React events.
                // R3F events are independent.

                // Let's rely on R3F onClick for specific interactions.
            }

            camControl.current.isDragging = true;
            camControl.current.lastMouseX = e.clientX;
            camControl.current.lastMouseY = e.clientY;
        };
        const onMouseMove = (e: MouseEvent) => {
            if (camControl.current.isDragging) {
                const deltaX = e.clientX - camControl.current.lastMouseX;
                const deltaY = e.clientY - camControl.current.lastMouseY;

                // Inverse Camera Left/Right: += instead of -=
                camControl.current.angle += deltaX * 0.005;

                // Tilt Camera Up/Down
                camControl.current.tilt += deltaY * 0.005;

                // Clamp tilt to prevent flipping or going underground
                // 0.1 rad (low angle) to 1.5 rad (top down)
                camControl.current.tilt = Math.max(0.1, Math.min(1.5, camControl.current.tilt));

                camControl.current.lastMouseX = e.clientX;
                camControl.current.lastMouseY = e.clientY;
            }
        };
        const onMouseUp = () => {
            camControl.current.isDragging = false;
        };

        const onWheel = (e: WheelEvent) => {
            const minMultiplier = debugCameraMode.current ? 0.1 : 0.5;
            const minZoom = GAME_CONFIG.camDist * minMultiplier;
            const maxZoom = GAME_CONFIG.camDist * 2.0; // Allow zooming out further
            camControl.current.zoom += e.deltaY * 0.05;
            camControl.current.zoom = Math.max(minZoom, Math.min(maxZoom, camControl.current.zoom));
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('wheel', onWheel);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('wheel', onWheel);
        };
    }, []);

    const getNextTrack = (currentId: number) => {
        const currentTrack = TRACKS.find(t => t.id === currentId);
        if (!currentTrack) return [];
        return TRACKS.filter(t => t.from === currentTrack.to);
    };


    // Light Refs for Direct Manipulation
    const leftLightRef = useRef<THREE.SpotLight>(null);
    const rightLightRef = useRef<THREE.SpotLight>(null);
    const leftBulbRef = useRef<THREE.MeshBasicMaterial>(null);
    const rightBulbRef = useRef<THREE.MeshBasicMaterial>(null);

    const lastUpdate = useRef(0);

    useFrame((state, delta) => {
        if (!group.current) return;

        const dt = Math.min(delta, 0.1);

        // Physics Updates
        const p = physics.current;

        // Handle Driver Position logic
        if (!driverVisible && group.current) {
            // Driver is Outside
            // Calculate a position relative to the Front Right door (approx x=2, z=2)
            const offset = new THREE.Vector3(2, 0, 2);
            offset.applyEuler(group.current.rotation);
            const driverWorldPos = group.current.position.clone().add(offset);
            tramRealtimeData.driverPosition = driverWorldPos;
        } else {
            tramRealtimeData.driverPosition = null;
        }

        // --- Acceleration / Deceleration ---
        let powerInput = 0;

        // Auto-disable debug camera if tram moves
        if (Math.abs(p.speed) > 0.1 && debugCameraMode.current) {
            debugCameraMode.current = false;
        }

        const TARGET_SPEED_CHANGE_RATE = 100 * dt; // Change target by ~100 km/h per second

        // Input Handling for Target Speed
        if (driverVisible) {
            if (keys.current['KeyW']) {
                if (doorsOpen) {
                    showMessage("Close doors before moving!");
                    p.targetSpeed = 0;
                } else if (rampExtended) {
                    showMessage("Retract ramp before moving!");
                    p.targetSpeed = 0;
                } else if (!pantographUp) {
                    showMessage("Raise Pantograph for power!");
                    p.targetSpeed = 0;
                } else if (eBrakeActive) {
                    showMessage("Release E-Brake (N) to move!");
                    p.targetSpeed = 0;
                } else if (!engineOn) {
                    showMessage("Start Engine (E) first!");
                    p.targetSpeed = 0;
                } else {
                    // Accelerate (Clamp to Max Speed)
                    p.targetSpeed += TARGET_SPEED_CHANGE_RATE;
                    if (p.targetSpeed > GAME_CONFIG.maxSpeed) p.targetSpeed = GAME_CONFIG.maxSpeed;
                }
            }
            else if (keys.current['KeyS']) {
                // Decelerate / Reverse (Clamp to -Max Speed)
                p.targetSpeed -= TARGET_SPEED_CHANGE_RATE;
                if (p.targetSpeed < -GAME_CONFIG.maxSpeed) p.targetSpeed = -GAME_CONFIG.maxSpeed;
            } else {
                // Auto-stop at low speeds if no keys pressed
                if (Math.abs(p.speed) <= 25 && p.targetSpeed !== 0) {
                    const autoStopRate = TARGET_SPEED_CHANGE_RATE * 0.5;
                    // Move target speed towards 0
                    if (p.targetSpeed > 0) {
                        p.targetSpeed = Math.max(0, p.targetSpeed - autoStopRate);
                    } else if (p.targetSpeed < 0) {
                        p.targetSpeed = Math.min(0, p.targetSpeed + autoStopRate);
                    }
                }
            }
        } else {
            // Driver is outside - Force stop/brake
            p.targetSpeed = 0;
        }

        if (eBrakeActive) {
            p.targetSpeed = 0;
            powerInput = -1; // Visual max brake
            // Emergency brake: stop nearly immediately (Stops from 120km/h in ~3 frames)
            if (Math.abs(p.speed) < GAME_CONFIG.eBrakePower) {
                p.speed = 0;
            } else {
                p.speed -= Math.sign(p.speed) * GAME_CONFIG.eBrakePower;
            }
        } else {
            const diff = p.targetSpeed - p.speed;
            const speedDeadzone = 0.2;

            if (Math.abs(diff) < speedDeadzone) {
                p.speed = p.targetSpeed;
                powerInput = 0;
            } else {
                // Determine rate (Acceleration vs Braking)
                const isSameDirection = Math.sign(p.speed) === Math.sign(p.targetSpeed) || p.speed === 0 || p.targetSpeed === 0;
                const isSlowingDown = Math.abs(p.targetSpeed) < Math.abs(p.speed);

                let rate = GAME_CONFIG.acceleration;

                if (isSameDirection && isSlowingDown) {
                    rate = GAME_CONFIG.brakePower; // Braking
                } else if (!isSameDirection) {
                    rate = GAME_CONFIG.brakePower; // Counter-braking / Reversing
                }

                rate *= traction;

                if (diff > 0) {
                    p.speed += rate;
                    if (p.speed > p.targetSpeed) p.speed = p.targetSpeed;
                    powerInput = (rate === GAME_CONFIG.acceleration * traction) ? 1 : -0.5; // Visual power
                } else {
                    p.speed -= rate;
                    if (p.speed < p.targetSpeed) p.speed = p.targetSpeed;
                    powerInput = (rate === GAME_CONFIG.acceleration * traction) ? -1 : -0.5; // Visual power
                }

                // Refine visual powerInput for gauge
                // If accelerating (getting faster), 1. If braking (slowing), -1.
                if (Math.abs(p.speed) > Math.abs(p.speed - (diff > 0 ? rate : -rate))) {
                    // Speed increased magnitude -> Acceleration
                    powerInput = (diff > 0) ? 1 : -1;
                    // Wait, if moving negative (-10) and accelerating to -20, power is (negative)? 
                    // Usually power gauge: Right = Accel, Left = Brake? 
                    // Let's stick to: Positive Torque vs Negative Torque?
                    // Or "Effort" vs "Regen"?
                    // Let's keep it simple: Direction of force.
                    powerInput = Math.sign(diff);
                } else {
                    // Speed decreased magnitude -> Braking
                    powerInput = -Math.sign(p.speed) * 0.5; // Light braking visual
                }
            }
        }

        // Throttle UI updates to 10Hz (every 100ms) to prevent React lag
        lastUpdate.current += delta;
        if (lastUpdate.current > 0.1) {
            setSpeed(p.speed);
            setPower(powerInput);
            lastUpdate.current = 0;
        }

        // --- Movement Logic ---
        const moveDist = (p.speed * 1000 / 3600) * dt;
        p.positionOnTrack += moveDist;

        const currentTrack = TRACKS.find(t => t.id === p.currentTrackId);
        if (!currentTrack) return;

        // Signal Violation Check
        const signalMode = useGameStore.getState().getSignalMode(p.currentTrackId);
        const distToEnd = currentTrack.length - p.positionOnTrack;
        if (distToEnd < 4 && distToEnd > 0 && signalMode === 'STOP' && p.speed > 2) {
            if (p.lastViolationTrackId !== p.currentTrackId) {
                showMessage("SIGNAL VIOLATION! Stop at Red.");
                addScore(-20, "Signal Jumped");
                p.lastViolationTrackId = p.currentTrackId;
            }
        }

        // Reset violation flag when entering middle of track
        if (p.positionOnTrack > 10 && p.positionOnTrack < currentTrack.length - 10) {
            p.lastViolationTrackId = -1;
        }
        const s = MAP_NODES[currentTrack.from];
        const e = MAP_NODES[currentTrack.to];

        if (p.positionOnTrack >= currentTrack.length) {
            const overshoot = p.positionOnTrack - currentTrack.length;
            const nextOptions = getNextTrack(p.currentTrackId);

            if (nextOptions.length > 0) {
                let chosen = nextOptions[0];
                if (nextOptions.length > 1) {
                    const curAngle = Math.atan2(e.z - s.z, e.x - s.x);

                    let validOptions = nextOptions.filter(opt => opt.to !== currentTrack.from);
                    if (validOptions.length === 0) validOptions = nextOptions;

                    const choices = validOptions.map(opt => {
                        const os = MAP_NODES[opt.from];
                        const oe = MAP_NODES[opt.to];
                        const nextAngle = Math.atan2(oe.z - os.z, oe.x - os.x);
                        let diff = nextAngle - curAngle;
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
                    } else {
                        choices.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
                        chosen = choices[0].track;
                    }
                }
                p.currentTrackId = chosen.id;
                p.positionOnTrack = overshoot;
            } else {
                p.speed = 0;
                p.positionOnTrack = currentTrack.length;
            }
        } else if (p.positionOnTrack < 0) {
            const prevTracks = TRACKS.filter(t => t.to === currentTrack.from);

            if (prevTracks.length > 0) {
                const curAngle = Math.atan2(e.z - s.z, e.x - s.x);
                let bestPrev = prevTracks[0];
                let minDiff = 999;

                for (const t of prevTracks) {
                    const ps = MAP_NODES[t.from];
                    const pe = MAP_NODES[t.to];
                    const prevAngle = Math.atan2(pe.z - ps.z, pe.x - ps.x);
                    let diff = Math.abs(prevAngle - curAngle);
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    diff = Math.abs(diff);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestPrev = t;
                    }
                }

                p.currentTrackId = bestPrev.id;
                p.positionOnTrack = bestPrev.length + p.positionOnTrack;
            } else {
                p.positionOnTrack = 0;
                p.speed = 0;
            }
        }

        const activeTrack = TRACKS.find(t => t.id === p.currentTrackId);
        if (!activeTrack) return;
        const s2 = MAP_NODES[activeTrack.from];
        const e2 = MAP_NODES[activeTrack.to];
        const t = p.positionOnTrack / activeTrack.length;

        const x = s2.x + (e2.x - s2.x) * t;
        const z = s2.z + (e2.z - s2.z) * t;
        const angle = Math.atan2(e2.z - s2.z, e2.x - s2.x);
        const targetRot = -angle;

        let diff = targetRot - p.rotation;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.rotation += diff * 0.1;

        tramRealtimeData.x = x;
        tramRealtimeData.z = z;
        tramRealtimeData.rotation = p.rotation;
        tramRealtimeData.currentTrackId = p.currentTrackId;
        tramRealtimeData.positionOnTrack = p.positionOnTrack;

        if (group.current && meshGroup.current) {
            group.current.position.set(x, 0, z);
            meshGroup.current.rotation.y = p.rotation;
            const forward = new THREE.Vector3(20, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotation);
            spotLightTarget.current.position.copy(group.current.position).add(forward);

            // Check Wash Proximity
            const washPos = new THREE.Vector3(-35, 0, -100);
            if (group.current.position.distanceTo(washPos) < 10) {
                useGameStore.getState().setSoapEffectEndTime(Date.now() + 5000);
            }
        }

        let nearbyStop = null;
        let side: 'left' | 'right' | null = null;
        for (const stop of STOPS) {
            const dist = group.current?.position.distanceTo(stop.position);
            if (dist && dist < 25) {
                nearbyStop = stop;
                const platformOffset = new THREE.Vector3(0, 0, 3.5);
                if (stop.rotation) {
                    platformOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.rotation);
                }
                const platformPos = stop.position.clone().add(platformOffset);
                const toPlatform = new THREE.Vector3().subVectors(platformPos, group.current!.position);
                const tramRight = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotation);
                side = toPlatform.dot(tramRight) > 0 ? 'right' : 'left';
                break;
            }
        }
        nearbyStopRef.current = nearbyStop;

        const currentNextStop = useGameStore.getState().nextStop;
        const targetNextStop = nearbyStop ? nearbyStop.name : "Roaming";
        if (currentNextStop !== targetNextStop) {
            setNextStop(targetNextStop);
        }

        const currentSide = useGameStore.getState().platformSide;
        if (currentSide !== side) {
            setPlatformSide(side);
        }

        if (wasDoorsOpen.current && !doorsOpen && nearbyStop) {
            const waiting = stopQueues[nearbyStop.id]?.length || 0;
            if (waiting > 0) {
                pendingLeftBehind.current = waiting;
            }
        }
        if (doorsOpen) {
            pendingLeftBehind.current = 0;
        }
        if (Math.abs(p.speed) > 1.0 && pendingLeftBehind.current > 0) {
            addScore(-pendingLeftBehind.current * 5, "Left Passengers!");
            showMessage(`Left ${pendingLeftBehind.current} passengers behind! -${pendingLeftBehind.current * 5}`);
            pendingLeftBehind.current = 0;
        }

        wasDoorsOpen.current = doorsOpen;

        // --- Camera Update with Tilt ---
        if (debugCameraMode.current && debugStopIndex.current >= 0 && STOPS[debugStopIndex.current]) {
            // Debug Camera: Look at specific platform with Orbital Controls
            const stop = STOPS[debugStopIndex.current];

            const totalAngle = camControl.current.angle + (stop.rotation || 0) + Math.PI; // Face the station front
            const tilt = camControl.current.tilt;
            const radius = camControl.current.zoom;

            const hDist = radius * Math.cos(tilt);
            const vDist = radius * Math.sin(tilt);

            const cx = stop.position.x - Math.cos(totalAngle) * hDist;
            const cz = stop.position.z - Math.sin(totalAngle) * hDist;
            const cy = stop.position.y + vDist;

            camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.1);
            camera.lookAt(stop.position);
        } else {
            // Regular Tram Camera
            const totalAngle = angle + camControl.current.angle;
            const tilt = camControl.current.tilt;
            const radius = camControl.current.zoom;

            const hDist = radius * Math.cos(tilt);
            const vDist = radius * Math.sin(tilt);

            const cx = x - Math.cos(totalAngle) * hDist;
            const cz = z - Math.sin(totalAngle) * hDist;
            const cy = vDist;

            camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.1);
            camera.lookAt(x, 0, z);
        }





        if (nearbyStop && Math.abs(p.speed) < 0.1 && doorsOpen) {
            boardingTimer.current += delta;
            if (boardingTimer.current > 0.2) {
                boardingTimer.current = 0;
                boardPassengers(nearbyStop.id);
            }
        }
    });



    return (
        <>
            <group ref={group}>
                {useGLBModel ? (
                    <Suspense fallback={null}>
                        <TramModelGLB
                            ref={meshGroup}
                            lightsOn={lightsOn}
                        >
                            <Headlights lightsOn={lightsOn} target={spotLightTarget.current} />
                        </TramModelGLB>
                    </Suspense>
                ) : (
                    <TramMesh
                        ref={meshGroup}
                        lightsOn={lightsOn}
                        doorsOpen={doorsOpen}
                        rampExtended={rampExtended}
                        pantographUp={pantographUp}
                        wipersOn={wipersOn}
                        windowsOpen={windowsOpen}
                        platformSide={platformSide || 'right'}
                        excludeBulbs={true}
                        sunblindDown={sunblindDown}
                        driverVisible={driverVisible}
                        indicatorLeft={indicatorLeft}
                        indicatorRight={indicatorRight}
                        driverDoorOpen={driverDoorOpen}
                        onToggleDoors={handleToggleDoors}
                    >
                        <Headlights lightsOn={lightsOn} target={spotLightTarget.current} />
                    </TramMesh>
                )}

                {/* External Driver Represenation (when outside) */}
                {!driverVisible && (
                    <group position={[2, 0, 2]}>
                        {/* RATP Driver Outside */}
                        <mesh position={[0, 0.9, 0]}>
                            <boxGeometry args={[0.5, 1.8, 0.5]} />
                            <meshStandardMaterial color="#003366" />
                        </mesh>
                        <mesh position={[0, 1.9, 0]}>
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshStandardMaterial color="#ffccaa" />
                        </mesh>
                        {/* Hat */}
                        <group position={[0, 2.05, 0]}>
                            <mesh position={[0, 0.05, 0]}>
                                <cylinderGeometry args={[0.24, 0.24, 0.1, 16]} />
                                <meshStandardMaterial color="#003366" />
                            </mesh>
                            <mesh position={[0.15, 0, 0]} rotation-z={-0.2}>
                                <boxGeometry args={[0.2, 0.02, 0.2]} />
                                <meshStandardMaterial color="#000" />
                            </mesh>
                        </group>
                    </group>
                )}
            </group>
            <SoapBubbles tramRef={meshGroup} />
        </>
    );
};

export default Tram;