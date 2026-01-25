
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { GAME_CONFIG } from '../../constants';

const PARTICLE_COUNT = 1500;
const AREA_SIZE = 80;

// Color Keyframes for Day/Night Cycle
const DAY_CYCLE = [
    // Midnight: Bright pale blue moonlight, moderate ambient, high fog (was 0.003)
    { hour: 0, sky: new THREE.Color('#050515'), light: new THREE.Color('#b0c4de'), ambient: new THREE.Color('#505070'), intensity: 0.5, fog: 0.015 },
    // Pre-dawn
    { hour: 4, sky: new THREE.Color('#0a0a25'), light: new THREE.Color('#b0c4de'), ambient: new THREE.Color('#555575'), intensity: 0.5, fog: 0.012 },
    // Dawn: Orange/Pink glow
    { hour: 6, sky: new THREE.Color('#ff9966'), light: new THREE.Color('#ffaa66'), ambient: new THREE.Color('#806060'), intensity: 0.5, fog: 0.008 },
    // Morning: Bright and clear (was 0.002)
    { hour: 8, sky: new THREE.Color('#87CEEB'), light: new THREE.Color('#fff5e0'), ambient: new THREE.Color('#808080'), intensity: 1.0, fog: 0.005 },
    // Noon: Peak brightness
    { hour: 12, sky: new THREE.Color('#4CA1FF'), light: new THREE.Color('#ffffff'), ambient: new THREE.Color('#909090'), intensity: 1.2, fog: 0.005 },
    // Late afternoon
    { hour: 17, sky: new THREE.Color('#87CEEB'), light: new THREE.Color('#ffe5cc'), ambient: new THREE.Color('#808070'), intensity: 0.9, fog: 0.005 },
    // Dusk: Reddish/Purple
    { hour: 19, sky: new THREE.Color('#4a3040'), light: new THREE.Color('#ff8866'), ambient: new THREE.Color('#706070'), intensity: 0.7, fog: 0.008 },
    // Night start: Transition to moonlight
    { hour: 21, sky: new THREE.Color('#0a0a20'), light: new THREE.Color('#b0c4de'), ambient: new THREE.Color('#505070'), intensity: 0.5, fog: 0.012 },
    // Wrap
    { hour: 24, sky: new THREE.Color('#050515'), light: new THREE.Color('#b0c4de'), ambient: new THREE.Color('#505070'), intensity: 0.5, fog: 0.015 },
];

