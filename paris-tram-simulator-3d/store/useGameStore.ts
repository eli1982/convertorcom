import { create } from 'zustand';
import { STOPS, ROUTE_IDS, TRACKS, MAP_NODES } from '../constants';
import { ScoreFloatingText } from '../types';
import * as THREE from 'three'; // Added this import for THREE.Vector3

// Mutable object for high-frequency updates (avoiding React state thrashing)
// Expanded to include track info for the highlighter system
export interface TramRealtimeData {
    x: number;
    z: number;
    rotation: number;
    currentTrackId: number;
    positionOnTrack: number;
    speed: number; // Added speed to the interface
    driverPosition: THREE.Vector3 | null; // Added driverPosition to the interface
}

export const tramRealtimeData: TramRealtimeData = {
    x: 0,
    z: 0,
    rotation: 0,
    currentTrackId: 0,
    positionOnTrack: 0,
    speed: 0, // Initialized speed
    driverPosition: null // Initialized driverPosition
};

export type SignalMode = 'STOP' | 'SLOW' | 'GO_STRAIGHT' | 'GO_LEFT' | 'GO_RIGHT';

export interface TrafficLightStatus {
    phase: 'RED' | 'YELLOW' | 'GREEN';
    axis: 'A' | 'B';
}

interface QueuedPassenger {
    id: number;
    isDisabled: boolean;
}

interface GameState {
    score: number;
    scoreFloatingTexts: ScoreFloatingText[];
    speed: number;
    passengers: number;
    nextStop: string;

    doorsOpen: boolean;
    driverDoorOpen: boolean;
    rampExtended: boolean;
    pantographUp: boolean;
    lightsOn: boolean;
    wipersOn: boolean;
    windowsOpen: boolean;
    eBrakeActive: boolean;

    indicatorLeft: boolean;
    indicatorRight: boolean;

    weather: 'Clear' | 'Rain' | 'Snow';
    traction: number;
    soapEffectEndTime: number; // Timestamp when soap effect ends

    // New Control States
    sunblindDown: boolean;
    engineOn: boolean;
    driverVisible: boolean;
    useGLBModel: boolean; // Toggle for GLB tram model

    // Time System
    timeOfDay: number; // 0.0 to 24.0

    currentPower: number; // For UI visualization only

    message: string | null;
    conductorMessage: string | null;
    conductorMessageExpiry: number;

    showMinimap: boolean;
    musicEnabled: boolean;
    viewDistance: number;

    // Navigation
    activeRouteIndex: number; // Index in the ROUTE_IDS array

    // Stop Management
    stopQueues: Record<number, QueuedPassenger[]>; // StopID -> Array of passenger data

    platformSide: 'left' | 'right' | null;
    minimapLabelMode: 'stations' | 'roads';

    // Actions
    setSpeed: (speed: number) => void;
    setPower: (power: number) => void;
    addScore: (amount: number, label?: string) => void;
    removeFloatingText: (id: number) => void;
    updatePassengers: (amount: number) => void;
    setNextStop: (name: string) => void;
    setPlatformSide: (side: 'left' | 'right' | null) => void;

    toggleDoors: () => void;
    toggleRamp: () => void;
    togglePantograph: () => void;
    toggleLights: () => void;
    toggleWipers: () => void;
    toggleWindows: () => void;
    toggleEBrake: () => void;
    toggleMinimap: () => void;
    setDoorsOpen: (open: boolean) => void;
    setDriverDoorOpen: (open: boolean) => void;
    setRampExtended: (extended: boolean) => void;
    setPantographUp: (up: boolean) => void;
    toggleMinimapLabelMode: () => void;
    toggleMusic: () => void;
    setViewDistance: (dist: number) => void;

    toggleSunblind: () => void;
    toggleEngine: () => void;
    toggleDriver: () => void;
    toggleGLBModel: () => void;

    setIndicator: (side: 'left' | 'right' | 'none') => void;
    setWeather: (weather: 'Clear' | 'Rain' | 'Snow') => void;
    setConductorMessage: (msg: string) => void;
    setTimeOfDay: (time: number) => void;

    hoveredObject: string | null;
    setHoveredObject: (name: string | null) => void;

    boardPassengers: (stopId: number) => number; // Returns number boarded
    advanceActiveStop: () => void;
    showMessage: (msg: string) => void;
    setSoapEffectEndTime: (time: number) => void;

    debugMode: boolean;
    toggleDebugMode: () => void;

    teleportTrackId: number | null;
    requestTeleport: (trackId: number) => void;
    clearTeleportRequest: () => void;

    // Traffic Light System
    trafficCycleTime: number; // 0 to 20 seconds
    getSignalMode: (trackId: number) => SignalMode;
    updateTrafficCycle: (delta: number) => void;
}

