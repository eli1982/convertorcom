// Core Game Engine
import { Renderer } from './Renderer.js';
import { World } from '../world/World.js';
import { Player } from '../entities/Player.js';
import { Physics } from './Physics.js';
import { InputManager } from './InputManager.js';
import { ChunkManager } from '../world/ChunkManager.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';
import { TextureManager } from './TextureManager.js';
import { Inventory } from '../player/Inventory.js';
import { NetworkManager } from '../multiplayer/NetworkManager.js';
import { Settings } from './Settings.js';
import { UIManager } from '../ui/UIManager.js';
import { CraftingManager } from '../crafting/CraftingManager.js';
import { SaveManager } from './SaveManager.js';
import { EntityManager } from '../entities/EntityManager.js';

export class Game {
    constructor(options) {
        this.options = options;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        // Game components
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.physics = null;
        this.input = null;
        this.chunkManager = null;
        this.textureManager = null;
        this.networkManager = null;
        this.uiManager = null;
        this.craftingManager = null;
        this.saveManager = null;
        this.entityManager = null;
        
        // Other players in multiplayer
        this.otherPlayers = new Map();
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    async init(progressCallback) {
        progressCallback(5, 'Initializing renderer...');
        
        // Initialize Three.js renderer
        this.renderer = new Renderer(document.getElementById('game-canvas'));
        await this.renderer.init();
        
        progressCallback(15, 'Loading textures...');
        
        // Load textures
        this.textureManager = new TextureManager();
        await this.textureManager.loadAll();
        
        progressCallback(30, 'Registering blocks...');
        
        // Register all block types
        BlockRegistry.init(this.textureManager);
        
        progressCallback(40, 'Initializing physics...');
        
        // Initialize physics engine
        this.physics = new Physics();
        
        progressCallback(50, 'Creating world...');
        
        // Create or load world
        this.world = new World({
            seed: this.options.seed,
            type: this.options.type
        });
        
        // Initialize chunk manager
        this.chunkManager = new ChunkManager(this.world, this.renderer, this.textureManager);
        
        progressCallback(60, 'Generating terrain...');
        
        // Generate initial chunks around spawn
        await this.chunkManager.generateInitialChunks(0, 0, Settings.get('render_distance'));
        
        progressCallback(75, 'Creating player...');
        
        // Create player
        const spawnPos = this.world.getSpawnPosition();
        this.player = new Player({
            position: spawnPos,
            gameMode: this.options.mode || 'survival'
        });
        this.player.inventory = new Inventory();
        
        // Give starting items
        if (this.options.mode === 'creative') {
            this.player.inventory.giveCreativeItems();
        } else {
            this.player.inventory.giveStartingItems();
        }
        
        progressCallback(80, 'Setting up controls...');
        
        // Initialize input manager
        this.input = new InputManager(this);
        this.input.init();
        
        progressCallback(85, 'Initializing UI...');
        
        // Initialize UI manager
        this.uiManager = new UIManager(this);
        this.uiManager.init();
        
        // Initialize crafting manager
        this.craftingManager = new CraftingManager();
        
        // Initialize entity manager
        this.entityManager = new EntityManager(this);
        
        // Initialize save manager
        this.saveManager = new SaveManager(this.options.name);
        
        progressCallback(90, 'Setting up lighting...');
        
        // Setup lighting
        this.renderer.setupLighting();
        
        progressCallback(95, 'Connecting to server...');
        
        // Initialize multiplayer if needed
        if (this.options.multiplayer) {
            this.networkManager = new NetworkManager(this);
            await this.networkManager.connect(this.options.serverAddress, this.options.playerName);
        }
        
        progressCallback(100, 'Done!');
        
        console.log('Game initialized successfully');
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
        console.log('Game started');
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        this.isPaused = true;
        document.exitPointerLock();
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    resume() {
        this.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        this.requestPointerLock();
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent huge jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // Update FPS counter
        this.frameCount++;
        this.fpsTime += this.deltaTime;
        if (this.fpsTime >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        if (!this.isPaused) {
            // Update game state
            this.update(this.deltaTime);
        }
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    update(dt) {
        // Update input
        this.input.update(dt);
        
        // Update player
        this.player.update(dt, this.input, this.world, this.physics);
        
        // Update camera to follow player
        this.renderer.updateCamera(this.player);
        
        // Update chunks around player
        this.chunkManager.update(this.player.position);
        
        // Update world loading HUD
        this.updateWorldLoadingHUD();
        
        // Update world (day/night cycle, etc.)
        this.world.update(dt);
        this.renderer.updateSkyColor(this.world.getTimeOfDay());
        
        // Update entities
        this.entityManager.update(dt);
        
        // Update other players in multiplayer
        if (this.networkManager) {
            this.networkManager.update(dt);
            this.updateOtherPlayers(dt);
        }
        
        // Update UI
        this.uiManager.update();
    }
    
    updateWorldLoadingHUD() {
        const loadingHud = document.getElementById('world-loading-hud');
        if (!loadingHud) return;
        
        if (this.chunkManager.isWorldGenerating()) {
            loadingHud.classList.remove('hidden');
            const progress = this.chunkManager.getLoadingProgress();
            document.getElementById('world-loading-progress').style.width = `${progress}%`;
            document.getElementById('world-loading-percent').textContent = `${progress}%`;
        } else {
            loadingHud.classList.add('hidden');
        }
    }
    
    updateOtherPlayers(dt) {
        this.otherPlayers.forEach(player => {
            player.updateAnimation(dt);
        });
    }
    
    render() {
        // Render world
        this.renderer.render();
    }
    
    requestPointerLock() {
        const canvas = document.getElementById('game-canvas');
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }
    
    saveAndQuit() {
        // Save world data
        this.saveManager.saveWorld(this.world);
        this.saveManager.savePlayer(this.player);
        
        // Disconnect from server if multiplayer
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
        
        // Stop game loop
        this.stop();
        
        // Cleanup
        this.renderer.dispose();
        this.input.dispose();
    }
    
    // Block interaction methods
    placeBlock(position, blockType) {
        const chunk = this.chunkManager.getChunkAt(position.x, position.z);
        if (chunk) {
            this.world.setBlock(position.x, position.y, position.z, blockType);
            chunk.setDirty();
            
            // Notify server in multiplayer
            if (this.networkManager) {
                this.networkManager.sendBlockUpdate(position, blockType);
            }
        }
    }
    
    breakBlock(position) {
        const chunk = this.chunkManager.getChunkAt(position.x, position.z);
        if (chunk) {
            const blockType = this.world.getBlock(position.x, position.y, position.z);
            
            // Drop item
            if (this.options.mode !== 'creative') {
                // Spawn dropped item
                // TODO: Implement dropped items
            }
            
            this.world.setBlock(position.x, position.y, position.z, 0); // 0 = air
            chunk.setDirty();
            
            // Update adjacent chunks if on boundary
            this.chunkManager.updateAdjacentChunks(position);
            
            // Notify server in multiplayer
            if (this.networkManager) {
                this.networkManager.sendBlockUpdate(position, 0);
            }
        }
    }
}
