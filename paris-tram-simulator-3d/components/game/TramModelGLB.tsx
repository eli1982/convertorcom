import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface TramModelGLBProps {
    lightsOn?: boolean;
    // We can add other props here later for animations when we figure them out
    children?: React.ReactNode;
}

const TramModelGLB = React.forwardRef<THREE.Group, TramModelGLBProps>(({ lightsOn, children }, ref) => {
    const { scene } = useGLTF('/tram_paris.glb');
    const internalRef = useRef<THREE.Group>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    // Clone the scene
    const clonedScene = React.useMemo(() => scene.clone(), [scene]);

    // Optimize materials and automatic scale/center
    React.useLayoutEffect(() => {
        if (!clonedScene) return;

        // Reset transform
        clonedScene.position.set(0, 0, 0);
        clonedScene.rotation.set(0, 0, 0);
        clonedScene.scale.set(1, 1, 1);
        clonedScene.updateMatrixWorld(true);

        // 1. Compute Initial Bounds to detect orientation
        const box = new THREE.Box3();
        const invMat = clonedScene.matrixWorld.clone().invert();

        clonedScene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                if (mesh.geometry) {
                    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
                    const meshBox = mesh.geometry.boundingBox!.clone();
                    meshBox.applyMatrix4(mesh.matrixWorld);
                    meshBox.applyMatrix4(invMat);
                    box.union(meshBox);
                }
            }
        });

        const size = new THREE.Vector3();
        box.getSize(size);

        // 2. Determine Axis and Rotate to align with X (Procedural Tram Axis)
        // Check if Z is dominant (Standard GLTF vehicle)
        let isZLong = size.z > size.x;

        // If Model 0,0,0 is Front, we need to know direction.
        // Assuming standard +Z or -Z. 
        // We want Front to point to +X.
        // Let's assume +Z is Front for now (rotate +90 deg -> +X).
        // If backward, user can report, or we add toggle.

        if (isZLong) {
            clonedScene.rotation.y = Math.PI / 2; // Rotate 90 deg around Y
        } else {
            // Already X aligned?
            clonedScene.rotation.y = 0;
        }

        clonedScene.updateMatrixWorld(true); // Update with new rotation

        // 3. Re-Compute Bounds after Rotation for correct centering/scaling
        // Actually, AABB dimensions just swap if 90 deg.
        // But center changes.
        // Let's re-traverse to be safe and accurate with the new rotation applied.

        const finalBox = new THREE.Box3();
        const finalInvMat = clonedScene.matrixWorld.clone().invert(); // Inverse of rotated local matrix? 
        // No, we want AABB in the parent space (Group Local Space) to center it in Group.
        // We modified clonedScene transforms.
        // We want to transform mesh bounds by (Mesh->Scene * Scene->Group) = (Mesh->Group).
        // Since clonedScene IS the child of Group, Mesh->Group is Mesh->Scene * SceneTransform.
        // matrixWorld contains parent transforms too? No, clonedScene is mounted in primitive.
        // But calculating relative bounds manually is safer.

        // Simplified: The previous box center/size can be rotated.
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Rotate the center and size
        if (isZLong) {
            // Rotated +90 around Y. (x,y,z) -> (z, y, -x)?
            // Vector3.applyAxisAngle.
            center.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            // Size swaps X/Z
            const temp = size.x;
            size.x = size.z;
            size.z = temp;
        }

        // 2b. Check Facing Direction (Align Body to -X)
        if (center.x > 0) {
            clonedScene.rotation.y += Math.PI;
            clonedScene.updateMatrixWorld(true);
        }

        // 4. Scale
        const TARGET_LENGTH = 52; // Requested 3x larger than 18.5
        const scaleFactor = TARGET_LENGTH / size.x; // We aligned length to X
        clonedScene.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 5. Position (Align Front to Tram Front)
        // User requested alignment with procedural tram front.
        // Procedural tram front (headlights) is at x ~= 7.7.
        // We place Model Origin (Front) at +7.7.
        // Even if model is 52m long, it will extend backwards from the front.

        clonedScene.position.x = 7.7;
        clonedScene.position.y = -box.min.y * scaleFactor;
        clonedScene.position.z = 0;

        console.log(`Tram GLB Aligned & Scaled. Size: ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}. Scale: ${scaleFactor.toFixed(4)}`);

    }, [clonedScene]);

    return (
        <group ref={internalRef}>
            {/* The model is now centered and scaled. 
                We might need to rotate it if it's sideways.
                Assuming standard Z-forward vehicle. 
            */}
            <primitive object={clonedScene} />

            {/* Add Headlights logic here if we can map them to the model later, 
                for now we just render the model 
            */}
            {children}
        </group>
    );
});

export default TramModelGLB;

useGLTF.preload('/tram_paris.glb');
