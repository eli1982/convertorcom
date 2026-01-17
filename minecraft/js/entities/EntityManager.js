// Entity base class and mob system
import * as THREE from 'three';

export class Entity {
    constructor(world, position = { x: 0, y: 70, z: 0 }) {
        this.world = world;
        this.position = { ...position };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0 };
        
        this.width = 0.6;
        this.height = 1.8;
        
        this.onGround = false;
        this.dead = false;
        
        // Stats
        this.maxHealth = 20;
        this.health = 20;
        
        // Mesh
        this.mesh = null;
    }
    
    update(dt) {
        // Apply gravity
        this.velocity.y -= 32 * dt;
        
        // Apply velocity
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;
        
        // Simple ground check
        const groundY = this.getGroundLevel();
        if (this.position.y <= groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.y = this.rotation.y;
        }
    }
    
    getGroundLevel() {
        // Get ground level at current position
        for (let y = Math.floor(this.position.y); y >= 0; y--) {
            const block = this.world.getBlock(
                Math.floor(this.position.x),
                y,
                Math.floor(this.position.z)
            );
            if (block && block !== 0) {
                return y + 1;
            }
        }
        return 0;
    }
    
    damage(amount, source) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    die() {
        this.dead = true;
    }
    
    distanceTo(other) {
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        const dz = other.position.z - this.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    dispose() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

// Mob base class
export class Mob extends Entity {
    constructor(world, position, type) {
        super(world, position);
        this.type = type;
        
        // AI state
        this.aiState = 'idle';
        this.target = null;
        this.pathUpdateTimer = 0;
        this.wanderTimer = 0;
        this.wanderDirection = { x: 0, z: 0 };
        
        // Movement
        this.moveSpeed = 2;
        this.jumpStrength = 8;
        
        // Attack
        this.attackDamage = 2;
        this.attackCooldown = 0;
        this.attackRange = 2;
        
        // Detection
        this.detectionRange = 16;
        this.hostile = false;
        
        // Note: createMesh() must be called by child class after setting its properties
    }
    
    createMesh() {
        // Override in subclass
    }
    
    update(dt) {
        if (this.dead) return;
        
        // Update timers
        this.pathUpdateTimer -= dt;
        this.wanderTimer -= dt;
        this.attackCooldown -= dt;
        
        // AI update
        this.updateAI(dt);
        
        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        super.update(dt);
    }
    
    updateAI(dt) {
        switch (this.aiState) {
            case 'idle':
                this.doIdle(dt);
                break;
            case 'wander':
                this.doWander(dt);
                break;
            case 'chase':
                this.doChase(dt);
                break;
            case 'attack':
                this.doAttack(dt);
                break;
            case 'flee':
                this.doFlee(dt);
                break;
        }
    }
    
    doIdle(dt) {
        // Check for targets if hostile
        if (this.hostile) {
            this.target = this.findTarget();
            if (this.target) {
                this.aiState = 'chase';
                return;
            }
        }
        
        // Occasionally start wandering
        if (Math.random() < 0.01) {
            this.startWander();
        }
    }
    
    startWander() {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDirection = {
            x: Math.cos(angle),
            z: Math.sin(angle)
        };
        this.wanderTimer = 3 + Math.random() * 5;
        this.aiState = 'wander';
    }
    
    doWander(dt) {
        if (this.wanderTimer <= 0) {
            this.aiState = 'idle';
            return;
        }
        
        // Check for targets if hostile
        if (this.hostile) {
            this.target = this.findTarget();
            if (this.target) {
                this.aiState = 'chase';
                return;
            }
        }
        
        // Move in wander direction
        this.velocity.x = this.wanderDirection.x * this.moveSpeed * 0.3;
        this.velocity.z = this.wanderDirection.z * this.moveSpeed * 0.3;
        
        // Update rotation to face movement direction
        this.rotation.y = Math.atan2(this.wanderDirection.x, this.wanderDirection.z);
        
        // Jump over obstacles
        this.checkAndJump();
    }
    
    doChase(dt) {
        if (!this.target || this.target.dead) {
            this.target = null;
            this.aiState = 'idle';
            return;
        }
        
        const dist = this.distanceTo(this.target);
        
        // Lose interest if too far
        if (dist > this.detectionRange * 1.5) {
            this.target = null;
            this.aiState = 'idle';
            return;
        }
        
        // Attack if close enough
        if (dist <= this.attackRange) {
            this.aiState = 'attack';
            return;
        }
        
        // Move towards target
        const dx = this.target.position.x - this.position.x;
        const dz = this.target.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        
        if (len > 0) {
            this.velocity.x = (dx / len) * this.moveSpeed;
            this.velocity.z = (dz / len) * this.moveSpeed;
            this.rotation.y = Math.atan2(dx, dz);
        }
        
        this.checkAndJump();
    }
    
    doAttack(dt) {
        if (!this.target || this.target.dead) {
            this.target = null;
            this.aiState = 'idle';
            return;
        }
        
        const dist = this.distanceTo(this.target);
        
        if (dist > this.attackRange) {
            this.aiState = 'chase';
            return;
        }
        
        // Attack
        if (this.attackCooldown <= 0) {
            this.target.damage(this.attackDamage, this);
            this.attackCooldown = 1;
        }
    }
    
    doFlee(dt) {
        if (!this.target) {
            this.aiState = 'idle';
            return;
        }
        
        const dist = this.distanceTo(this.target);
        if (dist > this.detectionRange) {
            this.target = null;
            this.aiState = 'idle';
            return;
        }
        
        // Move away from target
        const dx = this.position.x - this.target.position.x;
        const dz = this.position.z - this.target.position.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        
        if (len > 0) {
            this.velocity.x = (dx / len) * this.moveSpeed;
            this.velocity.z = (dz / len) * this.moveSpeed;
            this.rotation.y = Math.atan2(dx, dz);
        }
        
        this.checkAndJump();
    }
    
    checkAndJump() {
        // Check if there's a block in front
        const checkX = this.position.x + Math.sin(this.rotation.y) * 0.5;
        const checkZ = this.position.z + Math.cos(this.rotation.y) * 0.5;
        const checkY = this.position.y;
        
        const blockInFront = this.world.getBlock(
            Math.floor(checkX),
            Math.floor(checkY),
            Math.floor(checkZ)
        );
        
        if (blockInFront && blockInFront !== 0 && this.onGround) {
            this.velocity.y = this.jumpStrength;
        }
    }
    
    findTarget() {
        // This should be called with player reference
        // For now, return null - will be set by game
        return null;
    }
    
    damage(amount, source) {
        super.damage(amount, source);
        
        // Flee if passive, or target attacker if hostile
        if (!this.hostile) {
            this.target = source;
            this.aiState = 'flee';
        } else {
            this.target = source;
            this.aiState = 'chase';
        }
    }
}

// Zombie mob
export class Zombie extends Mob {
    constructor(world, position) {
        super(world, position, 'zombie');
        this.hostile = true;
        this.attackDamage = 3;
        this.maxHealth = 20;
        this.health = 20;
        this.moveSpeed = 1.5;
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const zombieSkin = new THREE.Color(0x4a7a4a);
        const zombieClothes = new THREE.Color(0x3a5a3a);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: zombieSkin });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        group.add(head);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.25);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: zombieClothes });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        group.add(body);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const armMaterial = new THREE.MeshLambertMaterial({ color: zombieSkin });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.375, 0.9, 0);
        leftArm.rotation.x = -Math.PI / 4;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.375, 0.9, 0);
        rightArm.rotation.x = -Math.PI / 4;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const legMaterial = new THREE.MeshLambertMaterial({ color: zombieClothes });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.125, 0.15, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.125, 0.15, 0);
        group.add(rightLeg);
        
        this.mesh = group;
    }
}

