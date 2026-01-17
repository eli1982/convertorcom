// Input Manager
export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Key states
        this.keys = {};
        this.mouseButtons = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        
        // Mouse sensitivity
        this.sensitivity = 0.002;
        
        // Touch support
        this.touches = {};
        this.joystickOrigin = null;
        this.joystickPosition = null;
        
        // Scroll for hotbar
        this.scrollDelta = 0;
        
        // Pointer lock state
        this.isPointerLocked = false;
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
    }
    
    init() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Mouse events
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('wheel', this.onWheel);
        document.addEventListener('contextmenu', this.onContextMenu);
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
        
        // Click to lock pointer and hide overlay
        const canvas = document.getElementById('game-canvas');
        const clickOverlay = document.getElementById('click-to-play');
        
        const handleGameClick = () => {
            // Hide the click-to-play overlay
            if (clickOverlay) {
                clickOverlay.classList.add('hidden');
            }
            
            if (!this.isPointerLocked && !this.game.isPaused) {
                this.game.requestPointerLock();
            }
        };
        
        canvas.addEventListener('click', handleGameClick);
        if (clickOverlay) {
            clickOverlay.addEventListener('click', handleGameClick);
        }
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle special keys
        switch (event.code) {
            case 'Escape':
                if (this.game.isPaused) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
                break;
            case 'KeyE':
                // Toggle inventory
                this.game.uiManager.toggleInventory();
                break;
            case 'KeyT':
                // Open chat
                if (!this.game.isPaused) {
                    this.game.uiManager.openChat();
                }
                break;
            case 'F3':
                // Toggle debug info
                this.game.uiManager.toggleDebug();
                event.preventDefault();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
                // Select hotbar slot
                const slot = parseInt(event.code.replace('Digit', '')) - 1;
                this.game.player.selectedSlot = slot;
                this.game.uiManager.updateHotbar();
                break;
            case 'KeyQ':
                // Drop item
                this.game.player.dropItem();
                break;
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouseDelta.x += event.movementX || event.mozMovementX || 0;
            this.mouseDelta.y += event.movementY || event.mozMovementY || 0;
        }
        
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }
    
    onMouseDown(event) {
        this.mouseButtons[event.button] = true;
        
        if (this.isPointerLocked && !this.game.isPaused) {
            if (event.button === 0) {
                // Left click - break block
                this.handleBlockBreak();
            } else if (event.button === 2) {
                // Right click - place block
                this.handleBlockPlace();
            }
        }
    }
    
    handleBlockBreak() {
        const player = this.game.player;
        const origin = {
            x: player.position.x,
            y: player.position.y + player.eyeHeight,
            z: player.position.z
        };
        const direction = player.getLookDirection();
        
        const hit = this.game.physics.raycast(origin, direction, player.reachDistance, this.game.world);
        
        if (hit && hit.hit) {
            this.game.breakBlock(hit.position);
        }
    }
    
    handleBlockPlace() {
        const player = this.game.player;
        const origin = {
            x: player.position.x,
            y: player.position.y + player.eyeHeight,
            z: player.position.z
        };
        const direction = player.getLookDirection();
        
        const hit = this.game.physics.raycast(origin, direction, player.reachDistance, this.game.world);
        
        if (hit && hit.hit) {
            // Get the block to place from hotbar
            const heldItem = player.getHeldItem();
            const blockId = heldItem?.blockId || heldItem?.id;
            
            if (heldItem && blockId && heldItem.isBlock) {
                // Calculate placement position (adjacent to hit face)
                const placePos = {
                    x: hit.position.x + hit.normal.x,
                    y: hit.position.y + hit.normal.y,
                    z: hit.position.z + hit.normal.z
                };
                
                // Don't place inside player
                const playerBox = this.game.physics.getPlayerBoundingBox(
                    player.position, player.width, player.height
                );
                const blockBox = this.game.physics.getBlockBoundingBox(
                    placePos.x, placePos.y, placePos.z
                );
                
                if (!this.game.physics.checkAABBCollision(playerBox, blockBox)) {
                    this.game.placeBlock(placePos, blockId);
                    
                    // Decrease item count in survival
                    if (player.gameMode === 'survival') {
                        player.consumeItem();
                    }
                }
            }
        }
    }
    
    onMouseUp(event) {
        this.mouseButtons[event.button] = false;
        
        if (event.button === 0) {
            this.game.player.stopBreaking();
        }
    }
    
    onWheel(event) {
        if (this.isPointerLocked) {
            const delta = Math.sign(event.deltaY);
            let slot = this.game.player.selectedSlot + delta;
            
            // Wrap around
            if (slot < 0) slot = 8;
            if (slot > 8) slot = 0;
            
            this.game.player.selectedSlot = slot;
            this.game.uiManager.updateHotbar();
        }
    }
    
    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === document.getElementById('game-canvas');
    }
    
    onContextMenu(event) {
        event.preventDefault();
    }
    
    update(dt) {
        // Apply mouse movement to player rotation
        if (this.isPointerLocked && this.game.player) {
            const actualSensitivity = this.sensitivity * (this.game.uiManager?.settings?.sensitivity || 50) / 50;
            
            this.game.player.rotation.y -= this.mouseDelta.x * actualSensitivity;
            this.game.player.rotation.x -= this.mouseDelta.y * actualSensitivity;
            
            // Clamp vertical rotation
            this.game.player.rotation.x = Math.max(
                -Math.PI / 2 + 0.01,
                Math.min(Math.PI / 2 - 0.01, this.game.player.rotation.x)
            );
        }
        
        // Reset mouse delta
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }
    
    // Check if a key is currently pressed
    isKeyPressed(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    // Check if a mouse button is pressed
    isMouseButtonPressed(button) {
        return this.mouseButtons[button] === true;
    }
    
    // Get movement vector based on pressed keys
    getMovementVector() {
        const movement = { x: 0, z: 0 };
        
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            movement.z -= 1;
        }
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            movement.z += 1;
        }
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            movement.x -= 1;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            movement.x += 1;
        }
        
        // Normalize
        const length = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
        if (length > 0) {
            movement.x /= length;
            movement.z /= length;
        }
        
        return movement;
    }
    
    // Check if sprinting (Ctrl or double-tap W)
    isSprinting() {
        return this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
    }
    
    // Check if jumping
    isJumping() {
        return this.isKeyPressed('Space');
    }
    
    // Check if sneaking (Shift key - like Minecraft)
    isSneaking() {
        return this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
    }
    
    // Check if flying (creative mode)
    isFlying() {
        return this.doubleJumpDetected;
    }
    
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    }
}
