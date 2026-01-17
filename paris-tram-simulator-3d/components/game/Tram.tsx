import React, { useRef, useEffect, useMemo } from 'react';
import TramMesh from './TramMesh';

import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { GAME_CONFIG, TRACKS, MAP_NODES, STOPS, MATERIALS, ROUTE_IDS } from '../../constants';
import { playBell, playDoorSound } from '../../utils/audioUtils';

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
        rotation: 0
    });

    const boardingTimer = useRef(0);
    const wasDoorsOpen = useRef(false);
    const pendingLeftBehind = useRef(0);

    const {
        setSpeed, setPower, setNextStop, doorsOpen, rampExtended, pantographUp, lightsOn, wipersOn,
        windowsOpen, indicatorLeft, indicatorRight, traction, eBrakeActive,
        toggleDoors, toggleRamp, togglePantograph, toggleLights, toggleWipers, toggleWindows, toggleEBrake, setIndicator,
        boardPassengers, showMessage, addScore, setPlatformSide, platformSide, toggleMinimap, stopQueues, advanceActiveStop, toggleDebugMode
    } = useGameStore(useShallow(state => ({
        setSpeed: state.setSpeed,
        setPower: state.setPower,
        setNextStop: state.setNextStop,
        doorsOpen: state.doorsOpen,
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
        toggleDebugMode: state.toggleDebugMode
    })));

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

            // Remap P to switch camera between platforms
            if (k === 'p') {
                debugCameraMode.current = true;
                debugStopIndex.current = (debugStopIndex.current + 1) % STOPS.length;
            }

            // Remap O to toggle Pantograph (was P)
            if (k === 'o') togglePantograph();

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

    const getNextTrack = (currentId: number) => TRACKS.filter(t => t.from === TRACKS[currentId].to);


    // Light Refs for Direct Manipulation
    const leftLightRef = useRef<THREE.SpotLight>(null);
    const rightLightRef = useRef<THREE.SpotLight>(null);
    const leftBulbRef = useRef<THREE.MeshBasicMaterial>(null);
    const rightBulbRef = useRef<THREE.MeshBasicMaterial>(null);

    const lastUpdate = useRef(0);

    useFrame((state, delta) => {
        const dt = 1 / 60;
        const p = physics.current;



        // --- Physics & Input ---
        let powerInput = 0;

        // Auto-disable debug camera if tram moves
        if (Math.abs(p.speed) > 0.1 && debugCameraMode.current) {
            debugCameraMode.current = false;
        }

        const TARGET_SPEED_CHANGE_RATE = 40 * dt; // Change target by ~40 km/h per second

        // Input Handling for Target Speed
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
            } else {
                p.targetSpeed += TARGET_SPEED_CHANGE_RATE;
            }
        }
        else if (keys.current['KeyS']) {
            p.targetSpeed -= TARGET_SPEED_CHANGE_RATE;
        }

        // Clamp Target Speed (-20 to Max)
        p.targetSpeed = Math.max(-20, Math.min(GAME_CONFIG.maxSpeed, p.targetSpeed));

        // Emergency Blockers check (Continuous safety)
        if (doorsOpen || rampExtended || !pantographUp) {
            // Force target to 0 if state changes while moving
            p.targetSpeed = 0;
        }

        if (eBrakeActive) {
            p.targetSpeed = 0;
            if (Math.abs(p.speed) > 0) p.speed -= Math.sign(p.speed) * GAME_CONFIG.deceleration * 3;
            if (Math.abs(p.speed) < 0.1) p.speed = 0;
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

        const currentTrack = TRACKS[p.currentTrackId];
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

        const activeTrack = TRACKS[p.currentTrackId];
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
                useGameStore.getState().setSoapEffectEndTime(Date.now() + 35000);
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
        <group ref={group}>
            <TramMesh
                ref={meshGroup}
                lightsOn={lightsOn}
                doorsOpen={doorsOpen}
                rampExtended={rampExtended}
                pantographUp={pantographUp}
                wipersOn={wipersOn}
                windowsOpen={windowsOpen}
                platformSide={platformSide}
                excludeBulbs={true}
                onToggleDoors={handleToggleDoors}
            >
                <Headlights lightsOn={lightsOn} target={spotLightTarget.current} />
            </TramMesh>
        </group>
    );
};

export default Tram;