// Skeleton mob
export class Skeleton extends Mob {
    constructor(world, position) {
        super(world, position, 'skeleton');
        this.hostile = true;
        this.attackDamage = 2;
        this.attackRange = 10;
        this.maxHealth = 20;
        this.health = 20;
        this.moveSpeed = 1.5;
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const boneSkin = new THREE.Color(0xe8e8e8);
        const darkBone = new THREE.Color(0xc0c0c0);
        
        // Head (skull)
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: boneSkin });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        group.add(head);
        
        // Body (ribcage)
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.75, 0.2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: darkBone });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        group.add(body);
        
        // Arms (thin bones)
        const armGeometry = new THREE.BoxGeometry(0.15, 0.75, 0.15);
        const armMaterial = new THREE.MeshLambertMaterial({ color: boneSkin });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.325, 0.9, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.325, 0.9, 0);
        group.add(rightArm);
        
        // Legs (thin bones)
        const legGeometry = new THREE.BoxGeometry(0.15, 0.75, 0.15);
        
        const leftLeg = new THREE.Mesh(legGeometry, armMaterial);
        leftLeg.position.set(-0.125, 0.15, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, armMaterial);
        rightLeg.position.set(0.125, 0.15, 0);
        group.add(rightLeg);
        
        this.mesh = group;
    }
}

