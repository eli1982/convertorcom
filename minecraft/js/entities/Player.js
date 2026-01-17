// Player entity
export class Player {
    constructor(options = {}) {
        // Position and rotation
        this.position = options.position || { x: 0, y: 70, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0 };
        
        // Physical properties
        this.width = 0.6;
        this.height = 1.8;
        this.eyeHeight = 1.62;
        
        // Movement properties
        this.walkSpeed = 4.317;
        this.sprintSpeed = 5.612;
        this.sneakSpeed = 1.3;
        this.swimSpeed = 2.0;
        this.flySpeed = 10.0;
        
        // State
        this.onGround = false;
        this.inWater = false;
        this.inLava = false;
        this.isSprinting = false;
        this.isSneaking = false;
        this.isFlying = false;
        this.gameMode = options.gameMode || 'survival';
        
        // Stats
        this.health = 20;
        this.maxHealth = 20;
        this.hunger = 20;
        this.maxHunger = 20;
        this.saturation = 5;
        this.experience = 0;
        this.level = 0;
        
        // Inventory
        this.inventory = null;
        this.selectedSlot = 0;
        
        // Block interaction
        this.breakingBlock = null;
        this.breakProgress = 0;
        this.reachDistance = 5;
        
        // Fall damage tracking
        this.fallStartY = this.position.y;
        this.lastOnGround = true;
        
        // Double jump detection for flying
        this.lastJumpTime = 0;
        this.jumpCount = 0;
    }
    
