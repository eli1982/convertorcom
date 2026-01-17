# FPS 3D Action Game Prompt Template

## Core Concept
Create a **single HTML file** first-person 3D game where the player uses `[WEAPON_TYPE]` to `[OBJECTIVE: cure/defeat/collect]` `[TOTAL_TARGETS]` `[ENEMIES]` in a `[SETTING]` environment. Dynamic atmosphere transitions from `[START_STATE]` to `[END_STATE]` as progress is made.

## Tech Stack
- Three.js v0.160.0 + PointerLockControls + Reflector + EffectComposer/Bloom/RenderPass
- Single HTML with embedded ES6 modules
- Pointer Lock API, WebGL 2.0

---

## Visual System

### Colors (All customizable via `[COLOR_*]` placeholders)
**Atmosphere Transition:** Sky, fog, and light colors lerp from START to END states based on progress
- Start: `[COLOR_SKY_START]`, `[COLOR_FOG_START]`, `[COLOR_LIGHT_START]`
- End: `[COLOR_SKY_END]`, `[COLOR_FOG_END]`, `[COLOR_LIGHT_END]`
- Materials: Building, roof, natural, ground, enemies (3 types), corrupted state, indicator, projectile, decorations, liquid

### Rendering
- **Lighting:** Directional sun (0.5→1.5 intensity, shadow 2048x2048), ambient (0.5), point lights (optional)
- **Post-FX:** Bloom (threshold 0.2, strength 0.6→0, fades at 70% progress), ReinhardToneMapping
- **Fog:** Dense (5-25) → Clear (200-500), smooth transition
- **Weather:** `[WEATHER_EFFECTS]` - e.g., 1000 rain lines, velocity 20-30 down + 2-3 wind, opacity 0.6→0
- **Textures:** Procedural noise (256x256 canvas, 4000*scale random dots)

---

## Gameplay

### Victory & UI
- **Objective:** `[WIN_CONDITION]` `[TOTAL_TARGETS]` targets
- **Progress:** "`[PROGRESS_TEXT]`: X/[TOTAL]" (top center, Segoe UI bold 1.5rem, white + shadow)
- **Win:** "`[VICTORY_MESSAGE]`" in `[VICTORY_COLOR]`
- **Crosshair:** 4px white dot, 80% opacity, center screen
- **Instructions:** Black overlay (0.7 alpha), click to start

### Controls
- **Move:** `[WASD_KEYS]`, **Jump:** `[JUMP_KEY]`, **Look:** Mouse (pointer lock)
- **Attack:** `[PRIMARY_FIRE]` hold to charge (0-100%, `[CHARGE_SPEED]`/sec), release to fire (min `[MIN_CHARGE]`%)
- **Physics:** Accel 40, gravity 9.8, damping 10x, eye height 2.0, variable terrain

---

## Environment

### Terrain
- **Ground:** 80x80, subdivisions 128x128, procedural noise texture, ±0.3 height variation, shadows
- **Liquid Area (Optional):** `[LIQUID_POSITION]`, width `[LIQUID_WIDTH]`, depth `[LIQUID_DEPTH]`, translucent top layer + Reflector bottom (40% visibility), animated normals

### Main Structure (`[BUILDING_*]` dimensions)
- **Foundation + Body:** `[WALL_MATERIAL_TYPE]` with `[FRAME_TYPE]` at corners, beams
- **Extensions:** `[EXTENSION_COUNT]` sections at `[EXTENSION_SCALE]`x size
- **Roof:** `[ROOF_TYPE]` with `[ROOF_DETAILS]`
- **Chimney/Tower:** Height `[CHIMNEY_HEIGHT]`, particle emitter `[PARTICLE_TYPE]`
- **Entrance:** `[DOOR_WIDTH]`x`[DOOR_HEIGHT]`, handle, frame, steps
- **Windows:** Count `[WINDOW_COUNT]`, style `[WINDOW_STYLE]`, shutters `[SHUTTER_COLOR]`
- **Decorations:** Planters, random objects `[DECORATION_COLORS]`, path stones `[PATH_LENGTH]`
- **Lights:** `[LIGHT_COUNT]` `[LIGHT_TYPE]`, range `[LIGHT_RANGE]`
- **Collision:** Bounds + `[COLLISION_BUFFER]` buffer

### Environment Objects (`[TOTAL_OBJECTS]` total, `[ENVIRONMENT_OBJECT_TYPES]` types)
**Per Type:** Geometry `[FOLIAGE_GEOMETRY_*]`, trunk `[TRUNK_RADIUS]`x`[TRUNK_HEIGHT]`, branches `[BRANCH_COUNT]`, color `[OBJECT_COLOR_*]`, scale `[SCALE_MIN]`-`[SCALE_MAX]`
**Distribution:** Range `[MAP_RANGE_MIN]`-`[MAP_RANGE_MAX]`, avoid `[EXCLUSION_ZONES]`, collision radius tracking

