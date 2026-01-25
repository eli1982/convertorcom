import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useTexture } from '@react-three/drei';
import { TRACKS, MAP_NODES } from '../../constants';
import { useGameStore } from '../../store/useGameStore';
import { TEXTURE_URLS } from '../../textures/generatedTextures';

const LIGHTS_PER_TRACK = 10;
const OFFSET_FROM_CENTER = 6.5;

// Recreate the StreetLight geometry by merging parts
const createPoleGeometry = () => {
    const parts: THREE.BufferGeometry[] = [];
    const mat = new THREE.Matrix4();

    // 1. Pole: Cylinder(0.15, 6, 0.15) at [0, 3, 0]
    const pole = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    pole.applyMatrix4(mat.makeTranslation(0, 3, 0));
    parts.push(pole);

    // 2. Base: Cylinder(0.3, 0.5, 0.3) at [0, 0.25, 0]
    const base = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    base.applyMatrix4(mat.makeTranslation(0, 0.25, 0));
    parts.push(base);

    // 3. Arm: Box(1.6, 0.15, 0.15) at [0.7, 5.8, 0]
    const arm = new THREE.BoxGeometry(1.6, 0.15, 0.15);
    arm.applyMatrix4(mat.makeTranslation(0.7, 5.8, 0));
    parts.push(arm);

    // 4. Fixture Top: Box(0.5, 0.1, 0.3) at [1.4, 5.85, 0]
    const fix = new THREE.BoxGeometry(0.5, 0.1, 0.3);
    fix.applyMatrix4(mat.makeTranslation(1.4, 5.85, 0));
    parts.push(fix);

    return mergeBufferGeometries(parts);
};

const poleGeometry = createPoleGeometry();
// 5. Bulb: Box(0.4, 0.05, 0.25) at [1.4, 5.75, 0] - Separate for emission control
const bulbGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.25);
bulbGeometry.translate(1.4, 5.75, 0);

// 6. Beam: Cone-like Cylinder
const beamGeometry = new THREE.CylinderGeometry(0.15, 3.5, 6, 32, 1, true);
beamGeometry.translate(0, 3, 0); // Center it properly (height 6, so 3 is mid) -> Wait, original was pos=[1.4, 2.6, 0]
// Original Beam args: [0.15, 3.5, 6...] -> RadiusTop 0.15, RadiusBottom 3.5, Height 6.
// Position [1.4, 2.6, 0].
const beamGeoConfigured = new THREE.CylinderGeometry(0.15, 3.5, 6, 32, 1, true);
beamGeoConfigured.translate(1.4, 2.6, 0);

// 7. Spot: Plane on ground
const spotGeometry = new THREE.PlaneGeometry(10, 10);
spotGeometry.rotateX(-Math.PI / 2);
spotGeometry.translate(1.4, 0.1, 0);


