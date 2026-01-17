// Physics Engine
export class Physics {
    constructor() {
        this.gravity = -28; // blocks per second squared
        this.terminalVelocity = -78; // max falling speed
        this.jumpVelocity = 9; // initial jump velocity
        this.swimSpeed = 2;
        this.waterDrag = 0.8;
    }
    
    // Axis-aligned bounding box collision detection
    checkAABBCollision(box1, box2) {
        return (
            box1.min.x < box2.max.x &&
            box1.max.x > box2.min.x &&
            box1.min.y < box2.max.y &&
            box1.max.y > box2.min.y &&
            box1.min.z < box2.max.z &&
            box1.max.z > box2.min.z
        );
    }
    
    // Get player bounding box
    getPlayerBoundingBox(position, width, height) {
        const halfWidth = width / 2;
        return {
            min: {
                x: position.x - halfWidth,
                y: position.y,
                z: position.z - halfWidth
            },
            max: {
                x: position.x + halfWidth,
                y: position.y + height,
                z: position.z + halfWidth
            }
        };
    }
    
    // Get block bounding box
    getBlockBoundingBox(x, y, z) {
        return {
            min: { x, y, z },
            max: { x: x + 1, y: y + 1, z: z + 1 }
        };
    }
    
    // Check collision with world blocks
    checkWorldCollision(position, velocity, width, height, world, dt = 1/60) {
        const result = {
            position: { ...position },
            velocity: { ...velocity },
            onGround: false,
            inWater: false,
            hitWall: false
        };
        
        // Check for water
        const blockAtFeet = world.getBlock(
            Math.floor(position.x),
            Math.floor(position.y),
            Math.floor(position.z)
        );
        const blockAtHead = world.getBlock(
            Math.floor(position.x),
            Math.floor(position.y + height),
            Math.floor(position.z)
        );
        
        // Block ID 8 and 9 are water
        if (blockAtFeet === 8 || blockAtFeet === 9 || blockAtHead === 8 || blockAtHead === 9) {
            result.inWater = true;
        }
        
        // Apply movement and check collisions on each axis separately
        // Process X and Z first, then Y (so ground check uses final horizontal position)
        
        // X-axis movement
        result.position.x += velocity.x * dt;
        if (this.checkBlockCollisions(result.position, width, height, world)) {
            result.position.x = position.x;
            result.velocity.x = 0;
            result.hitWall = true;
        }
        
        // Z-axis movement
        result.position.z += velocity.z * dt;
        if (this.checkBlockCollisions(result.position, width, height, world)) {
            result.position.z = position.z;
            result.velocity.z = 0;
            result.hitWall = true;
        }
        
        // Y-axis movement (after X/Z so ground check uses new horizontal position)
        const newY = result.position.y + velocity.y * dt;
        result.position.y = newY;
        
        if (velocity.y <= 0) {
            // Moving down or stationary - check for ground at new position
            // Pass the original Y position to scan for blocks we might have passed through
            const scanStartY = Math.floor(position.y);
            const groundLevel = this.findGroundLevel(result.position, width, world, scanStartY);
            if (result.position.y <= groundLevel) {
                result.position.y = groundLevel;
                result.onGround = true;
                result.velocity.y = 0;
            } else {
                // No ground directly below us - we should be falling
                result.onGround = false;
            }
        } else {
            // Moving up - check for ceiling
            if (this.checkBlockCollisions(result.position, width, height, world)) {
                result.position.y = position.y;
                result.velocity.y = 0;
            }
            result.onGround = false;
        }
        
        return result;
    }
    