const Weather: React.FC = () => {
    const { weather, setWeather, timeOfDay, setTimeOfDay, viewDistance } = useGameStore(useShallow(state => ({
        weather: state.weather,
        setWeather: state.setWeather,
        timeOfDay: state.timeOfDay,
        setTimeOfDay: state.setTimeOfDay,
        viewDistance: state.viewDistance
    })));
    const { scene, camera } = useThree();

    // Update camera Far clip plane when viewDistance changes
    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.far = viewDistance;
            camera.updateProjectionMatrix();
        }
    }, [camera, viewDistance]);

    const snowPoints = useRef<THREE.Points>(null);
    const rainLines = useRef<THREE.LineSegments>(null);
    const starPoints = useRef<THREE.Points>(null);
    const dirLight = useRef<THREE.DirectionalLight>(null);
    const ambLight = useRef<THREE.AmbientLight>(null);

    const timer = useRef(0);
    const timeRef = useRef(timeOfDay);

    // Smooth transition refs (0.0 to 1.0)
    const rainFactor = useRef(0);
    const snowFactor = useRef(0);

    // Sync ref with store updates only if significant change
    useEffect(() => {
        if (Math.abs(timeOfDay - timeRef.current) > 0.05) {
            timeRef.current = timeOfDay;
        }
    }, [timeOfDay]);

    // --- Star Geometry ---
    const starGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(2000 * 3);
        for (let i = 0; i < 2000; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 400;
            pos[i * 3 + 1] = Math.random() * 200 + 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geo;
    }, []);

    // --- Snow Geometry ---
    const snowGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        const vel = new Float32Array(PARTICLE_COUNT);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3] = (Math.random() - 0.5) * AREA_SIZE;
            pos[i * 3 + 1] = Math.random() * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
            vel[i] = 0.1 + Math.random() * 0.1;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.userData = { velocity: vel };
        return geo;
    }, []);

    // --- Rain Geometry ---
    const rainGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = [];
        const vel = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = (Math.random() - 0.5) * AREA_SIZE;
            const y = Math.random() * 20;
            const z = (Math.random() - 0.5) * AREA_SIZE;
            const speed = 0.5 + Math.random() * 0.3;
            pos.push(x, y, z);
            pos.push(x, y - 0.8, z);
            vel.push(speed);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.userData = { velocity: vel };
        return geo;
    }, []);

    const getEnvironmentState = (hour: number) => {
        let h = hour % 24;
        if (h < 0) h += 24;

        let nextIdx = DAY_CYCLE.findIndex(d => d.hour > h);
        if (nextIdx === -1) nextIdx = 0;
        const prevIdx = nextIdx === 0 ? DAY_CYCLE.length - 1 : nextIdx - 1;

        const prev = DAY_CYCLE[prevIdx];
        const next = DAY_CYCLE[nextIdx];

        let span = next.hour - prev.hour;
        let progress = h - prev.hour;
        if (span < 0) {
            span = 24 - prev.hour + next.hour;
            if (h < prev.hour) progress = (24 - prev.hour) + h;
        }

        const alpha = Math.max(0, Math.min(1, progress / span));

        const sky = prev.sky.clone().lerp(next.sky, alpha);
        const light = prev.light.clone().lerp(next.light, alpha);
        const ambient = prev.ambient.clone().lerp(next.ambient, alpha);
        const intensity = prev.intensity + (next.intensity - prev.intensity) * alpha;
        const fog = prev.fog + (next.fog - prev.fog) * alpha;

        return { sky, light, ambient, intensity, fog };
    };

    useFrame((state, delta) => {
        // --- Time Progression ---
        const prevTime = timeRef.current;
        timeRef.current += delta * GAME_CONFIG.TIME_SPEED_MULTIPLIER;
        if (timeRef.current >= 24) timeRef.current = 0;

        if (Math.floor(timeRef.current * 60) !== Math.floor(prevTime * 60)) {
            setTimeOfDay(timeRef.current);
        }

        // --- Weather Cycle ---
        timer.current += delta * 1000;
        if (timer.current > GAME_CONFIG.WEATHER_CYCLE_DURATION) {
            timer.current = 0;
            const types = ['Clear', 'Rain', 'Snow'] as const;
            const next = types[(types.indexOf(weather) + 1) % types.length];
            setWeather(next);
        }

        // --- Weather Transitions ---
        // Lerp factors towards 0 or 1 over ~5 seconds (delta/5)
        let targetR = weather === 'Rain' ? 1 : 0;
        let targetS = weather === 'Snow' ? 1 : 0;

        // Transition Speed
        const speed = delta / 5.0;

        const moveTowards = (current: number, target: number, step: number) => {
            if (current < target) return Math.min(target, current + step);
            if (current > target) return Math.max(target, current - step);
            return target;
        };
        rainFactor.current = moveTowards(rainFactor.current, targetR, delta * 0.2);
        snowFactor.current = moveTowards(snowFactor.current, targetS, delta * 0.2);

        // --- Environment Calculation ---
        const env = getEnvironmentState(timeRef.current);

        let targetSky = env.sky;
        let targetFog = env.fog;
        let targetLightInt = env.intensity;
        let targetAmb = env.ambient;

        const dayFactor = Math.max(0.3, Math.min(1, env.intensity));

        // Blend Rain Effects (Increase Fog significantly)
        if (rainFactor.current > 0) {
            const r = rainFactor.current;
            const rainFog = 0.019; // Reduced visibility (~150)
            const stormColor = new THREE.Color('#505060').multiplyScalar(dayFactor);
            const rainAmb = new THREE.Color('#303045');

            targetSky = targetSky.clone().lerp(stormColor, 0.8 * r);
            targetFog = THREE.MathUtils.lerp(targetFog, rainFog, r);
            targetLightInt = THREE.MathUtils.lerp(targetLightInt, targetLightInt * 0.6, r);
            targetAmb = targetAmb.clone().lerp(rainAmb, 0.5 * r);
        }

        // Blend Snow Effects (Increase Fog significantly)
        if (snowFactor.current > 0) {
            const s = snowFactor.current;
            const snowFog = 0.024; // Very reduced visibility (~125)
            const snowSkyColor = new THREE.Color('#dddddd').multiplyScalar(dayFactor);
            const snowAmb = new THREE.Color('#888899');

            targetSky = targetSky.clone().lerp(snowSkyColor, 0.9 * s);
            targetFog = THREE.MathUtils.lerp(targetFog, snowFog, s);
            targetLightInt = THREE.MathUtils.lerp(targetLightInt, targetLightInt * 0.5, s);
            targetAmb = targetAmb.clone().lerp(snowAmb, 0.5 * s);
        }



        // Apply View Distance Cap to Fog
        // If viewDistance is low, we need thicker fog to hide the clipping
        // Density approx 3.0 / Distance for 95% opacity, 4.0 / Dist for >98%
        const minFogForClipping = 3.5 / viewDistance;
        const finalFog = Math.max(targetFog, minFogForClipping);

        scene.fog = new THREE.FogExp2(targetSky, finalFog);
        scene.background = targetSky;

        if (ambLight.current) {
            ambLight.current.color.lerp(targetAmb, 0.1);
            ambLight.current.intensity = 1.0;
        }

        if (dirLight.current) {
            dirLight.current.color.lerp(env.light, 0.1);
            dirLight.current.intensity = targetLightInt;

            const sunAngle = ((timeRef.current - 6) / 24) * Math.PI * 2;
            const dist = 100;
            let y = Math.sin(sunAngle) * dist;
            let x = Math.cos(sunAngle) * dist;

            if (y < -1.0) {
                x = -x;
                y = -y;
            }
            y = Math.max(10, y);

            dirLight.current.position.set(x, y, 50);
            dirLight.current.target.position.set(0, 0, 0);
            dirLight.current.target.updateMatrixWorld();
        }

        // Stars Logic
        if (starPoints.current) {
            let starOpacity = 0;
            if (timeRef.current > 20 || timeRef.current < 5) starOpacity = 0.8;
            else if (timeRef.current > 19) starOpacity = (timeRef.current - 19) * 0.8;
            else if (timeRef.current < 6) starOpacity = (1 - (timeRef.current - 5)) * 0.8;

            // Hide stars if cloudy/snowy/rainy
            // Use the max of rain or snow factor to occlude stars
            const weatherOcclusion = Math.max(rainFactor.current, snowFactor.current);
            starOpacity *= (1 - weatherOcclusion);

            (starPoints.current.material as THREE.PointsMaterial).opacity = starOpacity;
            starPoints.current.rotation.y += delta * 0.01;
            starPoints.current.position.set(camera.position.x, 0, camera.position.z);
        }

        const updateParticles = (isRain: boolean, obj: THREE.Points | THREE.LineSegments, factor: number) => {
            if (!obj) return;
            const material = obj.material as THREE.LineBasicMaterial | THREE.PointsMaterial;

            if (factor <= 0.01) {
                obj.visible = false;
                return;
            }
            obj.visible = true;
            material.opacity = (isRain ? 0.6 : 0.8) * factor;

            const positions = obj.geometry.attributes.position.array as Float32Array;
            const velocities = obj.geometry.userData.velocity;

            obj.position.x = camera.position.x;
            obj.position.z = camera.position.z;

            const stride = isRain ? 6 : 3;
            const count = PARTICLE_COUNT;

            for (let i = 0; i < count; i++) {
                const idx = i * stride;
                const speed = velocities[i];
                let y = positions[idx + 1];
                y -= speed;
                if (y < 0) {
                    y = 20;
                    const newX = (Math.random() - 0.5) * AREA_SIZE;
                    const newZ = (Math.random() - 0.5) * AREA_SIZE;
                    positions[idx] = newX;
                    positions[idx + 2] = newZ;
                    if (isRain) {
                        positions[idx + 3] = newX;
                        positions[idx + 4] = y - 0.8;
                        positions[idx + 5] = newZ;
                    }
                }
                positions[idx + 1] = y;
                if (isRain) positions[idx + 4] = y - 0.8;
            }
            obj.geometry.attributes.position.needsUpdate = true;
        };

        updateParticles(false, snowPoints.current!, snowFactor.current);
        updateParticles(true, rainLines.current!, rainFactor.current);
    });

    return (
        <group>
            <ambientLight ref={ambLight} intensity={0.5} />
            <directionalLight
                ref={dirLight}
                position={[100, 100, 50]}
                intensity={1.0}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.001}
                shadow-camera-far={500}
                shadow-camera-left={-200}
                shadow-camera-right={200}
                shadow-camera-top={200}
                shadow-camera-bottom={-200}
            />

            <points ref={starPoints} geometry={starGeo} frustumCulled={false}>
                <pointsMaterial color="#ffffff" size={0.5} transparent opacity={0} sizeAttenuation={false} />
            </points>

            <points ref={snowPoints} geometry={snowGeo} frustumCulled={false}>
                <pointsMaterial color={0xffffff} size={0.3} transparent opacity={0.8} sizeAttenuation />
            </points>

            <lineSegments ref={rainLines} geometry={rainGeo} frustumCulled={false}>
                <lineBasicMaterial color={0xaaaaaa} transparent opacity={0.6} />
            </lineSegments>
        </group>
    );
};

export default Weather;
