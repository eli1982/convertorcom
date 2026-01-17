// Chunk - 16x256x16 section of the world
export class Chunk {
    static WIDTH = 16;
    static HEIGHT = 256;
    static DEPTH = 16;
    
    constructor(x, z, world) {
        this.x = x;
        this.z = z;
        this.world = world;
        
        // Block data storage
        this.blocks = new Uint8Array(Chunk.WIDTH * Chunk.HEIGHT * Chunk.DEPTH);
        
        // Lighting data
        this.skyLight = new Uint8Array(Chunk.WIDTH * Chunk.HEIGHT * Chunk.DEPTH);
        this.blockLight = new Uint8Array(Chunk.WIDTH * Chunk.HEIGHT * Chunk.DEPTH);
        
        // Mesh
        this.mesh = null;
        this.transparentMesh = null;
        this.isDirty = true;
        this.modified = false;
        
        // Heightmap for optimization
        this.heightmap = new Uint8Array(Chunk.WIDTH * Chunk.DEPTH);
    }
    
    // Get index in block array
    getIndex(x, y, z) {
        return y * Chunk.WIDTH * Chunk.DEPTH + z * Chunk.WIDTH + x;
    }
    
    // Get block at local coordinates
    getBlock(x, y, z) {
        if (x < 0 || x >= Chunk.WIDTH || y < 0 || y >= Chunk.HEIGHT || z < 0 || z >= Chunk.DEPTH) {
            return 0;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }
    
    // Set block at local coordinates
    setBlock(x, y, z, blockId) {
        if (x < 0 || x >= Chunk.WIDTH || y < 0 || y >= Chunk.HEIGHT || z < 0 || z >= Chunk.DEPTH) {
            return;
        }
        
        const index = this.getIndex(x, y, z);
        this.blocks[index] = blockId;
        this.isDirty = true;
        this.modified = true;
        
        // Update heightmap
        if (blockId !== 0 && y > this.heightmap[z * Chunk.WIDTH + x]) {
            this.heightmap[z * Chunk.WIDTH + x] = y;
        }
    }
    
    // Generate chunk terrain
    generate() {
        const worldX = this.x * Chunk.WIDTH;
        const worldZ = this.z * Chunk.DEPTH;
        
        for (let x = 0; x < Chunk.WIDTH; x++) {
            for (let z = 0; z < Chunk.DEPTH; z++) {
                const globalX = worldX + x;
                const globalZ = worldZ + z;
                
                // Get terrain height
                const height = this.world.getHeightAt(globalX, globalZ);
                const biome = this.world.getBiomeAt(globalX, globalZ);
                
                // Update heightmap
                this.heightmap[z * Chunk.WIDTH + x] = height;
                
                // Fill blocks
                for (let y = 0; y < Chunk.HEIGHT; y++) {
                    const block = this.getBlockForTerrain(y, height, biome, globalX, globalZ);
                    if (block !== 0) {
                        this.blocks[this.getIndex(x, y, z)] = block;
                    }
                }
                
                // Add features (trees, flowers, etc.)
                this.addFeatures(x, z, height, biome, globalX, globalZ);
            }
        }
        
        // Generate caves
        this.generateCaves(worldX, worldZ);
        
        // Generate ores
        this.generateOres(worldX, worldZ);
        
        this.isDirty = true;
    }
    
    // Determine block type based on position and biome
    getBlockForTerrain(y, height, biome, worldX, worldZ) {
        // Bedrock layer
        if (y === 0) return 7; // Bedrock
        if (y <= 4 && Math.random() < (5 - y) / 5) return 7;
        
        // Below sea level (63)
        if (y < 63 && y > height) {
            return 8; // Water
        }
        
        // Underground
        if (y < height - 4) {
            return 1; // Stone
        }
        
        // Near surface
        if (y < height) {
            if (biome === 'desert') return 12; // Sand
            if (biome === 'snowy_plains' || biome === 'snowy_taiga') return 3; // Dirt (will have snow on top)
            return 3; // Dirt
        }
        
        // Surface block
        if (y === height) {
            if (height < 63) return 12; // Sand underwater
            
            switch (biome) {
                case 'desert':
                    return 12; // Sand
                case 'snowy_plains':
                case 'snowy_taiga':
                    return 80; // Snow block (or grass with snow)
                case 'swamp':
                    return 2; // Grass
                default:
                    return 2; // Grass
            }
        }
        
        return 0; // Air
    }
    
    // Add features like trees and flowers
    addFeatures(localX, localZ, height, biome, worldX, worldZ) {
        if (height < 63) return; // Don't add features underwater
        
        // Use consistent random based on position
        const rand = this.seededRandom(worldX * 31 + worldZ * 17);
        
        // Trees
        if (rand < 0.02 && localX > 2 && localX < 13 && localZ > 2 && localZ < 13) {
            if (biome === 'forest' || biome === 'taiga' || biome === 'jungle') {
                this.generateTree(localX, height + 1, localZ, biome);
            } else if (biome === 'plains' || biome === 'savanna') {
                if (rand < 0.005) {
                    this.generateTree(localX, height + 1, localZ, biome);
                }
            }
        }
        
        // Flowers and grass
        if (rand > 0.9 && rand < 0.95) {
            if (biome !== 'desert' && biome !== 'snowy_plains') {
                const flowerType = rand > 0.92 ? 38 : 37; // Red or yellow flower
                this.setBlock(localX, height + 1, localZ, flowerType);
            }
        } else if (rand > 0.7 && rand < 0.9) {
            if (biome !== 'desert') {
                this.setBlock(localX, height + 1, localZ, 31); // Tall grass
            }
        }
        
        // Cacti in desert
        if (biome === 'desert' && rand < 0.01) {
            const cactusHeight = Math.floor(rand * 3) + 1;
            for (let y = 0; y < cactusHeight; y++) {
                this.setBlock(localX, height + 1 + y, localZ, 81);
            }
        }
    }
    
    // Generate a tree
    generateTree(x, y, z, biome) {
        const logBlock = biome === 'taiga' ? 21 : 17; // Spruce or oak log
        const leavesBlock = biome === 'taiga' ? 22 : 18; // Spruce or oak leaves
        
        // Tree height
        const height = 4 + Math.floor(Math.random() * 3);
        
        // Trunk
        for (let i = 0; i < height; i++) {
            this.setBlock(x, y + i, z, logBlock);
        }
        
        // Leaves
        const leafStart = y + height - 3;
        for (let dy = 0; dy < 4; dy++) {
            const radius = dy === 0 || dy === 3 ? 1 : 2;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (dx === 0 && dz === 0 && dy < 3) continue; // Don't overwrite trunk
                    if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() > 0.5) continue;
                    
                    const lx = x + dx;
                    const ly = leafStart + dy;
                    const lz = z + dz;
                    
                    if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
                        if (this.getBlock(lx, ly, lz) === 0) {
                            this.setBlock(lx, ly, lz, leavesBlock);
                        }
                    }
                }
            }
        }
    }
    
    // Generate caves
    generateCaves(worldX, worldZ) {
        // Simple cave generation using 3D noise
        for (let x = 0; x < Chunk.WIDTH; x++) {
            for (let z = 0; z < Chunk.DEPTH; z++) {
                for (let y = 5; y < 60; y++) {
                    const globalX = worldX + x;
                    const globalZ = worldZ + z;
                    
                    const caveNoise = this.cave3DNoise(globalX * 0.05, y * 0.05, globalZ * 0.05);
                    
                    if (caveNoise > 0.7) {
                        const currentBlock = this.getBlock(x, y, z);
                        if (currentBlock === 1 || currentBlock === 3) { // Stone or dirt
                            // Check if below water level
                            if (y < 63 && this.getBlock(x, y + 1, z) === 8) {
                                continue; // Don't create cave if water above
                            }
                            this.blocks[this.getIndex(x, y, z)] = 0; // Air
                        }
                    }
                }
            }
        }
    }
    
    // Generate ores
    generateOres(worldX, worldZ) {
        const ores = [
            { id: 16, minY: 0, maxY: 128, size: 17, count: 20 },  // Coal
            { id: 15, minY: 0, maxY: 64, size: 9, count: 20 },    // Iron
            { id: 14, minY: 0, maxY: 32, size: 9, count: 2 },     // Gold
            { id: 56, minY: 0, maxY: 16, size: 8, count: 1 },     // Diamond
            { id: 73, minY: 0, maxY: 16, size: 8, count: 8 },     // Redstone
            { id: 21, minY: 0, maxY: 32, size: 7, count: 2 }      // Lapis
        ];
        
        for (const ore of ores) {
            for (let i = 0; i < ore.count; i++) {
                const x = Math.floor(Math.random() * Chunk.WIDTH);
                const y = ore.minY + Math.floor(Math.random() * (ore.maxY - ore.minY));
                const z = Math.floor(Math.random() * Chunk.DEPTH);
                
                this.generateOreVein(x, y, z, ore.id, ore.size);
            }
        }
    }
    
    // Generate a single ore vein
    generateOreVein(x, y, z, oreId, maxSize) {
        const size = Math.floor(Math.random() * maxSize) + 1;
        
        for (let i = 0; i < size; i++) {
            const ox = x + Math.floor(Math.random() * 3) - 1;
            const oy = y + Math.floor(Math.random() * 3) - 1;
            const oz = z + Math.floor(Math.random() * 3) - 1;
            
            if (ox >= 0 && ox < 16 && oy >= 0 && oy < 256 && oz >= 0 && oz < 16) {
                if (this.getBlock(ox, oy, oz) === 1) { // Only replace stone
                    this.setBlock(ox, oy, oz, oreId);
                }
            }
        }
    }
    
    // Seeded random for consistent generation
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // 3D noise for caves
    cave3DNoise(x, y, z) {
        const n1 = Math.sin(x * 1.5 + y * 2.3 + z * 1.7 + this.world.noiseSeed) * 43758.5453;
        const n2 = Math.sin(x * 2.1 + y * 1.5 + z * 2.8 + this.world.noiseSeed * 2) * 43758.5453;
        return ((n1 - Math.floor(n1)) + (n2 - Math.floor(n2))) / 2;
    }
    
    // Mark chunk as needing mesh rebuild
    setDirty() {
        this.isDirty = true;
    }
    
    // Dispose of chunk resources
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        if (this.transparentMesh) {
            this.transparentMesh.geometry.dispose();
            this.transparentMesh.material.dispose();
            this.transparentMesh = null;
        }
    }
}