const CONDUCTOR_MESSAGES = {
    welcome: "Welcome aboard Tram 802! Follow the GPS arrows.",
    rain: "Watch the rails, they'll be slippery with this rain.",
    snow: "Snow detected. Reduce speed and braking distance.",
    clear: "Skies are clearing up. Have a pleasant drive.",
    boarding: "Passengers boarding. Mind the doors.",
    disabled_left: "I see a passenger in a wheelchair still waiting. We need the ramp!",
    perfect_stop: "Perfect stop alignment. Good job!",
};

export const useGameStore = create<GameState>((set, get) => ({
    score: 0,
    scoreFloatingTexts: [],
    speed: 0,
    passengers: 0,
    nextStop: 'Roaming',

    doorsOpen: true, // Initial State: Open (Driver outside)
    driverDoorOpen: true, // Initial State: Driver Door Open
    rampExtended: false,
    pantographUp: true,
    lightsOn: false,
    wipersOn: false,
    windowsOpen: false,
    eBrakeActive: false,

    indicatorLeft: false,
    indicatorRight: false,

    weather: 'Clear',
    traction: 1.0,
    soapEffectEndTime: 0,

    sunblindDown: false,
    engineOn: false, // Default off as requested? Or on? Let's default off so user has to start it? 
    // Wait, user said "Use key to switch engine on or off". 
    // If I default to false, they might think it's broken.
    // But explicit start is cool. Let's default false.
    driverVisible: false, // Initial State: Driver Outside
    useGLBModel: false, // Default to procedural model
    currentPower: 0,
    message: null,
    conductorMessage: CONDUCTOR_MESSAGES.welcome,
    conductorMessageExpiry: Date.now() + 8000,

    showMinimap: true,
    activeRouteIndex: 0,

    timeOfDay: 10.0, // Start at 10:00 AM

    musicEnabled: localStorage.getItem('musicEnabled') === 'true', // Default false
    viewDistance: 600, // Default to a reasonable medium value

    platformSide: null,
    minimapLabelMode: 'stations',

    stopQueues: STOPS.reduce((acc, stop) => {
        const count = Math.floor(Math.random() * 5) + 2;
        const people: QueuedPassenger[] = [];
        for (let i = 0; i < count; i++) {
            people.push({
                id: Math.random(),
                isDisabled: Math.random() < 0.25 // 25% chance disabled
            });
        }
        return { ...acc, [stop.id]: people };
    }, {}),

    setSpeed: (speed) => set({ speed }),
    setPower: (power) => set({ currentPower: power }),

    addScore: (amount, label) => set((state) => {
        const newText: ScoreFloatingText = {
            id: Date.now() + Math.random(),
            amount,
            label,
            x: 50 + (Math.random() * 10 - 5),
            y: 40,
            timestamp: Date.now()
        };
        return {
            score: state.score + amount,
            scoreFloatingTexts: [...state.scoreFloatingTexts, newText]
        };
    }),

    removeFloatingText: (id) => set((state) => ({
        scoreFloatingTexts: state.scoreFloatingTexts.filter(t => t.id !== id)
    })),

    updatePassengers: (amount) => set((state) => ({ passengers: Math.max(0, state.passengers + amount) })),
    setNextStop: (name) => set({ nextStop: name }),
    setPlatformSide: (side) => set({ platformSide: side }),

    toggleDoors: () => set((state) => {
        const newState = !state.doorsOpen;
        if (newState && state.nextStop !== 'Roaming') {
            set({
                conductorMessage: CONDUCTOR_MESSAGES.boarding,
                conductorMessageExpiry: Date.now() + 5000
            });
        }
        return {
            doorsOpen: newState,
            // Clear ramp warning if closing doors
            message: (!newState && state.message === "Extend Ramp (G) for disabled passenger!") ? null : state.message
        };
    }),
    toggleRamp: () => set((state) => ({ rampExtended: !state.rampExtended })),
    togglePantograph: () => set((state) => ({ pantographUp: !state.pantographUp })),
    toggleLights: () => set((state) => ({ lightsOn: !state.lightsOn })),
    toggleWipers: () => set((state) => ({ wipersOn: !state.wipersOn })),
    toggleWindows: () => set((state) => ({ windowsOpen: !state.windowsOpen })),
    toggleEBrake: () => set((state) => ({ eBrakeActive: !state.eBrakeActive })),
    toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
    setDoorsOpen: (open) => set({ doorsOpen: open }),
    setDriverDoorOpen: (open) => set({ driverDoorOpen: open }),
    setRampExtended: (extended) => set({ rampExtended: extended }),
    setPantographUp: (up) => set({ pantographUp: up }),
    toggleMinimapLabelMode: () => set((state) => ({
        minimapLabelMode: state.minimapLabelMode === 'stations' ? 'roads' : 'stations'
    })),

    toggleMusic: () => set((state) => {
        const newVal = !state.musicEnabled;
        localStorage.setItem('musicEnabled', String(newVal));
        return { musicEnabled: newVal };
    }),

    setViewDistance: (dist) => set({ viewDistance: dist }),

    setIndicator: (side) => set((state) => {
        if (side === 'left') return { indicatorLeft: !state.indicatorLeft, indicatorRight: false };
        if (side === 'right') return { indicatorRight: !state.indicatorRight, indicatorLeft: false };
        return { indicatorLeft: false, indicatorRight: false };
    }),

    setWeather: (weather) => set(() => {
        let traction = 1.0;
        let msg = CONDUCTOR_MESSAGES.clear;
        if (weather === 'Rain') { traction = 0.6; msg = CONDUCTOR_MESSAGES.rain; }
        if (weather === 'Snow') { traction = 0.4; msg = CONDUCTOR_MESSAGES.snow; }
        return {
            weather,
            traction,
            conductorMessage: msg,
            conductorMessageExpiry: Date.now() + 8000
        };
    }),

    setConductorMessage: (msg) => set({
        conductorMessage: msg,
        conductorMessageExpiry: Date.now() + 5000
    }),

    setTimeOfDay: (time) => set({ timeOfDay: time }),

    hoveredObject: null,
    setHoveredObject: (name) => set({ hoveredObject: name }),

    boardPassengers: (stopId) => {
        const state = get();
        const waitingQueue = state.stopQueues[stopId] || [];

        if (waitingQueue.length > 0) {
            const person = waitingQueue[0];
            if (person.isDisabled && !state.rampExtended) {
                set({
                    conductorMessage: CONDUCTOR_MESSAGES.disabled_left,
                    conductorMessageExpiry: Date.now() + 6000
                });
                set({ message: "Extend Ramp (G) for disabled passenger!" });
                return 0;
            }

            const newQueue = waitingQueue.slice(1);
            set((s) => ({
                stopQueues: { ...s.stopQueues, [stopId]: newQueue },
                passengers: s.passengers + 1,
                score: s.score + 10,
                // Clear warning if successful
                message: s.message === "Extend Ramp (G) for disabled passenger!" ? null : s.message
            }));

            const newText: ScoreFloatingText = {
                id: Date.now(),
                amount: 10,
                label: "Boarded",
                x: 50 + (Math.random() * 10 - 5),
                y: 40 + (Math.random() * 10 - 5),
                timestamp: Date.now()
            };
            set(s => ({ scoreFloatingTexts: [...s.scoreFloatingTexts, newText] }));

            return 1;
        }
        return 0;
    },

    advanceActiveStop: () => set((state) => ({
        activeRouteIndex: (state.activeRouteIndex + 1) % ROUTE_IDS.length
    })),

    showMessage: (msg) => {
        set({ message: msg });
        setTimeout(() => set({ message: null }), 3000);
    },

    setSoapEffectEndTime: (time) => set({ soapEffectEndTime: time }),

    debugMode: false,
    toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),

    teleportTrackId: null,
    requestTeleport: (trackId) => set({ teleportTrackId: trackId }),
    clearTeleportRequest: () => set({ teleportTrackId: null }),

    // New Controls
    toggleSunblind: () => set((state) => ({ sunblindDown: !state.sunblindDown })),
    toggleEngine: () => set((state) => ({ engineOn: !state.engineOn })),
    toggleDriver: () => set((state) => {
        const newVisible = !state.driverVisible;
        return {
            driverVisible: newVisible,
            doorsOpen: false, // Ensure passenger doors are closed
            driverDoorOpen: !newVisible // Open driver door if driver is Out (visible=false), Close if In
        };
    }),
    toggleGLBModel: () => set((state) => ({ useGLBModel: !state.useGLBModel })),

    trafficCycleTime: 0,
    updateTrafficCycle: (delta) => set((state) => ({
        trafficCycleTime: (state.trafficCycleTime + delta) % 20
    })),
    getSignalMode: (trackId) => {
        const state = get();
        const t = state.trafficCycleTime;

        // Find the track to determine its direction
        const track = TRACKS.find(tr => tr.id === trackId);
        if (!track) return 'STOP';

        const start = MAP_NODES[track.from];
        const end = MAP_NODES[track.to];
        const dx = Math.abs(end.x - start.x);
        const dz = Math.abs(end.z - start.z);

        // Determine axis: A is North-South (mostly Z change), B is East-West (mostly X change)
        const axis = dz > dx ? 'A' : 'B';

        // Cycle: 20s total
        // 0-8: A Go, B Stop
        // 8-10: A Slow, B Stop
        // 10-18: A Stop, B Go
        // 18-20: A Stop, B Slow

        if (axis === 'A') {
            if (t < 8) return 'GO_STRAIGHT';
            if (t < 10) return 'SLOW';
            return 'STOP';
        } else {
            if (t < 10) return 'STOP';
            if (t < 18) return 'GO_STRAIGHT';
            if (t < 20) return 'SLOW';
            return 'STOP';
        }
    }
}));