    // Check if position collides with any solid blocks
    checkBlockCollisions(position, width, height, world) {
        const halfWidth = width / 2;
        const margin = 0.001;
        
        // Check all blocks that the player's bounding box might intersect
        const minX = Math.floor(position.x - halfWidth + margin);
        const maxX = Math.floor(position.x + halfWidth - margin);
        const minY = Math.floor(position.y + margin);
        const maxY = Math.floor(position.y + height - margin);
        const minZ = Math.floor(position.z - halfWidth + margin);
        const maxZ = Math.floor(position.z + halfWidth - margin);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const block = world.getBlock(x, y, z);
                    if (this.isBlockSolid(block)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Check if a block is solid
    isBlockSolid(blockId) {
        // Non-solid blocks: air, water, lava, grass (plant), flowers, etc.
        const nonSolidBlocks = [0, 8, 9, 10, 11, 31, 37, 38, 39, 40, 50, 51, 59, 78];
        return !nonSolidBlocks.includes(blockId);
    }
    
    // Find ground level at position - checks if there's solid ground directly under player
    findGroundLevel(position, width, world, scanStartY = null) {
        const halfWidth = width / 2;
        
        // Check all four corners of the player's base
        const checkPositions = [
            { x: position.x - halfWidth + 0.01, z: position.z - halfWidth + 0.01 },
            { x: position.x + halfWidth - 0.01, z: position.z - halfWidth + 0.01 },
            { x: position.x - halfWidth + 0.01, z: position.z + halfWidth - 0.01 },
            { x: position.x + halfWidth - 0.01, z: position.z + halfWidth - 0.01 },
            { x: position.x, z: position.z } // Center
        ];
        
        // Find the highest ground level among all check positions
        let maxGroundLevel = -Infinity;
        let hasGround = false;
        
        for (const pos of checkPositions) {
            const checkX = Math.floor(pos.x);
            const checkZ = Math.floor(pos.z);
            
            // Scan down from player's current Y (or previous Y) to find the first solid block
            // If scanStartY is provided, we scan from there down to current position
            const startY = scanStartY !== null ? scanStartY : Math.floor(position.y);
            const endY = Math.floor(position.y) - 2;
            
            for (let y = startY; y >= endY; y--) {
                const block = world.getBlock(checkX, y, checkZ);
                if (this.isBlockSolid(block)) {
                    const groundY = y + 1;
                    if (groundY > maxGroundLevel) {
                        maxGroundLevel = groundY;
                        hasGround = true;
                    }
                    break; // Found the highest ground at this X,Z
                }
            }
        }
        
        // If we found ground and it's close enough to snap to
        // Calculate dynamic tolerance based on how far we fell
        const fallDistance = scanStartY !== null ? Math.max(0, scanStartY - position.y) : 0;
        const tolerance = 1.5 + fallDistance;
        
        if (hasGround && position.y >= maxGroundLevel - tolerance && position.y <= maxGroundLevel + 1.5) {
            return maxGroundLevel;
        }
        
        // No ground found nearby
        return -100;
    }
    
    // Raycast for block selection/breaking
    raycast(origin, direction, maxDistance, world) {
        const step = 0.1;
        const point = { ...origin };
        let prevPoint = { ...origin };
        
        for (let d = 0; d < maxDistance; d += step) {
            point.x = origin.x + direction.x * d;
            point.y = origin.y + direction.y * d;
            point.z = origin.z + direction.z * d;
            
            const blockX = Math.floor(point.x);
            const blockY = Math.floor(point.y);
            const blockZ = Math.floor(point.z);
            
            const block = world.getBlock(blockX, blockY, blockZ);
            
            if (block !== 0 && block !== undefined) {
                // Calculate which face was hit
                const face = this.getHitFace(prevPoint, point);
                
                return {
                    hit: true,
                    block: block,
                    position: { x: blockX, y: blockY, z: blockZ },
                    face: face,
                    normal: this.getFaceNormal(face),
                    distance: d
                };
            }
            
            prevPoint = { ...point };
        }
        
        return { hit: false };
    }
    
    // Determine which face was hit
    getHitFace(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const absDz = Math.abs(dz);
        
        if (absDy >= absDx && absDy >= absDz) {
            return dy > 0 ? 'bottom' : 'top';
        } else if (absDx >= absDz) {
            return dx > 0 ? 'west' : 'east';
        } else {
            return dz > 0 ? 'south' : 'north';
        }
    }
    
    // Get normal vector for a face
    getFaceNormal(face) {
        const normals = {
            'top': { x: 0, y: 1, z: 0 },
            'bottom': { x: 0, y: -1, z: 0 },
            'north': { x: 0, y: 0, z: -1 },
            'south': { x: 0, y: 0, z: 1 },
            'east': { x: 1, y: 0, z: 0 },
            'west': { x: -1, y: 0, z: 0 }
        };
        return normals[face] || normals['top'];
    }
    
    // Apply gravity to velocity
    applyGravity(velocity, dt, inWater) {
        if (inWater) {
            // Reduced gravity in water
            velocity.y += this.gravity * 0.2 * dt;
            velocity.y = Math.max(velocity.y, this.terminalVelocity * 0.3);
            
            // Water drag
            velocity.x *= this.waterDrag;
            velocity.z *= this.waterDrag;
        } else {
            velocity.y += this.gravity * dt;
            velocity.y = Math.max(velocity.y, this.terminalVelocity);
        }
        
        return velocity;
    }
    
    // Calculate fall damage
    calculateFallDamage(fallDistance) {
        if (fallDistance > 3) {
            return Math.floor(fallDistance - 3);
        }
        return 0;
    }
}
