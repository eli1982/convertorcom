
import { create } from 'zustand';
import { STOPS, ROUTE_IDS } from '../constants';
import { ScoreFloatingText } from '../types';

// Mutable object for high-frequency updates (avoiding React state thrashing)
// Expanded to include track info for the highlighter system
export const tramRealtimeData = {
    x: 0,
    z: 0,
    rotation: 0,
    currentTrackId: 0,
    positionOnTrack: 0
};

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

    // Time System
    timeOfDay: number; // 0.0 to 24.0

    currentPower: number; // For UI visualization only

    message: string | null;
    conductorMessage: string | null;
    conductorMessageExpiry: number;

    showMinimap: boolean;
    musicEnabled: boolean;

    // Navigation
    activeRouteIndex: number; // Index in the ROUTE_IDS array

    // Stop Management
    stopQueues: Record<number, QueuedPassenger[]>; // StopID -> Array of passenger data

    platformSide: 'left' | 'right' | null;

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
    toggleMusic: () => void;

    setIndicator: (side: 'left' | 'right' | 'none') => void;
    setWeather: (weather: 'Clear' | 'Rain' | 'Snow') => void;
    setConductorMessage: (msg: string) => void;
    setTimeOfDay: (time: number) => void;

    boardPassengers: (stopId: number) => number; // Returns number boarded
    advanceActiveStop: () => void;
    showMessage: (msg: string) => void;
    setSoapEffectEndTime: (time: number) => void;

    debugMode: boolean;
    toggleDebugMode: () => void;
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

    doorsOpen: false,
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
    currentPower: 0,
    message: null,
    conductorMessage: CONDUCTOR_MESSAGES.welcome,
    conductorMessageExpiry: Date.now() + 8000,

    showMinimap: true,
    activeRouteIndex: 0,

    timeOfDay: 10.0, // Start at 10:00 AM

    musicEnabled: localStorage.getItem('musicEnabled') === 'true', // Default false

    platformSide: null,

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

    toggleMusic: () => set((state) => {
        const newVal = !state.musicEnabled;
        localStorage.setItem('musicEnabled', String(newVal));
        return { musicEnabled: newVal };
    }),

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
    toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode }))
}));
