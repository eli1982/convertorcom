import * as THREE from 'three';


function createPanda() {
    const group = new THREE.Group();
    const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xF6F6F6, roughness: 0.6 });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const charcoalMaterial = new THREE.MeshStandardMaterial({ color: 0x1E1E1E, roughness: 0.5 });

    const addBlock = (width, height, depth, material, position, bevelRadius = 0.02, bevelSegments = 4) => {
        let geometry;
        if (bevelRadius > 0) {
            // Create a shape for the cross-section
            const shape = new THREE.Shape();
            const halfWidth = width / 2;
            const halfHeight = height / 2;
            
            // Draw rectangle with rounded corners
            shape.moveTo(-halfWidth + bevelRadius, -halfHeight);
            shape.lineTo(halfWidth - bevelRadius, -halfHeight);
            shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + bevelRadius);
            shape.lineTo(halfWidth, halfHeight - bevelRadius);
            shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - bevelRadius, halfHeight);
            shape.lineTo(-halfWidth + bevelRadius, halfHeight);
            shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - bevelRadius);
            shape.lineTo(-halfWidth, -halfHeight + bevelRadius);
            shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + bevelRadius, -halfHeight);
            
            const extrudeSettings = {
                depth: depth,
                bevelEnabled: true,
                bevelThickness: bevelRadius,
                bevelSize: bevelRadius,
                bevelSegments: bevelSegments
            };
            
            geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Center the geometry
            geometry.translate(0, 0, -depth / 2);
        } else {
            geometry = new THREE.BoxGeometry(width, height, depth);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        group.add(mesh);
        return mesh;
    };    


    addBlock(0.33, 0.40, 0.27, whiteMaterial, new THREE.Vector3(0.27, 0.58, -0.37));
    addBlock(0.29, 0.45, 0.36, whiteMaterial, new THREE.Vector3(-0.25, 0.62, -0.31));
    addBlock(0.33, 0.40, 0.27, whiteMaterial, new THREE.Vector3(-0.27, 0.58, -0.37));
    addBlock(0.29, 0.45, 0.36, whiteMaterial, new THREE.Vector3(0.25, 0.62, -0.31));
    addBlock(0.84, 0.59, 0.21, blackMaterial, new THREE.Vector3(0.00, 0.66, 0.50));
    addBlock(0.84, 0.69, 0.28, blackMaterial, new THREE.Vector3(0.00, 0.57, 0.50));
    addBlock(0.15, 0.15, 0.15, blackMaterial, new THREE.Vector3(0.00, 0.87, -0.49));
    addBlock(0.60, 0.40, 0.10, whiteMaterial, new THREE.Vector3(0.00, 0.68, 0.85));
    addBlock(0.45, 0.41, 0.09, whiteMaterial, new THREE.Vector3(0.00, 0.67, 0.76));
    addBlock(0.56, 0.56, 0.05, whiteMaterial, new THREE.Vector3(0.00, 0.62, 0.70));
    addBlock(0.66, 0.66, 0.05, whiteMaterial, new THREE.Vector3(0.00, 0.62, 0.66));
    addBlock(0.35, 0.23, 0.08, whiteMaterial, new THREE.Vector3(0.00, 0.69, 0.95));
    addBlock(0.18, 0.08, 0.16, blackMaterial, new THREE.Vector3(0.00, 0.69, 1.05));
    addBlock(0.25, 0.14, 0.20, whiteMaterial, new THREE.Vector3(0.00, 0.69, 1.02));
    addBlock(0.08, 0.08, 0.06, charcoalMaterial, new THREE.Vector3(-0.18, 0.66, 0.86));
    addBlock(0.08, 0.08, 0.06, charcoalMaterial, new THREE.Vector3(0.18, 0.66, 0.86));
    addBlock(0.14, 0.10, 0.07, blackMaterial, new THREE.Vector3(-0.22, 0.91, 0.84));
    addBlock(0.14, 0.10, 0.07, blackMaterial, new THREE.Vector3(0.22, 0.91, 0.84));
    addBlock(0.22, 0.38, 0.24, blackMaterial, new THREE.Vector3(-0.28, 0.19, 0.50));
    addBlock(0.22, 0.38, 0.24, blackMaterial, new THREE.Vector3(0.28, 0.19, 0.50));
    addBlock(0.35, 0.37, 0.27, blackMaterial, new THREE.Vector3(-0.27, 0.20, -0.37));
    addBlock(0.35, 0.37, 0.27, blackMaterial, new THREE.Vector3(0.27, 0.20, -0.37));
    addBlock(0.70, 0.58, 0.82, whiteMaterial, new THREE.Vector3(0.00, 0.68, -0.05));

    group.castShadow = true;
    return group;
}


export { createPanda };