import * as THREE from 'three';

export interface Node {
    x: number;
    z: number;
}

export interface Track {
    id: number;
    from: number;
    to: number;
    length: number;
    name?: string;
}

export interface Stop {
    id: number;
    name: string;
    position: THREE.Vector3;
    rotation?: number; // Optional rotation in radians
}

export interface ScoreFloatingText {
    id: number;
    amount: number;
    label?: string; // Text description like "Nice Turn"
    x: number; // Screen percentage or pixel
    y: number;
    timestamp: number;
}

export interface GameState {
    score: number;
    speed: number;
    passengers: number;
    nextStop: string;

    doorsOpen: boolean;
    rampExtended: boolean;
    pantographUp: boolean;
    lightsOn: boolean;
    wipersOn: boolean;
    windowsOpen: boolean;

    indicatorLeft: boolean;
    indicatorRight: boolean;

    weather: 'Clear' | 'Rain' | 'Snow';
    traction: number;

    throttle: number;

    platformSide: 'left' | 'right' | null; // Detected side of the nearest platform
    conductorMessage: string;
    showMinimap: boolean;
}