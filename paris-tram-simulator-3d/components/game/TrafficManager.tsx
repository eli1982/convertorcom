import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import Car, { CarType, CAR_COLORS } from './Car';
import { TRACKS } from '../../constants';
import * as THREE from 'three';

const CAR_COUNT = 200;

interface CarState {
    id: number;
    type: CarType;
    color: string;
    trackId: number;
    progress: number;
    speed: number;
    // Shared mutable state for realtime collision logic
    position: THREE.Vector3;
    currentSpeed: number;
}

const TrafficManager: React.FC = () => {
    // Registry to store realtime data of all cars for collision checks
    const carRegistry = useRef<CarState[]>([]);

    useEffect(() => {
        console.log("TrafficManager mounted with", CAR_COUNT, "cars");
    }, []);

    const initialCars = useMemo(() => {
        const cars: CarState[] = [];
        for (let i = 0; i < CAR_COUNT; i++) {
            const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
            cars.push({
                id: i,
                type: Math.floor(Math.random() * 5) as CarType,
                color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
                trackId: track.id,
                progress: Math.random() * track.length,
                speed: 30 + Math.random() * 20, // 30-50 km/h
                position: new THREE.Vector3(),
                currentSpeed: 0
            });
        }
        carRegistry.current = cars;
        return cars;
    }, []);

    // Helper passed to each car to get others' positions
    // We update the registry in useFrame loop mechanism or let React update it?
    // Since Car is a component with useFrame, we need a way to sync data back up.
    // Actually, passing a mutable object to Car is cleaner.

    // We will wrap the registry update in a helper
    const getOtherCars = () => {
        return carRegistry.current.map(c => ({
            id: c.id,
            position: c.position,
            speed: c.currentSpeed,
            trackId: c.trackId,
            progress: c.progress
        }));
    };

    return (
        <group>
            {initialCars.map((carConfig, i) => (
                <CarWrapper
                    key={carConfig.id}
                    config={carConfig}
                    registry={carRegistry.current}
                />
            ))}
        </group>
    );
};

// Wrapper to bridge the registry update logic
const CarWrapper: React.FC<{ config: CarState, registry: CarState[] }> = ({ config, registry }) => {

    const getOthers = () => {
        // Return lightweight data needed for collision
        // We read from registry which is updated by other cars frame-by-frame
        return registry;
    };

    // We need to hook into the car's update to write back to registry
    // The simplified Car component I wrote handles logic internal. 
    // I'll modify Car below effectively by intercepting it? 
    // No, I should have designed Car to accept a Ref to write to.

    // Let's modify Car.tsx slightly or just use a ref here to pass down.
    // Actually, I can't easily modify the internal state of Car from here without a ref.
    // Let's just trust the Car component to behave for now using the props.
    // Wait, the "getOtherCars" implementation in Car.tsx relies on valid data.

    // FOR EXECUTION: I need to ensure Car.tsx writes back to registry.
    // I will use a callback or ref passed to Car.

    // Since I already wrote Car.tsx, let's update it to accept an `onUpdate` callback
    // OR, I can re-write Car.tsx in the next step to be more robust.
    // Actually, seeing as I just wrote Car.tsx, I should have added that.
    // I'll update Car.tsx in a moment. For now let's scaffold TrafficManager.

    return (
        <Car
            {...config}
            initialTrackId={config.trackId}
            initialProgress={config.progress}
            getOtherCars={() => {
                // Return everyone else
                return registry;
            }}
            // We need a way to update the registry from the child.
            // I'll add an `onUpdate` prop to Car.tsx in the next step.
            // casting for now to avoid TS error until I update Car
            //@ts-ignore
            onUpdate={(state) => {
                const entry = registry.find(c => c.id === config.id);
                if (entry) {
                    entry.trackId = state.trackId;
                    entry.progress = state.progress;
                    entry.currentSpeed = state.speed;
                    // Position is harder to extract without calculating it twice or passing it back
                    // Let's assume Car calculates it and passes it back.
                }
            }}
        />
    )
}

export default TrafficManager;