// Creeper mob
export class Creeper extends Mob {
    constructor(world, position) {
        super(world, position, 'creeper');
        this.hostile = true;
        this.attackDamage = 0;
        this.attackRange = 3;
        this.maxHealth = 20;
        this.health = 20;
        this.moveSpeed = 1.2;
        
        this.fuseTime = 1.5;
        this.fuseTimer = 0;
        this.exploding = false;
        this.explosionRadius = 3;
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const creeperGreen = new THREE.Color(0x2d9c2d);
        const creeperDark = new THREE.Color(0x1a6b1a);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: creeperGreen });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        group.add(head);
        
        // Body (tall)
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.9, 0.25);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: creeperGreen });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        group.add(body);
        
        // Four legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: creeperDark });
        
        const frontLeft = new THREE.Mesh(legGeometry, legMaterial);
        frontLeft.position.set(-0.15, -0.1, 0.15);
        group.add(frontLeft);
        
        const frontRight = new THREE.Mesh(legGeometry, legMaterial);
        frontRight.position.set(0.15, -0.1, 0.15);
        group.add(frontRight);
        
        const backLeft = new THREE.Mesh(legGeometry, legMaterial);
        backLeft.position.set(-0.15, -0.1, -0.15);
        group.add(backLeft);
        
        const backRight = new THREE.Mesh(legGeometry, legMaterial);
        backRight.position.set(0.15, -0.1, -0.15);
        group.add(backRight);
        
        this.mesh = group;
    }
    
    doAttack(dt) {
        if (!this.target || this.target.dead) {
            this.target = null;
            this.aiState = 'idle';
            this.exploding = false;
            this.fuseTimer = 0;
            return;
        }
        
        const dist = this.distanceTo(this.target);
        
        if (dist > this.attackRange) {
            this.aiState = 'chase';
            this.exploding = false;
            this.fuseTimer = 0;
            return;
        }
        
        // Start fuse
        if (!this.exploding) {
            this.exploding = true;
            this.fuseTimer = this.fuseTime;
        }
        
        this.fuseTimer -= dt;
        
        // Flash white while charging
        if (this.mesh) {
            const flash = Math.sin(this.fuseTimer * 10) > 0;
            this.mesh.traverse(child => {
                if (child.material) {
                    child.material.emissive = flash ? 
                        new THREE.Color(0xffffff) : 
                        new THREE.Color(0x000000);
                }
            });
        }
        
        if (this.fuseTimer <= 0) {
            this.explode();
        }
    }
    
    explode() {
        // Deal damage to nearby entities
        const explosionDamage = 10;
        
        // For now just damage the target
        if (this.target) {
            const dist = this.distanceTo(this.target);
            if (dist < this.explosionRadius) {
                const damage = explosionDamage * (1 - dist / this.explosionRadius);
                this.target.damage(damage, this);
            }
        }
        
        // Destroy blocks around explosion (simplified)
        // In a full implementation, this would modify the world
        
        this.die();
    }
}

