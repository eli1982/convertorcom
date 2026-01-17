// Main entry point for WebCraft
import { Game } from './engine/Game.js';
import { MenuManager } from './ui/MenuManager.js';
import { AudioManager } from './engine/AudioManager.js';
import { Settings } from './engine/Settings.js';

// Global game instance
let game = null;

// Initialize the application
async function init() {
    console.log('WebCraft initializing...');
    
    // Load settings
    Settings.load();
    
    // Initialize audio
    AudioManager.init();
    
    // Initialize menu system
    const menuManager = new MenuManager();
    menuManager.init();
    
    // Set up menu event handlers
    setupMenuHandlers(menuManager);
    
    console.log('WebCraft initialized successfully!');
}

function setupMenuHandlers(menuManager) {
    // Singleplayer button
    document.getElementById('singleplayer-btn').addEventListener('click', () => {
        menuManager.showMenu('world-menu');
    });
    
    // Multiplayer button
    document.getElementById('multiplayer-btn').addEventListener('click', () => {
        menuManager.showMenu('multiplayer-menu');
    });
    
    // Character creator button
    document.getElementById('character-btn').addEventListener('click', () => {
        menuManager.showMenu('character-menu');
        menuManager.initCharacterPreview();
    });
    
    // Options button
    document.getElementById('options-btn').addEventListener('click', () => {
        menuManager.showMenu('options-menu');
    });
    
    // Back buttons
    document.getElementById('back-to-main').addEventListener('click', () => {
        menuManager.showMenu('main-menu');
    });
    
    document.getElementById('back-to-worlds').addEventListener('click', () => {
        menuManager.showMenu('world-menu');
    });
    
    document.getElementById('back-from-multi').addEventListener('click', () => {
        menuManager.showMenu('main-menu');
    });
    
    document.getElementById('back-from-character').addEventListener('click', () => {
        menuManager.showMenu('main-menu');
    });
    
    document.getElementById('back-from-options').addEventListener('click', () => {
        menuManager.showMenu('main-menu');
    });
    
    // Create world button
    document.getElementById('create-world-btn').addEventListener('click', () => {
        menuManager.showMenu('create-world-menu');
    });
    
    // Start world button
    document.getElementById('start-world-btn').addEventListener('click', async () => {
        const worldName = document.getElementById('world-name').value || 'New World';
        const worldSeed = document.getElementById('world-seed').value || Math.random().toString(36).substring(7);
        const worldType = document.getElementById('world-type').value;
        const gameMode = document.getElementById('game-mode').value;
        
        await startGame({
            name: worldName,
            seed: worldSeed,
            type: worldType,
            mode: gameMode,
            multiplayer: false
        });
    });
    
    // Join server button - connect to shared server
    const DEFAULT_SERVER = 'localhost:4000';
    
    document.getElementById('join-server-btn').addEventListener('click', async () => {
        const playerName = document.getElementById('player-name').value.trim() || 'Steve';
        
        // Save player name for next time
        localStorage.setItem('webcraft_player_name', playerName);
        
        await startGame({
            name: 'Multiplayer World',
            multiplayer: true,
            playerName: playerName,
            serverAddress: DEFAULT_SERVER,
            mode: 'survival'
        });
    });
    
    // Load saved player name
    const savedName = localStorage.getItem('webcraft_player_name');
    if (savedName) {
        document.getElementById('player-name').value = savedName;
    }
    
    // Check server status when multiplayer menu opens
    document.getElementById('multiplayer-btn').addEventListener('click', () => {
        checkServerStatus(DEFAULT_SERVER);
    });
    
    async function checkServerStatus(address) {
        const statusEl = document.getElementById('server-status');
        const dotEl = statusEl.querySelector('.status-dot');
        const textEl = statusEl.querySelector('.status-text');
        
        dotEl.className = 'status-dot checking';
        textEl.textContent = 'Checking server...';
        
        try {
            const [host, port] = address.split(':');
            const ws = new WebSocket(`ws://${host}:${port || 3000}`);
            
            const timeout = setTimeout(() => {
                ws.close();
                dotEl.className = 'status-dot offline';
                textEl.textContent = 'Server offline';
            }, 3000);
            
            ws.onopen = () => {
                clearTimeout(timeout);
                dotEl.className = 'status-dot online';
                textEl.textContent = 'Server online - Ready to join!';
                ws.close();
            };
            
            ws.onerror = () => {
                clearTimeout(timeout);
                dotEl.className = 'status-dot offline';
                textEl.textContent = 'Server offline - Start the server first';
            };
        } catch (e) {
            dotEl.className = 'status-dot offline';
            textEl.textContent = 'Server offline';
        }
    }
    
    // Save options
    document.getElementById('save-options').addEventListener('click', () => {
        Settings.save();
        menuManager.showMenu('main-menu');
    });
    
    // Save character
    document.getElementById('save-character').addEventListener('click', () => {
        menuManager.saveCharacter();
        menuManager.showMenu('main-menu');
    });
    
    // Options range inputs
    setupRangeInputs();
    
    // Pause menu handlers
    document.getElementById('resume-btn').addEventListener('click', () => {
        if (game) game.resume();
    });
    
    document.getElementById('save-quit-btn').addEventListener('click', () => {
        if (game) {
            game.saveAndQuit();
            game = null;
        }
        menuManager.showMenu('main-menu');
        document.getElementById('game-container').classList.add('hidden');
    });
}

function setupRangeInputs() {
    const rangeInputs = [
        { id: 'render-distance', suffix: '' },
        { id: 'fov', suffix: '' },
        { id: 'sensitivity', suffix: '' },
        { id: 'music-volume', suffix: '%' },
        { id: 'sfx-volume', suffix: '%' }
    ];
    
    rangeInputs.forEach(({ id, suffix }) => {
        const input = document.getElementById(id);
        const display = document.getElementById(`${id}-value`);
        
        if (input && display) {
            input.addEventListener('input', () => {
                display.textContent = input.value + suffix;
                Settings.set(id.replace(/-/g, '_'), parseInt(input.value));
            });
        }
    });
}

async function startGame(options) {
    // Show loading screen
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('world-menu').classList.add('hidden');
    document.getElementById('create-world-menu').classList.add('hidden');
    document.getElementById('multiplayer-menu').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');
    
    try {
        // Create game instance
        game = new Game(options);
        
        // Initialize game with progress updates
        await game.init((progress, text) => {
            document.getElementById('loading-progress').style.width = `${progress}%`;
            document.getElementById('loading-text').textContent = text;
        });
        
        // Hide loading screen, show game
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // Start the game loop
        game.start();
        
        // Don't auto-request pointer lock - let user click canvas to lock
        // game.requestPointerLock();
        
    } catch (error) {
        console.error('Failed to start game:', error);
        document.getElementById('loading-text').textContent = 'Error: ' + error.message;
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for global access
window.WebCraft = { game: () => game };
