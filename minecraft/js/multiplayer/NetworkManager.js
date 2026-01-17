// Network Manager - handles multiplayer connections
import * as THREE from 'three';

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerId = null;
        this.playerName = null;
        this.connected = false;
        this.otherPlayers = new Map();
        
        // Update rates
        this.positionUpdateRate = 50; // ms
        this.lastPositionUpdate = 0;
    }
    
    async connect(address, playerName) {
        this.playerName = playerName;
        
        return new Promise((resolve, reject) => {
            try {
                // Parse address
                const [host, port] = address.split(':');
                const wsUrl = `ws://${host}:${port || 3000}`;
                
                this.socket = new WebSocket(wsUrl);
                
                this.socket.onopen = () => {
                    console.log('Connected to server');
                    this.connected = true;
                    
                    // Send join message
                    this.send({
                        type: 'join',
                        name: playerName,
                        skin: this.game.player?.characterData || {}
                    });
                    
                    resolve();
                };
                
                this.socket.onclose = () => {
                    console.log('Disconnected from server');
                    this.connected = false;
                    this.game.uiManager?.addSystemMessage('Disconnected from server');
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(new Error('Failed to connect to server'));
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.send({ type: 'leave' });
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
    }
    
    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                this.playerId = message.playerId;
                this.game.uiManager?.addSystemMessage(`Connected as ${this.playerName}`);
                break;
                
            case 'player_join':
                this.addPlayer(message.player);
                this.game.uiManager?.addSystemMessage(`${message.player.name} joined the game`);
                break;
                
            case 'player_leave':
                this.removePlayer(message.playerId);
                this.game.uiManager?.addSystemMessage(`${message.playerName} left the game`);
                break;
                
            case 'player_update':
                this.updatePlayer(message.playerId, message.data);
                break;
                
            case 'players_list':
                message.players.forEach(player => {
                    if (player.id !== this.playerId) {
                        this.addPlayer(player);
                    }
                });
                break;
                
            case 'block_update':
                this.handleBlockUpdate(message);
                break;
                
            case 'chat':
                this.game.uiManager?.addChatMessage(message.playerName, message.message);
                break;
                
            case 'world_data':
                // Handle world sync from server
                this.syncWorld(message.data);
                break;
        }
    }
    
    update(dt) {
        if (!this.connected) return;
        
        const now = performance.now();
        
        // Send position updates
        if (now - this.lastPositionUpdate > this.positionUpdateRate) {
            this.sendPositionUpdate();
            this.lastPositionUpdate = now;
        }
    }
    
    sendPositionUpdate() {
        const player = this.game.player;
        if (!player) return;
        
        this.send({
            type: 'position',
            position: player.position,
            rotation: player.rotation,
            velocity: player.velocity,
            onGround: player.onGround,
            animation: this.getPlayerAnimation(player)
        });
    }
    
    getPlayerAnimation(player) {
        if (player.isSprinting) return 'sprint';
        if (player.isSneaking) return 'sneak';
        if (!player.onGround) return 'jump';
        if (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1) return 'walk';
        return 'idle';
    }
    
    sendBlockUpdate(position, blockType) {
        this.send({
            type: 'block_update',
            position: position,
            blockType: blockType
        });
    }
    
    sendChatMessage(message) {
        this.send({
            type: 'chat',
            message: message
        });
    }
    
    addPlayer(playerData) {
        if (playerData.id === this.playerId) return;
        
        // Create remote player mesh
        const player = new RemotePlayer(playerData);
        this.otherPlayers.set(playerData.id, player);
        this.game.otherPlayers.set(playerData.id, player);
        
        // Add to scene
        this.game.renderer.addToScene(player.mesh);
    }
    
    removePlayer(playerId) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            this.game.renderer.removeFromScene(player.mesh);
            player.dispose();
            this.otherPlayers.delete(playerId);
            this.game.otherPlayers.delete(playerId);
        }
    }
    
    updatePlayer(playerId, data) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            player.updateFromNetwork(data);
        }
    }
    
    handleBlockUpdate(message) {
        const { position, blockType } = message;
        
        // Update world
        this.game.world.setBlock(position.x, position.y, position.z, blockType);
        
        // Update chunk mesh
        const chunk = this.game.chunkManager.getChunkAt(position.x, position.z);
        if (chunk) {
            chunk.setDirty();
        }
    }
    
    syncWorld(worldData) {
        // Sync chunks from server
        if (worldData.chunks) {
            Object.entries(worldData.chunks).forEach(([key, chunkData]) => {
                const chunk = this.game.chunkManager.loadedChunks.get(key);
                if (chunk) {
                    // Apply chunk updates
                    // This would be more complex in a real implementation
                }
            });
        }
    }
}