// Pig (passive mob)
export class Pig extends Mob {
    constructor(world, position) {
        super(world, position, 'pig');
        this.hostile = false;
        this.maxHealth = 10;
        this.health = 10;
        this.moveSpeed = 1.5;
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const pigPink = new THREE.Color(0xf5a9b8);
        const pigSnout = new THREE.Color(0xe09aa9);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.4);
        const headMaterial = new THREE.MeshLambertMaterial({ color: pigPink });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.5, 0.4);
        group.add(head);
        
        // Snout
        const snoutGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.1);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: pigSnout });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, 0.4, 0.65);
        group.add(snout);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.9);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: pigPink });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        group.add(body);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: pigPink });
        
        const frontLeft = new THREE.Mesh(legGeometry, legMaterial);
        frontLeft.position.set(-0.15, 0, 0.25);
        group.add(frontLeft);
        
        const frontRight = new THREE.Mesh(legGeometry, legMaterial);
        frontRight.position.set(0.15, 0, 0.25);
        group.add(frontRight);
        
        const backLeft = new THREE.Mesh(legGeometry, legMaterial);
        backLeft.position.set(-0.15, 0, -0.25);
        group.add(backLeft);
        
        const backRight = new THREE.Mesh(legGeometry, legMaterial);
        backRight.position.set(0.15, 0, -0.25);
        group.add(backRight);
        
        this.mesh = group;
    }
}

// Cow (passive mob)
export class Cow extends Mob {
    constructor(world, position) {
        super(world, position, 'cow');
        this.hostile = false;
        this.maxHealth = 10;
        this.health = 10;
        this.moveSpeed = 1.5;
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const cowBrown = new THREE.Color(0x4a3728);
        const cowWhite = new THREE.Color(0xe8e0d0);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.4, 0.45, 0.35);
        const headMaterial = new THREE.MeshLambertMaterial({ color: cowBrown });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.7, 0.55);
        group.add(head);
        
        // Horns
        const hornGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const hornMaterial = new THREE.MeshLambertMaterial({ color: cowWhite });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.2, 0.95, 0.55);
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.2, 0.95, 0.55);
        group.add(rightHorn);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.6, 1.0);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: cowBrown });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        group.add(body);
        
        // White spots
        const spotGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const spotMaterial = new THREE.MeshLambertMaterial({ color: cowWhite });
        
        const spot1 = new THREE.Mesh(spotGeometry, spotMaterial);
        spot1.position.set(0.16, 0.5, 0);
        group.add(spot1);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: cowBrown });
        
        const frontLeft = new THREE.Mesh(legGeometry, legMaterial);
        frontLeft.position.set(-0.2, 0, 0.3);
        group.add(frontLeft);
        
        const frontRight = new THREE.Mesh(legGeometry, legMaterial);
        frontRight.position.set(0.2, 0, 0.3);
        group.add(frontRight);
        
        const backLeft = new THREE.Mesh(legGeometry, legMaterial);
        backLeft.position.set(-0.2, 0, -0.3);
        group.add(backLeft);
        
        const backRight = new THREE.Mesh(legGeometry, legMaterial);
        backRight.position.set(0.2, 0, -0.3);
        group.add(backRight);
        
        this.mesh = group;
    }
}

