// Game Prompt Template for FPS 3D Action Game Generation
window.MASTER_TEMPLATE = `# FPS 3D Action Game Prompt Template

## Core Concept
Create a **single HTML file** first-person 3D game where the player uses [WEAPON_TYPE] to [OBJECTIVE] [TOTAL_TARGETS] [ENEMIES] in a [SETTING] environment. Dynamic atmosphere transitions from [START_STATE] to [END_STATE] as progress is made.

## Tech Stack
- Three.js v0.160.0 + PointerLockControls + Reflector + EffectComposer/Bloom/RenderPass
- Single HTML with embedded ES6 modules
- Pointer Lock API, WebGL 2.0

---

## Visual System

### Colors
**Atmosphere Transition:** Sky, fog, and light colors lerp from START to END states based on progress
- Start: [COLOR_SKY_START], [COLOR_FOG_START], [COLOR_LIGHT_START]
- End: [COLOR_SKY_END], [COLOR_FOG_END], [COLOR_LIGHT_END]
- Materials: Building, roof, natural, ground, enemies (3 types), corrupted state, indicator, projectile, decorations, liquid

### Rendering
- **Lighting:** Directional sun (0.5->1.5 intensity), ambient (0.5)
- **Post-FX:** Bloom (threshold 0.2, strength 0.6->0, fades at 70% progress)
- **Fog:** [FOG_ENABLED] ? Near:[FOG_NEAR] Far:[FOG_FAR] Opacity:[FOG_OPACITY] transition from dense to clear : No fog
- **Weather:** [WEATHER_EFFECTS]
- **Textures:** Procedural noise

---

## Gameplay

### Victory & UI
- **Objective:** [WIN_CONDITION] [TOTAL_TARGETS] targets
- **Progress:** "[PROGRESS_TEXT]: X/[TOTAL]" (top center, Segoe UI bold 1.5rem, white + shadow)
- **Win:** "[VICTORY_MESSAGE]" in [VICTORY_COLOR]
- **Controls:** [WASD_KEYS] to Move, [JUMP_KEY] to Jump, Mouse to Look.
- **Attack:** [PRIMARY_FIRE] hold to charge, release to fire.
- **Physics:** Accel 40, gravity 9.8, eye height 2.0

---

## Environment

### Terrain
- **Ground:** 80x80, procedural noise texture
- **Liquid:** [LIQUID_POSITION], width [LIQUID_WIDTH]
- **Structure:** [WALL_MATERIAL_TYPE] structure with [ROOF_TYPE] roof.
- **Structure Details:** [STRUCTURE_DETAILS]
- **Decorations:** [DECORATION_COLORS] random objects.

### Environment Objects
**Type:** [FOLIAGE_GEOMETRY]
**Colors:** [OBJECT_COLOR]

---

## Roaming NPCs

### Ambient Wildlife
- **Animals:** [NPC_ANIMALS]
- **Behaviors:** [NPC_BEHAVIORS]
- **Details:** [NPC_DETAILS]

---

## Enemies/Targets

### Enemy Types
- **Appearance:** [BODY_GEOMETRY] body.
- **Behavior:** [BEHAVIOR_STATES].
- **Movement:** Speed [MOVE_SPEED_NORMAL].
- **Spawn:** Count [SPAWN_COUNT].

### AI & Collision
- **Pathfinding:** Random target selection
- **Hit Detection:** Sphere check, instant transform on hit

---

## Combat

### FPS Weapon Rig
- **Weapon:** [WEAPON_SHAPE] shape, [WEAPON_MATERIAL_COLOR] color.
- **Projectile:** [PROJECTILE_MAIN_GEOMETRY] geometry, [PROJECTILE_COLOR] color.
- **Effect:** [CHARGE_EFFECT] on charge.

---

## Atmosphere Transition
**Progress System:** target = score/total.
**Lerp:** Sky/fog/light colors START->END.

## Custom Instructions
[USER_FREE_TEXT]
`;

window.DEFAULT_CONFIG = {
  // Core
  WEAPON_TYPE: "Magic Staff",
  OBJECTIVE: "cleanse",
  TOTAL_TARGETS: "10",
  ENEMIES: "Corrupted Spirits",
  SETTING: "Mystic Forest",
  START_STATE: "Dark & Stormy",
  END_STATE: "Sunny & Peaceful",
  
  // Visuals - Start
  COLOR_SKY_START: "#1a1a2e",
  COLOR_FOG_START: "#16213e",
  COLOR_LIGHT_START: "#0f3460",
  
  // Visuals - End
  COLOR_SKY_END: "#87CEEB",
  COLOR_FOG_END: "#FFFFFF",
  COLOR_LIGHT_END: "#FFFACD",

  // Fog Settings
  FOG_ENABLED: true,
  FOG_NEAR: 10,
  FOG_FAR: 200,
  FOG_OPACITY: 0.8,

  // Weather
  WEATHER_EFFECTS: "Heavy consistent rain with thunder",

  // UI
  WIN_CONDITION: "Purify",
  PROGRESS_TEXT: "Spirits Saved",
  VICTORY_MESSAGE: "FOREST RESTORED",
  VICTORY_COLOR: "#00ff00",
  
  // Controls
  WASD_KEYS: "WASD",
  JUMP_KEY: "Space",
  PRIMARY_FIRE: "Left Click",
  
  // Environment
  LIQUID_POSITION: "Center",
  LIQUID_WIDTH: "10",
  WALL_MATERIAL_TYPE: "Stone Brick",
  ROOF_TYPE: "Thatched",
  STRUCTURE_DETAILS: "Ancient stone walls with moss, arched doorways, mysterious glowing runes",
  DECORATION_COLORS: "Red, Blue, Purple",
  FOLIAGE_GEOMETRY: "Cone (Pine Trees)",
  OBJECT_COLOR: "#2d5a27",
  
  // Roaming NPCs
  NPC_ANIMALS: "Bunnies, Squirrels, Deer, Birds",
  NPC_BEHAVIORS: "Hopping, Scurrying, Grazing, Flying in circles",
  NPC_DETAILS: "Small peaceful creatures that flee when player approaches, add life to environment",
  
  // Enemies
  BODY_GEOMETRY: "Sphere",
  BEHAVIOR_STATES: "Idle, Chase, Flee",
  MOVE_SPEED_NORMAL: "3.0",
  SPAWN_COUNT: "15",
  
  // Combat
  WEAPON_SHAPE: "Cylinder",
  WEAPON_MATERIAL_COLOR: "#8B4513",
  PROJECTILE_MAIN_GEOMETRY: "Icosahedron",
  PROJECTILE_COLOR: "#00ffff",
  CHARGE_EFFECT: "Shake & Glow",

  // Extra
  USER_FREE_TEXT: "Ensure the movement feels floaty and magical.",
};
