// Chunk Manager - handles chunk loading, unloading, and mesh generation
import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';
import { Settings } from '../engine/Settings.js';

export class ChunkManager {
    constructor(world, renderer, textureManager) {
        this.world = world;
        this.renderer = renderer;
        this.textureManager = textureManager;
        this.loadedChunks = new Map();
        this.meshQueue = [];
        this.maxMeshesPerFrame = 4;
        
        // Progressive loading state
        this.loadQueue = [];
        this.isGenerating = false;
        this.chunksPerFrame = 2; // How many chunks to generate per frame
        this.currentRadius = 0;
        this.targetRadius = 8;
        this.centerX = 0;
        this.centerZ = 0;
        
        // Create shared materials
        this.createMaterials();
    }
    
    createMaterials() {
        // Create material with texture atlas
        const atlasTexture = this.textureManager.getAtlasTexture();
        
        this.solidMaterial = new THREE.MeshLambertMaterial({
            map: atlasTexture,
            vertexColors: true
        });
        
        this.transparentMaterial = new THREE.MeshLambertMaterial({
            map: atlasTexture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });
    }
    
    // Start progressive generation - returns immediately, chunks load over time
    async generateInitialChunks(centerX, centerZ, radius) {
        this.centerX = centerX;
        this.centerZ = centerZ;
        this.targetRadius = radius;
        this.currentRadius = 0;
        
        // 1. Generate ALL chunk data first (prevents freezes during gameplay)
        // This might take a moment on the loading screen, but ensures smooth gameplay later
        const chunksToGenerate = [];
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                chunksToGenerate.push(this.loadChunk(centerX + x, centerZ + z));
            }
        }
        await Promise.all(chunksToGenerate);
        
        // 2. Build center chunk mesh immediately so player has ground
        const centerChunk = this.loadedChunks.get(`${centerX},${centerZ}`);
        if (centerChunk) {
            this.buildChunkMesh(centerChunk);
        }
        
        // 3. Queue the rest for progressive MESH building (visual animation)
        this.queueFloodFillChunks(centerX, centerZ, radius);
        this.isGenerating = true;
    }
    
    // Queue chunks in flood-fill order (closest first)
    queueFloodFillChunks(centerX, centerZ, radius) {
        this.loadQueue = [];
        
        // Generate rings from center outward
        for (let r = 1; r <= radius; r++) {
            const ring = this.getChunksAtRadius(centerX, centerZ, r);
            // Shuffle within each ring for more natural look
            this.shuffleArray(ring);
            this.loadQueue.push(...ring);
        }
    }
    
    // Get all chunks at a specific radius (ring)
    getChunksAtRadius(centerX, centerZ, radius) {
        const chunks = [];
        
        // Top and bottom edges
        for (let x = -radius; x <= radius; x++) {
            chunks.push({ x: centerX + x, z: centerZ - radius });
            if (radius > 0) {
                chunks.push({ x: centerX + x, z: centerZ + radius });
            }
        }
        
        // Left and right edges (excluding corners already added)
        for (let z = -radius + 1; z < radius; z++) {
            chunks.push({ x: centerX - radius, z: centerZ + z });
            chunks.push({ x: centerX + radius, z: centerZ + z });
        }
        
        return chunks;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    async loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        
        if (this.loadedChunks.has(key)) {
            return this.loadedChunks.get(key);
        }
        
        // Create new chunk
        const chunk = new Chunk(chunkX, chunkZ, this.world);
        
        // Generate terrain
        chunk.generate();
        
        // Add to loaded chunks
        this.loadedChunks.set(key, chunk);
        this.world.addChunk(chunk);
        
        return chunk;
    }
    
    // Get loading progress (0-100)
    getLoadingProgress() {
        if (!this.isGenerating) return 100;
        const totalChunks = (this.targetRadius * 2 + 1) ** 2;
        const loaded = this.loadedChunks.size;
        return Math.floor((loaded / totalChunks) * 100);
    }
    
    // Check if still generating initial world
    isWorldGenerating() {
        return this.isGenerating;
    }
    
    unloadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.loadedChunks.get(key);
        
        if (chunk) {
            // Remove mesh from scene
            if (chunk.mesh) {
                this.renderer.removeFromScene(chunk.mesh);
            }
            if (chunk.transparentMesh) {
                this.renderer.removeFromScene(chunk.transparentMesh);
            }
            
            // Dispose resources
            chunk.dispose();
            
            // Remove from map
            this.loadedChunks.delete(key);
        }
    }
    
    update(playerPosition) {
        const playerChunkX = Math.floor(playerPosition.x / 16);
        const playerChunkZ = Math.floor(playerPosition.z / 16);
        const renderDistance = Settings.get('render_distance') || 8;
        
        // Process progressive MESH building queue (flood-fill from spawn)
        // This is purely visual now, as data is already generated
        if (this.isGenerating && this.loadQueue.length > 0) {
            // Use a time budget to prevent frame drops
            const startTime = performance.now();
            const timeBudget = 8; // ms
            
            while (this.loadQueue.length > 0 && performance.now() - startTime < timeBudget) {
                const { x, z } = this.loadQueue.shift();
                const key = `${x},${z}`;
                
                // Chunk data should already be loaded from generateInitialChunks
                const chunk = this.loadedChunks.get(key);
                
                if (chunk && !chunk.mesh) {
                    this.buildChunkMesh(chunk);
                } else if (!chunk) {
                    // Fallback if chunk wasn't pre-generated for some reason
                    this.loadChunk(x, z).then(c => this.buildChunkMesh(c));
                }
            }
            
            if (this.loadQueue.length === 0) {
                this.isGenerating = false;
                console.log('World generation complete!');
            }
        }
        
        // Load new chunks as player moves (beyond initial generation)
        if (!this.isGenerating) {
            for (let x = -renderDistance; x <= renderDistance; x++) {
                for (let z = -renderDistance; z <= renderDistance; z++) {
                    const chunkX = playerChunkX + x;
                    const chunkZ = playerChunkZ + z;
                    const key = `${chunkX},${chunkZ}`;
                    
                    if (!this.loadedChunks.has(key)) {
                        this.loadChunk(chunkX, chunkZ).then(chunk => {
                            this.buildChunkMesh(chunk);
                        });
                    }
                }
            }
        }
        
        // Unload far chunks
        for (const [key, chunk] of this.loadedChunks) {
            const dx = chunk.x - playerChunkX;
            const dz = chunk.z - playerChunkZ;
            
            if (Math.abs(dx) > renderDistance + 2 || Math.abs(dz) > renderDistance + 2) {
                this.unloadChunk(chunk.x, chunk.z);
            }
        }
        
        // Process dirty chunks (block updates)
        let processed = 0;
        for (const [key, chunk] of this.loadedChunks) {
            if (chunk.isDirty && processed < this.maxMeshesPerFrame) {
                this.buildChunkMesh(chunk);
                processed++;
            }
        }
    }
    
    buildChunkMesh(chunk) {
        // Remove old meshes
        if (chunk.mesh) {
            this.renderer.removeFromScene(chunk.mesh);
            chunk.mesh.geometry.dispose();
        }
        if (chunk.transparentMesh) {
            this.renderer.removeFromScene(chunk.transparentMesh);
            chunk.transparentMesh.geometry.dispose();
        }
        
        // Build new mesh
        const { solidGeometry, transparentGeometry } = this.generateChunkGeometry(chunk);
        
        if (solidGeometry.positions.length > 0) {
            const geometry = this.createBufferGeometry(solidGeometry);
            chunk.mesh = new THREE.Mesh(geometry, this.solidMaterial);
            chunk.mesh.position.set(chunk.x * 16, 0, chunk.z * 16);
            chunk.mesh.castShadow = true;
            chunk.mesh.receiveShadow = true;
            this.renderer.addToScene(chunk.mesh);
        }
        
        if (transparentGeometry.positions.length > 0) {
            const geometry = this.createBufferGeometry(transparentGeometry);
            chunk.transparentMesh = new THREE.Mesh(geometry, this.transparentMaterial);
            chunk.transparentMesh.position.set(chunk.x * 16, 0, chunk.z * 16);
            this.renderer.addToScene(chunk.transparentMesh);
        }
        
        chunk.isDirty = false;
    }
    
    generateChunkGeometry(chunk) {
        const solidGeometry = {
            positions: [],
            normals: [],
            uvs: [],
            colors: [],
            indices: []
        };
        
        const transparentGeometry = {
            positions: [],
            normals: [],
            uvs: [],
            colors: [],
            indices: []
        };
        
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 256; y++) {
                for (let z = 0; z < 16; z++) {
                    const blockId = chunk.getBlock(x, y, z);
                    
                    if (blockId === 0) continue;
                    
                    const blockData = BlockRegistry.getBlock(blockId);
                    if (!blockData) continue;
                    
                    const geometry = blockData.transparent ? transparentGeometry : solidGeometry;
                    
                    // Check each face
                    this.addBlockFaces(chunk, x, y, z, blockId, blockData, geometry);
                }
            }
        }
        
        return { solidGeometry, transparentGeometry };
    }
    
    addBlockFaces(chunk, x, y, z, blockId, blockData, geometry) {
        const faces = [
            { dir: [0, 1, 0], name: 'top', vertices: [[0,1,0], [1,1,0], [1,1,1], [0,1,1]] },
            { dir: [0, -1, 0], name: 'bottom', vertices: [[0,0,1], [1,0,1], [1,0,0], [0,0,0]] },
            { dir: [1, 0, 0], name: 'east', vertices: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]] },
            { dir: [-1, 0, 0], name: 'west', vertices: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]] },
            { dir: [0, 0, 1], name: 'south', vertices: [[0,0,1], [0,1,1], [1,1,1], [1,0,1]] },
            { dir: [0, 0, -1], name: 'north', vertices: [[1,0,0], [1,1,0], [0,1,0], [0,0,0]] }
        ];
        
        for (const face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            
            let neighborBlock;
            
            // Check if neighbor is in this chunk or adjacent
            if (nx >= 0 && nx < 16 && ny >= 0 && ny < 256 && nz >= 0 && nz < 16) {
                neighborBlock = chunk.getBlock(nx, ny, nz);
            } else {
                // Get from world (adjacent chunk)
                const worldX = chunk.x * 16 + nx;
                const worldZ = chunk.z * 16 + nz;
                neighborBlock = this.world.getBlock(worldX, ny, worldZ);
            }
            
            // Skip if neighbor is solid (and not transparent)
            const neighborData = BlockRegistry.getBlock(neighborBlock);
            if (neighborBlock !== 0 && neighborData && !neighborData.transparent) {
                continue;
            }
            
            // Don't render internal faces of same transparent block
            if (blockData.transparent && neighborBlock === blockId) {
                continue;
            }
            
            // Add face
            this.addFace(geometry, x, y, z, face, blockData, face.name);
        }
    }
    
    addFace(geometry, x, y, z, face, blockData, faceName) {
        const baseIndex = geometry.positions.length / 3;
        
        // Get texture for this face
        const textureName = this.getTextureForFace(blockData, faceName);
        const uvCoords = this.textureManager.getUVs(textureName);
        
        if (!uvCoords) {
            console.warn(`Missing texture: ${textureName}`);
            return;
        }
        
        // Add vertices
        for (const vertex of face.vertices) {
            geometry.positions.push(x + vertex[0], y + vertex[1], z + vertex[2]);
            geometry.normals.push(face.dir[0], face.dir[1], face.dir[2]);
            
            // Calculate lighting (simple ambient occlusion)
            const ao = 1.0; // Simplified - would calculate based on neighbors
            geometry.colors.push(ao, ao, ao);
        }
        
        // Add UVs
        const uvs = [
            [uvCoords.u, uvCoords.v + uvCoords.vSize],
            [uvCoords.u + uvCoords.uSize, uvCoords.v + uvCoords.vSize],
            [uvCoords.u + uvCoords.uSize, uvCoords.v],
            [uvCoords.u, uvCoords.v]
        ];
        
        for (const uv of uvs) {
            geometry.uvs.push(uv[0], uv[1]);
        }
        
        // Add indices (two triangles)
        geometry.indices.push(
            baseIndex, baseIndex + 1, baseIndex + 2,
            baseIndex, baseIndex + 2, baseIndex + 3
        );
    }
    
    getTextureForFace(blockData, faceName) {
        if (blockData.textures) {
            if (typeof blockData.textures === 'string') {
                return blockData.textures;
            }
            
            // Multi-texture block
            if (blockData.textures[faceName]) {
                return blockData.textures[faceName];
            }
            if (faceName === 'top' && blockData.textures.top) {
                return blockData.textures.top;
            }
            if (faceName === 'bottom' && blockData.textures.bottom) {
                return blockData.textures.bottom;
            }
            if (blockData.textures.side) {
                return blockData.textures.side;
            }
            if (blockData.textures.all) {
                return blockData.textures.all;
            }
        }
        
        return 'stone'; // Fallback
    }
    
    createBufferGeometry(data) {
        const geometry = new THREE.BufferGeometry();
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
        geometry.setIndex(data.indices);
        
        geometry.computeBoundingSphere();
        
        return geometry;
    }
    
    getChunkAt(worldX, worldZ) {
        const chunkX = Math.floor(worldX / 16);
        const chunkZ = Math.floor(worldZ / 16);
        return this.loadedChunks.get(`${chunkX},${chunkZ}`);
    }
    
    updateAdjacentChunks(position) {
        const chunkX = Math.floor(position.x / 16);
        const chunkZ = Math.floor(position.z / 16);
        const localX = ((position.x % 16) + 16) % 16;
        const localZ = ((position.z % 16) + 16) % 16;
        
        // Check if on chunk boundary
        if (localX === 0) {
            const adj = this.loadedChunks.get(`${chunkX - 1},${chunkZ}`);
            if (adj) adj.setDirty();
        }
        if (localX === 15) {
            const adj = this.loadedChunks.get(`${chunkX + 1},${chunkZ}`);
            if (adj) adj.setDirty();
        }
        if (localZ === 0) {
            const adj = this.loadedChunks.get(`${chunkX},${chunkZ - 1}`);
            if (adj) adj.setDirty();
        }
        if (localZ === 15) {
            const adj = this.loadedChunks.get(`${chunkX},${chunkZ + 1}`);
            if (adj) adj.setDirty();
        }
    }
}
