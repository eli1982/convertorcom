import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { TRACKS, MAP_NODES } from '../../constants';

const CatenaryOptimized: React.FC = () => {

    // Generate Single Merged Mesh for all static wires and poles
    const geometry = useMemo(() => {
        const parts: THREE.BufferGeometry[] = [];
        const mat = new THREE.Matrix4();

        // 1. Wires
        TRACKS.forEach(track => {
            const s = MAP_NODES[track.from];
            const e = MAP_NODES[track.to];
            const len = Math.hypot(e.x - s.x, e.z - s.z);
            const angle = Math.atan2(e.z - s.z, e.x - s.x);
            const midX = (s.x + e.x) / 2;
            const midZ = (s.z + e.z) / 2;

            // Wire Box
            const wire = new THREE.BoxGeometry(len, 0.06, 0.06);

            // Transform
            mat.makeRotationY(-angle);
            mat.setPosition(midX, 6.0, midZ);
            wire.applyMatrix4(mat);

            parts.push(wire);
        });

        // 2. Poles
        MAP_NODES.forEach((node, i) => {
            const pos = new THREE.Vector3(node.x + 10, 3.5, node.z + 10);
            const nodePos = new THREE.Vector3(node.x, 6.0, node.z);

            // Pole Cylinder
            const pole = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
            mat.makeTranslation(pos.x, pos.y, pos.z);
            pole.applyMatrix4(mat);
            parts.push(pole);

            // Arm
            const len = new THREE.Vector3(pos.x, 6.0, pos.z).distanceTo(nodePos);
            const mid = new THREE.Vector3(pos.x, 6.0, pos.z).lerp(nodePos, 0.5);
            const angle = Math.atan2(nodePos.z - pos.z, nodePos.x - pos.x);

            const arm = new THREE.BoxGeometry(len, 0.15, 0.15);
            mat.makeRotationY(-angle);
            mat.setPosition(mid.x, mid.y, mid.z);
            arm.applyMatrix4(mat);
            parts.push(arm);
        });

        if (parts.length > 0) {
            return mergeBufferGeometries(parts);
        }
        return new THREE.BoxGeometry(0, 0, 0);
    }, []);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
    );
};

export default CatenaryOptimized;