const StreetLightsInstanced: React.FC = () => {
    const spotTexture = useTexture(TEXTURE_URLS.spot);

    // Refs for InstancedMeshes
    const poleMesh = useRef<THREE.InstancedMesh>(null);
    const bulbMesh = useRef<THREE.InstancedMesh>(null);
    const beamMesh = useRef<THREE.InstancedMesh>(null);
    const spotMesh = useRef<THREE.InstancedMesh>(null);

    // Refs for Materials (to animate globally)
    const bulbMat = useRef<THREE.MeshBasicMaterial>(null);
    const beamMat = useRef<THREE.MeshBasicMaterial>(null);
    const spotMat = useRef<THREE.MeshBasicMaterial>(null);

    const currentIntensity = useRef(0);

    // 1. Generate Instances Data
    const instances = useMemo(() => {
        const data: { pos: THREE.Vector3, rot: number }[] = [];

        TRACKS.forEach((track) => {
            const startNode = MAP_NODES[track.from];
            const endNode = MAP_NODES[track.to];
            const dx = endNode.x - startNode.x;
            const dz = endNode.z - startNode.z;
            const dist = Math.hypot(dx, dz);
            const dirX = dx / dist;
            const dirZ = dz / dist;
            const perpX = -dirZ;
            const perpZ = dirX;

            [-1, 1].forEach((side) => {
                for (let i = 0; i < LIGHTS_PER_TRACK; i++) {
                    const t = (i + 0.5) / LIGHTS_PER_TRACK;
                    const posX = startNode.x + dx * t;
                    const posZ = startNode.z + dz * t;

                    const finalX = posX + perpX * OFFSET_FROM_CENTER * side;
                    const finalZ = posZ + perpZ * OFFSET_FROM_CENTER * side;

                    const rot = Math.atan2(-perpZ * side, -perpX * side); // Face inward

                    data.push({
                        pos: new THREE.Vector3(finalX, 0, finalZ),
                        rot: -rot
                    });
                }
            });
        });
        return data;
    }, []);

    // 2. Setup Matrices
    useEffect(() => {
        const dummy = new THREE.Object3D();
        instances.forEach((inst, i) => {
            dummy.position.copy(inst.pos);
            dummy.rotation.set(0, inst.rot, 0);
            dummy.updateMatrix();

            poleMesh.current?.setMatrixAt(i, dummy.matrix);
            bulbMesh.current?.setMatrixAt(i, dummy.matrix);
            beamMesh.current?.setMatrixAt(i, dummy.matrix);
            spotMesh.current?.setMatrixAt(i, dummy.matrix);
        });

        // Update all
        if (poleMesh.current) poleMesh.current.instanceMatrix.needsUpdate = true;
        if (bulbMesh.current) bulbMesh.current.instanceMatrix.needsUpdate = true;
        if (beamMesh.current) beamMesh.current.instanceMatrix.needsUpdate = true;
        if (spotMesh.current) spotMesh.current.instanceMatrix.needsUpdate = true;
    }, [instances]);

    // 3. Animation Loop
    useFrame((state, delta) => {
        // Logic from StreetLightsSystem
        const s = useGameStore.getState();
        const isNight = s.timeOfDay >= 19.0 || s.timeOfDay <= 6.0;
        const isDarkStorm = s.weather !== 'Clear' && (s.timeOfDay > 16 || s.timeOfDay < 8);
        const targetIntensity = (isNight || isDarkStorm) ? 1.0 : 0.0;

        // Lerp
        currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, targetIntensity, delta * 2.0);
        const i = currentIntensity.current;

        // Optimization: Hide light meshes if off
        const visible = i > 0.01;
        if (beamMesh.current) beamMesh.current.visible = visible;
        if (spotMesh.current) spotMesh.current.visible = visible;
        // Bulb is always part of structure, but we can dim it

        // Animate Materials
        if (bulbMat.current) {
            bulbMat.current.color.lerpColors(new THREE.Color(0x333333), new THREE.Color(0xffaa55), i);
        }
        if (beamMat.current) {
            beamMat.current.opacity = 0.05 * i;
        }
        if (spotMat.current) {
            spotMat.current.opacity = 0.6 * i;
        }
    });

    const count = instances.length;

    return (
        <group>
            {/* Poles Structure */}
            <instancedMesh ref={poleMesh} args={[poleGeometry, undefined, count]} castShadow receiveShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </instancedMesh>

            {/* Bulbs (Emissive) */}
            <instancedMesh ref={bulbMesh} args={[bulbGeometry, undefined, count]}>
                <meshBasicMaterial ref={bulbMat} color="#333" toneMapped={false} />
            </instancedMesh>

            {/* Light Beams (Transparent) */}
            <instancedMesh ref={beamMesh} args={[beamGeoConfigured, undefined, count]}>
                <meshBasicMaterial
                    ref={beamMat}
                    color="#ffaa55"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </instancedMesh>

            {/* Ground Spots (Transparent) */}
            <instancedMesh ref={spotMesh} args={[spotGeometry, undefined, count]}>
                <meshBasicMaterial
                    ref={spotMat}
                    map={spotTexture}
                    color="#ffaa55"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </instancedMesh>
        </group>
    );
};

export default StreetLightsInstanced;