// Remote player representation
class RemotePlayer {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.position = data.position || { x: 0, y: 70, z: 0 };
        this.rotation = data.rotation || { x: 0, y: 0 };
        this.animation = 'idle';
        
        // Target position for interpolation
        this.targetPosition = { ...this.position };
        this.targetRotation = { ...this.rotation };
        
        // Create mesh
        this.mesh = this.createMesh(data.skin);
        this.updatePosition();
        
        // Create nametag
        this.createNametag();
    }
    
    createMesh(skin) {
        const group = new THREE.Group();
        
        // Simple player model
        const skinColor = skin?.skinColor ? new THREE.Color(skin.skinColor) : new THREE.Color(0xc4a484);
        const shirtColor = skin?.shirtColor ? new THREE.Color(skin.shirtColor) : new THREE.Color(0x00aaff);
        const pantsColor = skin?.pantsColor ? new THREE.Color(skin.pantsColor) : new THREE.Color(0x3333aa);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.name = 'head';
        group.add(head);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.25);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: shirtColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        group.add(body);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const armMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.375, 0.9, 0);
        leftArm.name = 'leftArm';
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.375, 0.9, 0);
        rightArm.name = 'rightArm';
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const legMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.125, 0.15, 0);
        leftLeg.name = 'leftLeg';
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.125, 0.15, 0);
        rightLeg.name = 'rightLeg';
        group.add(rightLeg);
        
        return group;
    }
    
    createNametag() {
        // Create canvas for nametag
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 256, 64);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 128, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.y = 2.2;
        sprite.scale.set(2, 0.5, 1);
        
        this.mesh.add(sprite);
    }
    
    updateFromNetwork(data) {
        if (data.position) {
            this.targetPosition = data.position;
        }
        if (data.rotation) {
            this.targetRotation = data.rotation;
        }
        if (data.animation) {
            this.animation = data.animation;
        }
    }
    
    updateAnimation(dt) {
        // Interpolate position
        const lerpFactor = 0.2;
        this.position.x += (this.targetPosition.x - this.position.x) * lerpFactor;
        this.position.y += (this.targetPosition.y - this.position.y) * lerpFactor;
        this.position.z += (this.targetPosition.z - this.position.z) * lerpFactor;
        
        // Interpolate rotation
        this.rotation.y += (this.targetRotation.y - this.rotation.y) * lerpFactor;
        
        this.updatePosition();
        this.animateParts(dt);
    }
    
    updatePosition() {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.rotation.y = this.rotation.y;
    }
    
    animateParts(dt) {
        const time = performance.now() * 0.01;
        
        // Get body parts
        const leftArm = this.mesh.getObjectByName('leftArm');
        const rightArm = this.mesh.getObjectByName('rightArm');
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        
        if (this.animation === 'walk' || this.animation === 'sprint') {
            const speed = this.animation === 'sprint' ? 2 : 1;
            const swing = Math.sin(time * speed) * 0.5;
            
            if (leftArm) leftArm.rotation.x = swing;
            if (rightArm) rightArm.rotation.x = -swing;
            if (leftLeg) leftLeg.rotation.x = -swing;
            if (rightLeg) rightLeg.rotation.x = swing;
        } else {
            // Reset to idle
            if (leftArm) leftArm.rotation.x = 0;
            if (rightArm) rightArm.rotation.x = 0;
            if (leftLeg) leftLeg.rotation.x = 0;
            if (rightLeg) rightLeg.rotation.x = 0;
        }
    }
    
    dispose() {
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
}
