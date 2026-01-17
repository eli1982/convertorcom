
import { Node, Track, Stop } from './types';
import * as THREE from 'three';

export const GAME_CONFIG = {
  maxSpeed: 120,
  acceleration: 0.4,
  deceleration: 0.2,
  brakePower: 1.0,
  camHeight: 10,
  camDist: 25,
  TIME_SPEED_MULTIPLIER: 0.02, // Slower time (was 0.1)
  WEATHER_CYCLE_DURATION: 300000, // 5 minutes (was 60000)
};

export const MAP_NODES: Node[] = [
  { x: 0, z: 0 }, { x: 200, z: 0 }, { x: 200, z: 200 }, { x: 0, z: 200 },
  { x: -200, z: 200 }, { x: -200, z: 0 }, { x: -200, z: -200 }, { x: 0, z: -200 }, { x: 200, z: -200 },
  // Tram Wash Nodes
  { x: 0, z: -100 }, // Node 9: Wash Entrance (From Track 7 segment)
  { x: -70, z: -100 } // Node 10: Wash Exit (To Road/Track)

];

export const TRACKS: Track[] = [
  // Original Tracks
  { id: 0, from: 0, to: 1, length: 200 }, { id: 1, from: 1, to: 2, length: 200 },
  { id: 2, from: 2, to: 3, length: 200 }, { id: 3, from: 3, to: 0, length: 200 },
  { id: 4, from: 3, to: 4, length: 200 }, { id: 5, from: 4, to: 5, length: 200 },
  { id: 6, from: 5, to: 0, length: 200 }, { id: 7, from: 5, to: 6, length: 200 },
  { id: 8, from: 6, to: 7, length: 200 }, { id: 9, from: 7, to: 0, length: 200 },
  { id: 10, from: 7, to: 8, length: 200 }, { id: 11, from: 8, to: 1, length: 200 },

  // New Tracks to fix intersections and navigation
  // Center Spoke Outbounds
  { id: 12, from: 0, to: 3, length: 200 }, // Center -> Top
  { id: 13, from: 0, to: 5, length: 200 }, // Center -> Left
  // Track 14 REMOVED (Was 0->7) - Replaced by 17 + 20 sequence below

  // Left Edge Return Logic
  { id: 15, from: 5, to: 4, length: 200 }, // Left -> TopLeft
  { id: 16, from: 6, to: 5, length: 200 }, // BottomLeft -> Left

  // Tram Wash Loop & Southbound Main Line
  // All traffic from Center (0) to South (7) goes via Node 9 (0, -100).

  // 17: Center (0) -> Wash Junction (9) [Shared Path]
  { id: 17, from: 0, to: 9, length: 100 },

  // 18: Wash Junction (9) -> Wash (-70, -100) [Turn Right relative to track]
  { id: 18, from: 9, to: 10, length: 70 },

  // 19: Wash Exit -> Bottom Tracks
  { id: 19, from: 10, to: 6, length: 164 },

  // 20: Wash Junction (9) -> Main Line South (7) [Straight]
  { id: 20, from: 9, to: 7, length: 100 },

  // Missing Reverse Tracks for Bi-directional Travel
  { id: 21, from: 1, to: 0, length: 200 }, // Right -> Center (Reverse of 0)
  { id: 22, from: 2, to: 1, length: 200 }, // TopRight -> Right (Reverse of 1)
  { id: 23, from: 3, to: 2, length: 200 }, // Top -> TopRight (Reverse of 2)
  { id: 24, from: 4, to: 3, length: 200 }, // TopLeft -> Top (Reverse of 4)
  { id: 25, from: 7, to: 6, length: 200 }, // Bottom -> BottomLeft (Reverse of 8)
  { id: 26, from: 8, to: 7, length: 200 }, // BottomRight -> Bottom (Reverse of 10)
  { id: 27, from: 1, to: 8, length: 200 }, // Right -> BottomRight (Reverse of 11)
  { id: 28, from: 6, to: 10, length: 164 }, // BottomLeft -> Wash Exit (Reverse of 19 - Enter wash from bottom) - Wait, this might be tricky with wash logic.
  // Actually, Wash Exit (10) -> Bottom (6) is one way out.
  // Entering wash from bottom (6) would need to go to Wash Entrance (9) or Wash Exit (10).
  // Current Wash structure: 0->9->10->6.
  // To go North through wash: 6 -> 10 -> 9 -> 0?
  // Let's stick to the main grid requests first (1, 2, 10 reversals etc).
];

export const STOPS: Stop[] = [
  { id: 0, name: "Gare de l'Est", position: new THREE.Vector3(100, 0, 5) },
  { id: 1, name: "Place d'Italie", position: new THREE.Vector3(100, 0, 200) },
  { id: 2, name: "Bastille", position: new THREE.Vector3(0, 0, 100), rotation: -Math.PI / 2 },
  { id: 3, name: "Eiffel Tower", position: new THREE.Vector3(-100, 0, 0) },
  { id: 4, name: "Invalides", position: new THREE.Vector3(-200, 0, 100), rotation: Math.PI / 2 },
  { id: 5, name: "Montparnasse", position: new THREE.Vector3(-100, 0, 200) },
  { id: 6, name: "Louvre", position: new THREE.Vector3(200, 0, -100), rotation: Math.PI / 2 },
  { id: 7, name: "Opéra", position: new THREE.Vector3(100, 0, -200) },
  { id: 8, name: "Arc de Triomphe", position: new THREE.Vector3(-100, 0, -200) },
  { id: 9, name: "Trocadéro", position: new THREE.Vector3(-200, 0, -100), rotation: Math.PI / 2 },
];

// Custom sequence: 1,3,2,6,5,4,2,1,10,9,8,7 (using 0-based IDs)
export const ROUTE_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const MATERIALS = {
  asphalt: "#333333",
  grass: "#3a7e3a",
  tramBody: "#eeeeee",
  tramAccent: "#008080",
  tramGlass: "#88ccff",
  buildingStone: "#eaddcf",
  roof: "#555566",
  rail: "#888888",
  door: "#cccccc",
  doorVoid: "#111111",
};

export const LANDMARKS = [
  { type: 'Garage', x: 240, z: 100, label: '🏭' }, // Factory/Garage emoji
  { type: 'Wash', x: -35, z: -100, label: '🚿' }   // Shower/Wash emoji
];
