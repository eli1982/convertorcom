
import { Node, Track, Stop } from './types';
import * as THREE from 'three';

export const GAME_CONFIG = {
  maxSpeed: 60,
  acceleration: 1.0,
  deceleration: 0.5,
  brakePower: 3.0,
  eBrakePower: 40.0,
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
  { id: 0, from: 0, to: 1, length: 200, name: "Boulevard de Strasbourg" },
  { id: 1, from: 1, to: 2, length: 200, name: "Avenue d'Italie" },
  { id: 2, from: 2, to: 3, length: 200, name: "Rue de Rivoli" },
  { id: 3, from: 3, to: 0, length: 200, name: "Avenue de l'Opéra" },
  { id: 4, from: 3, to: 4, length: 200, name: "Champs-Élysées" },
  { id: 5, from: 4, to: 5, length: 200, name: "Boulevard Montparnasse" },
  { id: 6, from: 5, to: 0, length: 200, name: "Boulevard Saint-Germain" },
  { id: 7, from: 5, to: 6, length: 200, name: "Avenue de la Bourdonnais" },
  { id: 8, from: 6, to: 7, length: 200, name: "Avenue de Suffren" },
  { id: 9, from: 7, to: 0, length: 200, name: "Quai Branly" },
  { id: 10, from: 7, to: 8, length: 200, name: "Boulevard Haussmann" },
  { id: 11, from: 8, to: 1, length: 200, name: "Rue La Fayette" },

  // New Tracks to fix intersections and navigation
  // Center Spoke Outbounds
  { id: 12, from: 0, to: 3, length: 200, name: "Opéra Link" },
  { id: 13, from: 0, to: 5, length: 200, name: "St-Germain Link" },
  // Track 14 REMOVED

  // Left Edge Return Logic
  { id: 15, from: 5, to: 4, length: 200, name: "Montparnasse Return" },
  { id: 16, from: 6, to: 5, length: 200, name: "Bourdonnais Return" },

  // Tram Wash Loop & Southbound Main Line
  { id: 17, from: 0, to: 9, length: 100, name: "Depot Approach" },
  { id: 18, from: 9, to: 10, length: 70, name: "Wash Entrance" },
  { id: 19, from: 10, to: 6, length: 164, name: "Wash Exit" },
  { id: 20, from: 9, to: 7, length: 100, name: "South Main Link" },

  // Missing Reverse Tracks
  { id: 21, from: 1, to: 0, length: 200, name: "Strasbourg Reverse" },
  { id: 22, from: 2, to: 1, length: 200, name: "Italie Reverse" },
  { id: 23, from: 3, to: 2, length: 200, name: "Rivoli Reverse" },
  { id: 24, from: 4, to: 3, length: 200, name: "Champs-Élysées Reverse" },
  { id: 25, from: 7, to: 6, length: 200, name: "Suffren Reverse" },
  { id: 26, from: 8, to: 7, length: 200, name: "Haussmann Reverse" },
  { id: 27, from: 1, to: 8, length: 200, name: "La Fayette Reverse" },
  { id: 28, from: 6, to: 10, length: 164, name: "Wash Access" },
  { id: 29, from: 10, to: 9, length: 70, name: "Wash Return" },
  { id: 30, from: 9, to: 0, length: 100, name: "Depot Exit" },
  { id: 31, from: 7, to: 9, length: 100, name: "South Depot Link" },
];

export const STOPS: Stop[] = [
  { id: 0, name: "Gare de l'Est", position: new THREE.Vector3(100, 0, 5) },
  { id: 1, name: "Place d'Italie", position: new THREE.Vector3(100, 0, 195), rotation: Math.PI },
  { id: 2, name: "Bastille", position: new THREE.Vector3(5, 0, 100), rotation: Math.PI / 2 },
  { id: 3, name: "Eiffel Tower", position: new THREE.Vector3(-100, 0, 5) },
  { id: 4, name: "Invalides", position: new THREE.Vector3(-195, 0, 100), rotation: Math.PI / 2 },
  { id: 5, name: "Montparnasse", position: new THREE.Vector3(-100, 0, 195), rotation: Math.PI },
  { id: 6, name: "Louvre", position: new THREE.Vector3(195, 0, -100), rotation: -Math.PI / 2 },
  { id: 7, name: "Opéra", position: new THREE.Vector3(100, 0, -195) },
  { id: 8, name: "Arc de Triomphe", position: new THREE.Vector3(-100, 0, -195) },
  { id: 9, name: "Trocadéro", position: new THREE.Vector3(-195, 0, -100), rotation: Math.PI / 2 },
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