// Sheep (passive mob)
export class Sheep extends Mob {
    constructor(world, position) {
        super(world, position, 'sheep');
        this.hostile = false;
        this.maxHealth = 8;
        this.health = 8;
        this.moveSpeed = 1.3;
        this.sheared = false;
        // Set wool color before createMesh is called
        this.woolColor = new THREE.Color().setHSL(Math.random(), 0.5, 0.8);
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const sheepSkin = new THREE.Color(0xe8dcc8);
        const woolColor = this.sheared ? sheepSkin : this.woolColor;
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.4);
        const headMaterial = new THREE.MeshLambertMaterial({ color: sheepSkin });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.65, 0.45);
        group.add(head);
        
        // Body (wool)
        const bodyGeometry = new THREE.BoxGeometry(0.65, 0.55, 0.9);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: woolColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.45;
        group.add(body);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.15, 0.35, 0.15);
        const legMaterial = new THREE.MeshLambertMaterial({ color: sheepSkin });
        
        const frontLeft = new THREE.Mesh(legGeometry, legMaterial);
        frontLeft.position.set(-0.2, 0, 0.25);
        group.add(frontLeft);
        
        const frontRight = new THREE.Mesh(legGeometry, legMaterial);
        frontRight.position.set(0.2, 0, 0.25);
        group.add(frontRight);
        
        const backLeft = new THREE.Mesh(legGeometry, legMaterial);
        backLeft.position.set(-0.2, 0, -0.25);
        group.add(backLeft);
        
        const backRight = new THREE.Mesh(legGeometry, legMaterial);
        backRight.position.set(0.2, 0, -0.25);
        group.add(backRight);
        
        this.mesh = group;
    }
}

// Entity Manager
export class EntityManager {
    constructor(game) {
        this.game = game;
        this.entities = new Map();
        this.nextEntityId = 1;
        
        this.spawnTimer = 0;
        this.spawnInterval = 10; // seconds
        this.maxMobs = 20;
    }
    
    update(dt) {
        // Update all entities
        this.entities.forEach((entity, id) => {
            if (entity.dead) {
                this.removeEntity(id);
            } else {
                // Update target for hostile mobs
                if (entity instanceof Mob && entity.hostile) {
                    entity.target = this.game.player;
                }
                entity.update(dt);
            }
        });
        
        // Spawn mobs periodically
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.trySpawnMob();
        }
    }
    
    trySpawnMob() {
        if (this.entities.size >= this.maxMobs) return;
        if (!this.game.player) return;
        
        // Get random position around player
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 20;
        
        const x = this.game.player.position.x + Math.cos(angle) * distance;
        const z = this.game.player.position.z + Math.sin(angle) * distance;
        
        // Find ground level
        let y = 70;
        for (let checkY = 100; checkY >= 0; checkY--) {
            const block = this.game.world.getBlock(Math.floor(x), checkY, Math.floor(z));
            if (block && block !== 0) {
                y = checkY + 1;
                break;
            }
        }
        
        // Check if spawn area is clear
        const blockAbove = this.game.world.getBlock(Math.floor(x), y, Math.floor(z));
        if (blockAbove && blockAbove !== 0) return;
        
        // Determine mob type based on time and biome
        const isNight = this.game.world.timeOfDay > 0.75 || this.game.world.timeOfDay < 0.25;
        
        let mob;
        if (isNight && Math.random() < 0.6) {
            // Spawn hostile mobs at night
            const hostileTypes = [Zombie, Skeleton, Creeper];
            const MobClass = hostileTypes[Math.floor(Math.random() * hostileTypes.length)];
            mob = new MobClass(this.game.world, { x, y, z });
        } else {
            // Spawn passive mobs during day
            const passiveTypes = [Pig, Cow, Sheep];
            const MobClass = passiveTypes[Math.floor(Math.random() * passiveTypes.length)];
            mob = new MobClass(this.game.world, { x, y, z });
        }
        
        this.addEntity(mob);
    }
    
    addEntity(entity) {
        const id = this.nextEntityId++;
        entity.id = id;
        this.entities.set(id, entity);
        
        if (entity.mesh) {
            this.game.renderer.addToScene(entity.mesh);
        }
        
        return id;
    }
    
    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            if (entity.mesh) {
                this.game.renderer.removeFromScene(entity.mesh);
            }
            entity.dispose();
            this.entities.delete(id);
        }
    }
    
    getEntity(id) {
        return this.entities.get(id);
    }
    
    getEntitiesNear(position, radius) {
        const nearby = [];
        this.entities.forEach(entity => {
            const dx = entity.position.x - position.x;
            const dy = entity.position.y - position.y;
            const dz = entity.position.z - position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist <= radius) {
                nearby.push(entity);
            }
        });
        return nearby;
    }
    
    clear() {
        this.entities.forEach((entity, id) => {
            this.removeEntity(id);
        });
    }
}
