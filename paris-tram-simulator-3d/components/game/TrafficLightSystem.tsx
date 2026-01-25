import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACKS, MAP_NODES } from '../../constants';
import { useGameStore } from '../../store/useGameStore';
import TramSignal from './TramSignal';

const ConnectedSignal = React.memo(({ id, trackId, position, rotation }: { id: any, trackId: number, position: [number, number, number], rotation: number }) => {
    // Select only the mode for this specific track. 
    // This ensures re-renders only happen when the signal light actually changes color/state.
    const mode = useGameStore(state => state.getSignalMode(trackId));

    return (
        <TramSignal
            position={position}
            rotation={rotation}
            mode={mode}
        />
    );
});

const TrafficLightSystem: React.FC = () => {
    const updateTrafficCycle = useGameStore(state => state.updateTrafficCycle);

    // Update the store time every frame. 
    // This drives the logic but doesn't force this component to re-render 
    // because we aren't selecting any state here.
    useFrame((_, delta) => {
        updateTrafficCycle(delta);
    });

    const signals = useMemo(() => {
        return TRACKS.map(track => {
            const start = MAP_NODES[track.from];
            const end = MAP_NODES[track.to];

            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const angle = Math.atan2(dz, dx);

            // Position signal slightly before the node
            // We want it to be visible to the driver.
            // 12 units before the node, 3.5 units to the right of track center.
            const dist = 12;
            const offset = 3.5;

            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            const posX = end.x - cosA * dist + sinA * offset;
            const posZ = end.z - sinA * dist - cosA * offset;

            return {
                id: track.id,
                trackId: track.id,
                position: [posX, 0, posZ] as [number, number, number],
                rotation: -angle - Math.PI / 2 // Face the approaching tram
            };
        });
    }, []);

    return (
        <group>
            {signals.map(s => (
                <ConnectedSignal
                    key={s.id}
                    id={s.id}
                    trackId={s.trackId}
                    position={s.position}
                    rotation={s.rotation}
                />
            ))}
        </group>
    );
};

export default TrafficLightSystem;