    update(dt, input, world, physics) {
        // Handle flying toggle (creative mode)
        if (this.gameMode === 'creative' && input.isJumping()) {
            const now = performance.now();
            if (now - this.lastJumpTime < 300) {
                this.isFlying = !this.isFlying;
                this.velocity.y = 0;
            }
            this.lastJumpTime = now;
        }
        
        // Get movement input
        const movement = input.getMovementVector();
        this.isSprinting = input.isSprinting() && movement.z < 0;
        this.isSneaking = input.isSneaking();
        
        // Calculate movement speed
        let speed = this.walkSpeed;
        if (this.isSprinting) speed = this.sprintSpeed;
        if (this.isSneaking) speed = this.sneakSpeed;
        if (this.isFlying) speed = this.flySpeed;
        if (this.inWater && !this.isFlying) speed = this.swimSpeed;
        
        // Apply rotation to movement
        // In Three.js: forward is -Z, right is +X
        // rotation.y is yaw (horizontal rotation, 0 = looking down -Z)
        // movement.z: -1 = forward (W), +1 = backward (S)
        // movement.x: -1 = left (A), +1 = right (D)
        const sin = Math.sin(this.rotation.y);
        const cos = Math.cos(this.rotation.y);
        
        // Transform local movement to world space
        // When looking down -Z (rotation.y=0), W should move in -Z direction
        const moveX = movement.z * sin + movement.x * cos;
        const moveZ = movement.z * cos - movement.x * sin;
        
        // Set horizontal velocity (will be scaled by dt in physics)
        this.velocity.x = moveX * speed;
        this.velocity.z = moveZ * speed;
        
        // Handle vertical movement
        if (this.isFlying) {
            // Flying movement
            if (input.isJumping()) {
                this.velocity.y = speed;
            } else if (this.isSneaking) {
                this.velocity.y = -speed;
            } else {
                this.velocity.y *= 0.8; // Slow down vertical when flying
            }
        } else {
            // Apply gravity only if not on ground
            if (!this.onGround) {
                this.velocity.y += physics.gravity * dt;
                // Clamp to terminal velocity
                if (this.velocity.y < physics.terminalVelocity) {
                    this.velocity.y = physics.terminalVelocity;
                }
            } else {
                this.velocity.y = 0;
            }
            
            // Jump - use impulse velocity (not scaled by dt)
            if (input.isJumping() && this.onGround) {
                this.velocity.y = physics.jumpVelocity;
                this.onGround = false;
            }
            
            // Swimming
            if (this.inWater && input.isJumping()) {
                this.velocity.y = Math.min(this.velocity.y + physics.swimSpeed * dt, 3);
            }
        }
        
        // Apply physics and collision
        const result = physics.checkWorldCollision(
            this.position,
            this.velocity,
            this.width,
            this.height,
            world,
            dt
        );
        
        // Update position
        this.position = result.position;
        this.velocity = result.velocity;
        this.onGround = result.onGround;
        this.inWater = result.inWater;
        
        // Safety check - don't fall below bedrock (y=0) or into void
        if (this.position.y < 0) {
            // Teleport back to spawn
            const spawnPos = world.getSpawnPosition();
            this.position.x = spawnPos.x;
            this.position.y = spawnPos.y;
            this.position.z = spawnPos.z;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Fall damage (survival mode only)
        if (this.gameMode === 'survival') {
            if (!this.lastOnGround && this.onGround && !this.inWater) {
                const fallDistance = this.fallStartY - this.position.y;
                const damage = physics.calculateFallDamage(fallDistance);
                if (damage > 0) {
                    this.takeDamage(damage, 'fall');
                }
            }
            
            if (!this.onGround && this.lastOnGround) {
                this.fallStartY = this.position.y;
            }
            
            this.lastOnGround = this.onGround;
            
            // Lava damage
            if (this.inLava) {
                this.takeDamage(4 * dt, 'lava');
            }
            
            // Hunger drain
            if (this.isSprinting) {
                this.depleteHunger(0.1 * dt);
            }
        }
        
        // Update block breaking
        if (this.breakingBlock) {
            this.updateBreaking(dt, world);
        }
    }
    
    takeDamage(amount, source) {
        if (this.gameMode === 'creative') return;
        
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    depleteHunger(amount) {
        if (this.saturation > 0) {
            this.saturation = Math.max(0, this.saturation - amount);
        } else {
            this.hunger = Math.max(0, this.hunger - amount);
        }
        
        // Regenerate health when hunger is high
        if (this.hunger >= 18 && this.health < this.maxHealth) {
            this.heal(amount * 0.5);
        }
        
        // Take damage when starving
        if (this.hunger <= 0) {
            this.takeDamage(amount * 0.5, 'starvation');
        }
    }
    
    feed(food, saturation) {
        this.hunger = Math.min(this.maxHunger, this.hunger + food);
        this.saturation = Math.min(this.hunger, this.saturation + saturation);
    }
    
    addExperience(amount) {
        this.experience += amount;
        
        // Calculate level up
        while (this.experience >= this.getExperienceForNextLevel()) {
            this.experience -= this.getExperienceForNextLevel();
            this.level++;
        }
    }
    
    getExperienceForNextLevel() {
        if (this.level >= 30) {
            return 112 + (this.level - 30) * 9;
        } else if (this.level >= 15) {
            return 37 + (this.level - 15) * 5;
        } else {
            return 7 + this.level * 2;
        }
    }
    
    die() {
        // Drop inventory
        // Respawn
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.saturation = 5;
        this.position = { x: 0, y: 80, z: 0 }; // Spawn point
    }
    
    startBreaking() {
        // Raycast to find block
        const direction = this.getLookDirection();
        // This would be called from game to get the raycast result
    }
    
    stopBreaking() {
        this.breakingBlock = null;
        this.breakProgress = 0;
    }
    
    updateBreaking(dt, world) {
        if (!this.breakingBlock) return;
        
        const blockData = this.getBlockData(this.breakingBlock.type);
        if (!blockData || blockData.hardness < 0) {
            this.stopBreaking();
            return;
        }
        
        // Calculate break speed
        let breakSpeed = 1;
        const heldItem = this.getHeldItem();
        
        if (heldItem && heldItem.tool === blockData.tool) {
            breakSpeed = heldItem.toolSpeed || 1;
        }
        
        this.breakProgress += (breakSpeed / blockData.hardness) * dt;
        
        if (this.breakProgress >= 1) {
            // Block broken
            this.stopBreaking();
        }
    }
    
    useItem() {
        // Right click action - place block or use item
        const heldItem = this.getHeldItem();
        
        if (heldItem && heldItem.isBlock) {
            // Place block
            return { action: 'place', block: heldItem.blockId };
        } else if (heldItem && heldItem.isFood) {
            // Eat food
            if (this.hunger < this.maxHunger) {
                this.feed(heldItem.food, heldItem.saturation);
                this.consumeItem();
            }
        }
        
        return null;
    }
    
    getHeldItem() {
        if (!this.inventory) return null;
        const slot = this.inventory.getSlot(this.selectedSlot);
        return slot ? slot.item : null;
    }
    
    consumeItem() {
        if (!this.inventory) return;
        this.inventory.decrementSlot(this.selectedSlot);
    }
    
    dropItem() {
        if (!this.inventory) return;
        const item = this.inventory.getSlot(this.selectedSlot);
        if (item) {
            this.inventory.decrementSlot(this.selectedSlot);
            // Spawn dropped item entity
            return { item, position: this.position, direction: this.getLookDirection() };
        }
    }
    
    getLookDirection() {
        return {
            x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
            y: -Math.sin(this.rotation.x),
            z: -Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
        };
    }
    
    getBlockData(blockType) {
        // Would call BlockRegistry.getBlock
        return null;
    }
}