### Props (Optional)
- **Animated Structure:** e.g., waterwheel (torus rims, axle, paddles, rotation speed)
- **Small Decorations:** e.g., mushroom patches (stem, cap, spots, clustered)
- **Stepping Stones:** Path elements across liquid areas
- **Particle Systems:** Smoke, steam, sparkles from chimneys/sources

---

## Enemies/Targets

### Enemy Types (`[ENEMY_TYPE_COUNT]` variations, each with):
- **Appearance:** Body `[BODY_GEOMETRY]` @ `[BODY_HEIGHT]`, secondary parts `[SECONDARY_PARTS]`, features `[DISTINCTIVE_FEATURES]` (geometry, positions), limbs `[LIMB_COUNT]`x`[LIMB_GEOMETRY]`, eyes `[EYE_SIZE]`
- **Behavior:** States `[BEHAVIOR_STATES]`, idle `[IDLE_MIN]`-`[IDLE_MAX]`s, speed `[MOVE_SPEED_NORMAL]`/`[MOVE_SPEED_AFFECTED]`, targeting `[TARGET_METHOD]`, range `[MOVEMENT_RANGE]`
- **Animation:** Type `[ANIMATION_TYPE]`, pattern `[ANIMATION_PATTERN]`, amplitude `[ANIM_AMPLITUDE]`, frequency `[ANIM_FREQUENCY]`/`[ANIM_FREQUENCY_AFFECTED]`, parts `[ANIMATED_PARTS]`
- **Spawn:** Count `[SPAWN_COUNT]`, positions `[SPAWN_POSITIONS]` or method `[SPAWN_METHOD]`

### Affected State
- **Visual:** Material `[AFFECTED_MATERIAL_COLOR]` (metalness `[AFFECTED_METALNESS]`, roughness `[AFFECTED_ROUGHNESS]`), indicators `[INDICATOR_COLOR]` @ `[INDICATOR_SIZE]`, store originals
- **Particles:** Emit `[PARTICLE_EMISSION_RATE]`%, geometry `[PARTICLE_GEOMETRY]`, size `[PARTICLE_SIZE]`, offset `[PARTICLE_OFFSET_Y]`, velocity `[PARTICLE_VELOCITY_PATTERN]`, lifetime `[PARTICLE_LIFETIME]`, fade `[PARTICLE_FADE_FORMULA]`
- **Behavior:** Speed `[AFFECTED_SPEED_MULTIPLIER]`x, animation `[AFFECTED_ANIMATION_MULTIPLIER]`x

### AI & Collision
- **Pathfinding:** Random target selection, collision checks (objects, obstacles, zones), 10 attempt limit, stop if blocked
- **Hit Detection:** Sphere check @ `[HIT_RADIUS]`, instant transform on hit
- **Transformation:** Restore materials, hide indicators, update score, stop particles, burst effect (50 particles, random velocity 3-7, lifetime 1.5s), restore normal behavior

---

## Combat

### FPS Weapon Rig (Camera → WeaponRig → Primary/Secondary Hand Groups)
- **Weapon:** Shape `[WEAPON_SHAPE]`, construction `[WEAPON_CONSTRUCTION_METHOD]`, size `[WEAPON_LENGTH]`x`[WEAPON_WIDTH]`, rotation `[WEAPON_ROTATION]`, color `[WEAPON_MATERIAL_COLOR]`
- **Dynamic Part:** Type `[DYNAMIC_PART_TYPE]`, points `[DYNAMIC_PART_POINTS]`, updates per frame, color `[DYNAMIC_PART_COLOR]`
- **Hands:** Rest `[PRIMARY_REST_POS]`/`[SECONDARY_REST_POS]`, charged `[SECONDARY_CHARGED_POS]`, interpolation `[INTERPOLATION_TYPE]`, clothing `[CLOTHING_COLOR]`, skin `[SKIN_COLOR]`
- **Charge Feedback:** Threshold `[SHAKE_THRESHOLD]`, effect `[CHARGE_EFFECT]`, amount `[SHAKE_AMOUNT]`, target `[SHAKE_TARGET]`

### Projectile
- **Geometry:** Body `[PROJECTILE_MAIN_GEOMETRY]`, tip `[PROJECTILE_TIP_GEOMETRY]`, trail `[PROJECTILE_TRAIL_GEOMETRY]`, color `[PROJECTILE_COLOR]` + emissive `[EMISSIVE_INTENSITY]`
- **Launch:** Spawn `[SPAWN_POINT]`, rotation `[SPAWN_ROTATION]`, speed = `[BASE_SPEED]` + charge*`[CHARGE_SPEED_BONUS]` (min `[MIN_PROJECTILE_SPEED]`, max `[MAX_PROJECTILE_SPEED]`)
- **Physics:** Gravity `[GRAVITY_STRENGTH]`, rotation `[ROTATION_UPDATE]`, lifetime `[PROJECTILE_LIFETIME]`, destroy on ground/hit/`[ADDITIONAL_DESTROY_CONDITIONS]`
- **Trail:** Emit every `[TRAIL_EMIT_INTERVAL]`s, count `[TRAIL_PARTICLE_COUNT]`, size `[TRAIL_PARTICLE_SIZE]`, offset `[TRAIL_OFFSET]`, color `[TRAIL_COLOR]`@`[TRAIL_OPACITY]`%, pattern `[TRAIL_VELOCITY_PATTERN]`, drift `[TRAIL_DRIFT]`, lifetime `[TRAIL_LIFETIME]`, fade `[TRAIL_FADE_FORMULA]`
- **Collision:** Method `[COLLISION_METHOD]`, radius `[HIT_RADIUS]`, effect `[HIT_EFFECT_METHOD]`(), particle `[HIT_PARTICLE_EFFECT]`

