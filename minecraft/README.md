# Minecraft Clone

A complete Minecraft clone built with Three.js, featuring:

## Features

- **Full 3D World Generation** - Procedural terrain with multiple biomes (plains, forest, desert, taiga, jungle, swamp, snowy)
- **Caves and Ore Generation** - Underground cave systems with coal, iron, gold, redstone, lapis, and diamond ores
- **Complete Block System** - 50+ block types including grass, stone, dirt, wood, leaves, ores, glass, and more
- **Procedural Textures** - All textures generated at runtime - no external assets needed
- **Day/Night Cycle** - Dynamic sky with sun position and lighting changes
- **Weather System** - Support for clear, rain, and thunderstorm weather
- **Player System**
  - WASD movement with sprint (Ctrl) and sneak (Shift)
  - Mouse look with pointer lock
  - Jumping and gravity physics
  - Health and hunger systems
  - Experience points
- **Inventory System** - 36 slots with hotbar quick select (1-9 keys)
- **Crafting System** - Full crafting recipes for tools, weapons, armor, and more
- **Multiplayer Support** - WebSocket-based multiplayer with chat
- **Character Creation** - Basic skin customization
- **Mob System** - Hostile mobs (Zombie, Skeleton, Creeper) and passive mobs (Pig, Cow, Sheep)
- **Commands** - Chat commands like /gamemode, /tp, /time, /give, /heal, /fly

## Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Space | Jump |
| Ctrl | Sprint |
| Shift | Sneak |
| Left Click | Break Block |
| Right Click | Place Block |
| 1-9 | Select Hotbar Slot |
| E | Open Inventory |
| T | Open Chat |
| Escape | Pause Menu |
| F3 | Debug Info |
| F | Toggle Fly Mode (Creative) |

## Quick Start

### Single Player

1. Double-click `play.bat` or run:
   ```
   node start_game.js
   ```

2. Open your browser to `http://localhost:8080`

3. Click "Singleplayer" and create a new world

### Multiplayer

1. Start the game server:
   ```
   cd server
   npm install
   npm start
   ```

2. Start the web server (in another terminal):
   ```
   node start_game.js
   ```

3. Open browser to `http://localhost:8080`

4. Click "Multiplayer" and connect to `localhost:3000`

## Project Structure

```
minecraft/
├── index.html           # Main HTML with menus and game container
├── play.bat            # Quick start script
├── start_game.js       # Static file server
├── package.json        # Project config
├── css/
│   ├── style.css       # Main styles
│   └── ui.css          # Game UI styles
├── js/
│   ├── main.js         # Entry point
│   ├── engine/         # Core engine
│   │   ├── Game.js
│   │   ├── Renderer.js
│   │   ├── Physics.js
│   │   ├── InputManager.js
│   │   ├── TextureManager.js
│   │   ├── Settings.js
│   │   ├── AudioManager.js
│   │   └── SaveManager.js
│   ├── world/          # World generation
│   │   ├── World.js
│   │   ├── Chunk.js
│   │   └── ChunkManager.js
│   ├── blocks/         # Block definitions
│   │   └── BlockRegistry.js
│   ├── entities/       # Player and mobs
│   │   ├── Player.js
│   │   └── EntityManager.js
│   ├── player/         # Inventory
│   │   └── Inventory.js
│   ├── multiplayer/    # Networking
│   │   └── NetworkManager.js
│   ├── crafting/       # Crafting recipes
│   │   └── CraftingManager.js
│   └── ui/             # User interface
│       ├── UIManager.js
│       └── MenuManager.js
└── server/             # Multiplayer server
    ├── server.js
    ├── package.json
    └── start_server.bat
```

## Technical Details

- **Rendering**: Three.js with WebGL
- **Physics**: Custom AABB collision detection
- **Chunks**: 16x256x16 block chunks with dynamic loading
- **Terrain**: Multi-octave Perlin noise with biome blending
- **Textures**: Canvas-based procedural generation
- **Networking**: WebSocket for multiplayer sync
- **Storage**: LocalStorage/IndexedDB for world saves

## Browser Requirements

- Modern browser with WebGL 2.0 support
- JavaScript ES6 module support
- Pointer Lock API support

Tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## License

MIT
