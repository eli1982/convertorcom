
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';

// Verse: Cmaj7, Fmaj7, Am7, G (Standard Loop)
const VERSE_CHORDS = [
    // Cmaj7 (C, E, G, B)
    [261.63, 329.63, 392.00, 493.88], 
    // Fmaj7 (F, A, C, E)
    [174.61, 220.00, 261.63, 329.63], 
    // Am7 (A, C, E, G)
    [220.00, 261.63, 329.63, 392.00], 
    // G (G, B, D)
    [196.00, 246.94, 293.66]
];

// Chorus: Fmaj7, G6, Em7, Am7
const CHORUS_CHORDS = [
    // Fmaj7
    [174.61, 220.00, 261.63, 329.63],
    // G6 (G, B, D, E)
    [196.00, 246.94, 293.66, 329.63],
    // Em7 (E, G, B, D)
    [164.81, 196.00, 246.94, 293.66],
    // Am7
    [220.00, 261.63, 329.63, 392.00]
];

const BackgroundMusic: React.FC = () => {
    const { musicEnabled } = useGameStore();
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const sequencerTimerRef = useRef<number | null>(null);
    
    // Counter tracks total measures played
    const measureCountRef = useRef(0);
    
    const oscillatorsRef = useRef<OscillatorNode[]>([]);
    const gainNodesRef = useRef<GainNode[]>([]);

    useEffect(() => {
        // Initialize Audio Context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.value = musicEnabled ? 0.2 : 0; // Low volume for background
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        const playChord = () => {
            if (!audioCtxRef.current || !masterGainRef.current) return;
            const now = audioCtxRef.current.currentTime;
            
            // Structure: Verse x2 (8 measures), Chorus x2 (8 measures) = 16 measures total loop
            const totalSteps = 16;
            const currentStep = measureCountRef.current % totalSteps;
            
            let chord: number[];
            
            // 0-7: Verse (2 loops of 4)
            if (currentStep < 8) {
                const chordIndex = currentStep % 4;
                chord = VERSE_CHORDS[chordIndex];
            } 
            // 8-15: Chorus (2 loops of 4)
            else {
                const chordIndex = currentStep % 4;
                chord = CHORUS_CHORDS[chordIndex];
            }

            // Release old notes
            oscillatorsRef.current.forEach((osc, i) => {
                const g = gainNodesRef.current[i];
                if (g) {
                    // Quick release
                    g.gain.cancelScheduledValues(now);
                    g.gain.setValueAtTime(g.gain.value, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                }
                osc.stop(now + 1.0);
            });

            oscillatorsRef.current = [];
            gainNodesRef.current = [];

            // Play new notes
            chord.forEach(freq => {
                const osc = audioCtxRef.current!.createOscillator();
                const gain = audioCtxRef.current!.createGain();
                
                osc.type = 'triangle'; // Smooth sound
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 1.0); // Slow attack (pad-like)
                gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0); // Decay

                osc.connect(gain);
                gain.connect(masterGainRef.current!);
                osc.start(now);

                oscillatorsRef.current.push(osc);
                gainNodesRef.current.push(gain);
            });

            // Advance sequence
            measureCountRef.current++;
        };

        // Start Loop
        const scheduleLoop = () => {
            playChord();
            // Schedule next chord in 4 seconds (roughly 60bpm 4/4 bar)
            sequencerTimerRef.current = window.setTimeout(scheduleLoop, 4000);
        };

        // Unlock AudioContext on user interaction
        const unlock = () => {
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        
        scheduleLoop();

        return () => {
            if (sequencerTimerRef.current) clearTimeout(sequencerTimerRef.current);
            oscillatorsRef.current.forEach(osc => osc.stop());
            audioCtxRef.current?.close();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // Effect to toggle volume based on store state
    useEffect(() => {
        if (masterGainRef.current && audioCtxRef.current) {
             if (musicEnabled) {
                 if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
                 masterGainRef.current.gain.setTargetAtTime(0.2, audioCtxRef.current.currentTime, 0.5);
             } else {
                 masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
             }
        }
    }, [musicEnabled]);

    return null;
};

export default BackgroundMusic;