---

## Atmosphere Transition

**Progress System:** target = score/total, smooth interpolation (speed 1/10), updates per frame
**Lerp (0→1):** Sky/fog/light colors START→END, fog distance 5-25→200-500, light intensity 0.5→1.5, bloom 0.6→0 (fade @70%), weather opacity 0.6→0 (@60%)

---

## Technical

### Renderer & Camera
- **Renderer:** Antialias, devicePixelRatio, shadows (PCFSoftShadowMap), tone mapping (Reinhard)
- **Camera:** FOV 60°, near 0.1, far 1000, init pos (15,2,15)
- **Shadows:** 2048x2048, bounds -30→30, far 50, bias -0.0001

### Optimization
- Delta clamp `min(getDelta(), 0.1)`, particle cleanup (opacity/life≤0), reverse loop splice
- Procedural textures: 256x256 canvas, noise dots, SRGB, wrapping
- Window resize: update aspect/size

### Audio (Optional)
- **SFX:** Charge sound, fire sound, hit sound, cure/defeat sound, weather loop, ambient transition
- **Music:** Start (minor/dark) → transition → end (major/bright)

---

## Customization Template

### Easy Modifications

**Game Parameters:**
```javascript
const TOTAL_ENEMIES = 8;  // How many animals to cure
const DRAW_SPEED = 3.0;   // How fast bow charges
const ARROW_MIN_SPEED = 10; // Base arrow speed
const ARROW_MAX_SPEED = 30; // Fully charged speed
const GRAVITY = -4.9;     // Arrow drop rate
const PLAYER_HEIGHT = 2.0; // Eye level above ground
const JUMP_VELOCITY = 5.0; // Jump strength
```

**Visual Style:**
```javascript
// Replace color constants at top
const COLOR_SKY_START = 0x1a2a3a;
const COLOR_SKY_END = 0x87CEEB;
const COLOR_FOG_START = 0x2a3a4a;
const COLOR_FOG_END = 0xFFD700;
// ... etc for all atmosphere colors
```

**Enemy Configuration:**
```javascript
const DEER_COUNT = 2;
const BUNNY_COUNT = 3;
const SQUIRREL_COUNT = 3;
const DEER_SPEED = 1.5;
const BUNNY_HOP_HEIGHT = 0.5;
const SQUIRREL_SPEED = 4.0;
```

**World Size:**
```javascript
const WORLD_SIZE = 80;  // Ground plane size
const TREE_COUNT = 48;  // Total trees
const RIVER_WIDTH = 6;  // Width of water
const RIVER_POSITION = 5.5; // X coordinate
```

**Building Customization:**
```javascript
// Modify cottage dimensions
const HOUSE_MAIN_SIZE = {x: 6, y: 4, z: 5};
const HOUSE_SIDE_SIZE = {x: 3, y: 3, z: 4};
const ROOF_HEIGHT = 4;
const CHIMNEY_HEIGHT = 5;
const WINDOW_COUNT = 4;
const DOOR_SIZE = {x: 1.2, y: 2.2};
```

---

## Image-Based Styling (Optional)

**Methods:**
1. **Direct Texture:** Load image via TextureLoader, apply to materials
2. **Color Extraction:** Sample image pixels → extract 5-10 dominant colors → apply to palette
3. **Style Derivation:** Analyze shapes/proportions → modify geometry dimensions
4. **Mood Sampling:** Brightness→fog, temperature→lighting, weather→particles

**Implementation:** Canvas getImageData, sample regions, convert RGB to THREE.Color, apply to scene

---

## Usage

1. **Fill placeholders** with your game specifics (theme, weapon, enemies, colors, world size, etc.)
2. **Provide to LLM:** "Create a single HTML file implementing this game as described"
3. **Modify:** "Change [X] to [Y]", "Add [feature]", "Make [component] [modification]"
4. **Style from image:** "Use [url] to derive color palette/building style/textures/mood"

**Quick Examples:**
- Western: Revolver, bandits, desert saloon, tumbleweeds
- Space: Laser rifle, aliens, station, asteroids  
- Fantasy: Staff, demons, tower, crystals
- Post-apocalypse: Crossbow, zombies, ruins, debris

---

*Complete template for FPS 3D action game - all mechanics, visuals, behaviors, and technical details specified via `[PLACEHOLDERS]`*
