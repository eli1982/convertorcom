// UI Manager - handles in-game UI updates
import { BlockRegistry } from '../blocks/BlockRegistry.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.settings = {};
        this.isInventoryOpen = false;
        this.isChatOpen = false;
        this.debugVisible = false;
    }
    
    init() {
        this.createHotbarSlots();
        this.createInventorySlots();
        this.createHealthHearts();
        this.createHungerIcons();
        this.setupChatInput();
    }
    
    createHotbarSlots() {
        const hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot' + (i === 0 ? ' selected' : '');
            slot.dataset.slot = i;
            hotbar.appendChild(slot);
        }
    }
    
    createInventorySlots() {
        const inventoryGrid = document.querySelector('.inventory-right .inventory-grid');
        if (!inventoryGrid) return;
        
        inventoryGrid.innerHTML = '';
        
        // Main inventory (27 slots)
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i + 9;
            inventoryGrid.appendChild(slot);
        }
        
        // Hotbar in inventory
        const hotbarGrid = document.querySelector('.inventory-right .hotbar-grid');
        if (hotbarGrid) {
            hotbarGrid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.dataset.slot = i;
                hotbarGrid.appendChild(slot);
            }
        }
    }
    
    createHealthHearts() {
        const healthBar = document.querySelector('#health-bar .hearts');
        if (!healthBar) return;
        
        healthBar.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.dataset.index = i;
            healthBar.appendChild(heart);
        }
    }
    
    createHungerIcons() {
        const hungerBar = document.querySelector('#hunger-bar .hunger');
        if (!hungerBar) return;
        
        hungerBar.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const hunger = document.createElement('div');
            hunger.className = 'hunger-icon';
            hunger.dataset.index = i;
            hungerBar.appendChild(hunger);
        }
    }
    
    setupChatInput() {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) return;
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    this.sendChatMessage(message);
                }
                chatInput.value = '';
                this.closeChat();
            } else if (e.key === 'Escape') {
                this.closeChat();
            }
        });
    }
    
    update() {
        this.updateHotbar();
        this.updateHealth();
        this.updateHunger();
        this.updateExperience();
        this.updateDebugInfo();
    }
    
    updateHotbar() {
        const player = this.game.player;
        if (!player || !player.inventory) return;
        
        const slots = document.querySelectorAll('#hotbar .hotbar-slot');
        
        slots.forEach((slot, index) => {
            // Update selection
            slot.classList.toggle('selected', index === player.selectedSlot);
            
            // Update item display
            const inventorySlot = player.inventory.getSlot(index);
            
            // Clear previous content
            slot.innerHTML = '';
            
            if (inventorySlot && inventorySlot.item) {
                // Create item icon
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.style.backgroundColor = this.getBlockColor(inventorySlot.item.blockId);
                slot.appendChild(icon);
                
                // Add count if > 1
                if (inventorySlot.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = inventorySlot.count;
                    slot.appendChild(count);
                }
            }
        });
    }
    
    updateHealth() {
        const player = this.game.player;
        if (!player) return;
        
        const hearts = document.querySelectorAll('.heart');
        const healthPoints = player.health;
        
        hearts.forEach((heart, index) => {
            const heartValue = (index + 1) * 2;
            
            if (healthPoints >= heartValue) {
                heart.className = 'heart';
            } else if (healthPoints >= heartValue - 1) {
                heart.className = 'heart half';
            } else {
                heart.className = 'heart empty';
            }
        });
    }
    
    updateHunger() {
        const player = this.game.player;
        if (!player) return;
        
        const hungerIcons = document.querySelectorAll('.hunger-icon');
        const hungerPoints = player.hunger;
        
        hungerIcons.forEach((icon, index) => {
            const iconValue = (index + 1) * 2;
            
            if (hungerPoints >= iconValue) {
                icon.className = 'hunger-icon';
            } else if (hungerPoints >= iconValue - 1) {
                icon.className = 'hunger-icon half';
            } else {
                icon.className = 'hunger-icon empty';
            }
        });
    }
    
    updateExperience() {
        const player = this.game.player;
        if (!player) return;
        
        const expProgress = document.getElementById('exp-progress');
        const expLevel = document.getElementById('exp-level');
        
        if (expProgress) {
            const expForNext = player.getExperienceForNextLevel();
            const progress = (player.experience / expForNext) * 100;
            expProgress.style.width = `${progress}%`;
        }
        
        if (expLevel) {
            expLevel.textContent = player.level;
        }
    }
    
    updateDebugInfo() {
        if (!this.debugVisible) return;
        
        const player = this.game.player;
        if (!player) return;
        
        const fps = document.getElementById('fps');
        const position = document.getElementById('position');
        const chunkInfo = document.getElementById('chunk-info');
        const biomeInfo = document.getElementById('biome-info');
        
        if (fps) {
            fps.textContent = `FPS: ${this.game.fps}`;
        }
        
        if (position) {
            position.textContent = `XYZ: ${player.position.x.toFixed(1)} / ${player.position.y.toFixed(1)} / ${player.position.z.toFixed(1)}`;
        }
        
        if (chunkInfo) {
            const chunkX = Math.floor(player.position.x / 16);
            const chunkZ = Math.floor(player.position.z / 16);
            chunkInfo.textContent = `Chunk: ${chunkX}, ${chunkZ}`;
        }
        
        if (biomeInfo) {
            const biome = this.game.world.getBiomeAt(player.position.x, player.position.z);
            biomeInfo.textContent = `Biome: ${biome}`;
        }
    }
    
    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        
        const inventoryScreen = document.getElementById('inventory-screen');
        if (inventoryScreen) {
            inventoryScreen.classList.toggle('hidden', !this.isInventoryOpen);
        }
        
        if (this.isInventoryOpen) {
            document.exitPointerLock();
            this.updateInventoryDisplay();
        } else {
            this.game.requestPointerLock();
        }
    }
    
    updateInventoryDisplay() {
        const player = this.game.player;
        if (!player || !player.inventory) return;
        
        // Update all inventory slots
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            const slotIndex = parseInt(slot.dataset.slot);
            const inventorySlot = player.inventory.getSlot(slotIndex);
            
            slot.innerHTML = '';
            
            if (inventorySlot && inventorySlot.item) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.style.backgroundColor = this.getBlockColor(inventorySlot.item.blockId);
                slot.appendChild(icon);
                
                if (inventorySlot.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = inventorySlot.count;
                    slot.appendChild(count);
                }
            }
        });
    }
    
    openChat() {
        this.isChatOpen = true;
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.classList.remove('hidden');
            chatInput.focus();
        }
        document.exitPointerLock();
    }
    
    closeChat() {
        this.isChatOpen = false;
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.classList.add('hidden');
            chatInput.blur();
        }
        this.game.requestPointerLock();
    }
    
    sendChatMessage(message) {
        if (message.startsWith('/')) {
            this.handleCommand(message);
        } else {
            this.addChatMessage('Player', message);
            
            // Send to server if multiplayer
            if (this.game.networkManager) {
                this.game.networkManager.sendChatMessage(message);
            }
        }
    }
    
    handleCommand(command) {
        const parts = command.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'gamemode':
            case 'gm':
                const mode = args[0];
                if (mode === 'creative' || mode === '1' || mode === 'c') {
                    this.game.player.gameMode = 'creative';
                    this.addSystemMessage('Game mode set to Creative');
                } else if (mode === 'survival' || mode === '0' || mode === 's') {
                    this.game.player.gameMode = 'survival';
                    this.addSystemMessage('Game mode set to Survival');
                }
                break;
                
            case 'tp':
            case 'teleport':
                if (args.length >= 3) {
                    const x = parseFloat(args[0]);
                    const y = parseFloat(args[1]);
                    const z = parseFloat(args[2]);
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        this.game.player.position = { x, y, z };
                        this.addSystemMessage(`Teleported to ${x}, ${y}, ${z}`);
                    }
                }
                break;
                
            case 'time':
                if (args[0] === 'set') {
                    const time = args[1];
                    if (time === 'day') {
                        this.game.world.time = 1000;
                    } else if (time === 'night') {
                        this.game.world.time = 13000;
                    } else {
                        const t = parseInt(time);
                        if (!isNaN(t)) {
                            this.game.world.time = t % 24000;
                        }
                    }
                    this.addSystemMessage(`Time set to ${this.game.world.time}`);
                }
                break;
                
            case 'give':
                if (args.length >= 1) {
                    const blockName = args[0];
                    const count = args[1] ? parseInt(args[1]) : 1;
                    const block = BlockRegistry.getBlockByName(blockName);
                    if (block) {
                        this.game.player.inventory.addItem({
                            id: block.id,
                            name: block.name,
                            isBlock: true,
                            blockId: block.id
                        }, count);
                        this.addSystemMessage(`Given ${count} ${block.name}`);
                    } else {
                        this.addSystemMessage(`Unknown block: ${blockName}`);
                    }
                }
                break;
                
            case 'clear':
                this.game.player.inventory.clear();
                this.addSystemMessage('Inventory cleared');
                break;
                
            case 'heal':
                this.game.player.health = this.game.player.maxHealth;
                this.game.player.hunger = this.game.player.maxHunger;
                this.addSystemMessage('Healed');
                break;
                
            case 'fly':
                this.game.player.isFlying = !this.game.player.isFlying;
                this.addSystemMessage(`Flying: ${this.game.player.isFlying}`);
                break;
                
            default:
                this.addSystemMessage(`Unknown command: ${cmd}`);
        }
    }
    
    addChatMessage(playerName, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-message player';
        msgElement.innerHTML = `<span class="player-name">&lt;${playerName}&gt;</span> ${message}`;
        chatMessages.appendChild(msgElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Auto-fade after 10 seconds
        setTimeout(() => {
            msgElement.style.opacity = '0';
            setTimeout(() => msgElement.remove(), 300);
        }, 10000);
    }
    
    addSystemMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-message system';
        msgElement.textContent = message;
        chatMessages.appendChild(msgElement);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => {
            msgElement.style.opacity = '0';
            setTimeout(() => msgElement.remove(), 300);
        }, 5000);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    showAchievement(title, description) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-popup';
        achievement.innerHTML = `
            <div class="achievement-icon"></div>
            <div class="achievement-text">
                <h4>Achievement Unlocked!</h4>
                <p>${title}</p>
            </div>
        `;
        document.body.appendChild(achievement);
        
        setTimeout(() => achievement.remove(), 5000);
    }
    
    toggleDebug() {
        this.debugVisible = !this.debugVisible;
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.classList.toggle('hidden', !this.debugVisible);
        }
    }
    
    getBlockColor(blockId) {
        const colorMap = {
            1: '#7F7F7F',  // Stone
            2: '#5A8F29',  // Grass
            3: '#8B6914',  // Dirt
            4: '#6F6F6F',  // Cobblestone
            5: '#BC9458',  // Oak Planks
            7: '#333333',  // Bedrock
            12: '#E6D596', // Sand
            13: '#8B8B83', // Gravel
            17: '#8B6914', // Oak Log
            18: '#2E8B2E', // Oak Leaves
            45: '#B04A30', // Bricks
            46: '#B03030', // TNT
            49: '#1A0A30', // Obsidian
            50: '#FFAA00', // Torch
            14: '#FFD700', // Gold Ore
            15: '#D4A574', // Iron Ore
            16: '#333333', // Coal Ore
            56: '#55FFFF', // Diamond Ore
            35: '#FFFFFF', // White Wool
        };
        
        return colorMap[blockId] || '#888888';
    }
}
