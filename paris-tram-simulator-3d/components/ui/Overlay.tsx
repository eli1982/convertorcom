
import React, { useEffect, useState, useRef } from 'react';
import { useGameStore, tramRealtimeData } from '../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { MAP_NODES, TRACKS, STOPS, ROUTE_IDS, LANDMARKS } from '../../constants';

// Dynamic Minimap Component
const Minimap: React.FC = () => {
    const tramRef = useRef<SVGCircleElement>(null);
    const lineRef = useRef<SVGLineElement>(null);
    const { activeRouteIndex, debugMode, minimapLabelMode, toggleMinimapLabelMode, requestTeleport } = useGameStore(useShallow(state => ({
        activeRouteIndex: state.activeRouteIndex,
        debugMode: state.debugMode,
        minimapLabelMode: state.minimapLabelMode,
        toggleMinimapLabelMode: state.toggleMinimapLabelMode,
        requestTeleport: state.requestTeleport
    })));
    const [hoveredStop, setHoveredStop] = useState<{ x: number, y: number, name: string } | null>(null);
    const [hoveredRoadId, setHoveredRoadId] = useState<number | null>(null);
    const [hoveredLandmark, setHoveredLandmark] = useState<{ x: number, z: number, name: string } | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 't' && !e.repeat && hoveredRoadId !== null) {
                requestTeleport(hoveredRoadId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hoveredRoadId, requestTeleport]);

    useEffect(() => {
        let rAF: number;
        const update = () => {
            const { x, z } = tramRealtimeData;

            if (tramRef.current) {
                tramRef.current.setAttribute('cx', x.toString());
                tramRef.current.setAttribute('cy', z.toString());
            }

            if (lineRef.current) {
                // Get the current target stop from the route sequence
                const targetStopId = ROUTE_IDS[activeRouteIndex];
                const targetStop = STOPS[targetStopId];

                if (targetStop) {
                    lineRef.current.setAttribute('x1', x.toString());
                    lineRef.current.setAttribute('y1', z.toString());
                    lineRef.current.setAttribute('x2', targetStop.position.x.toString());
                    lineRef.current.setAttribute('y2', targetStop.position.z.toString());
                }
            }

            rAF = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(rAF);
    }, [activeRouteIndex]);

    const activeStopId = ROUTE_IDS[activeRouteIndex];

    return (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[252px] h-[252px] bg-black/80 border-2 border-white/20 rounded-full overflow-visible opacity-90 backdrop-blur-md z-50 shadow-xl pointer-events-auto">
            <svg viewBox="-350 -350 700 700" className="w-full h-full p-4 rounded-full overflow-hidden" style={{ transform: 'rotate(180deg)' }}>
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
                    </marker>
                </defs>

                {/* Tracks */}
                {TRACKS.map(t => {
                    const s = MAP_NODES[t.from];
                    const e = MAP_NODES[t.to];
                    const mx = (s.x + e.x) / 2;
                    const mz = (s.z + e.z) / 2;

                    // Calculate offset to move text away from the line center
                    const dx = e.x - s.x;
                    const dz = e.z - s.z;
                    const len = Math.hypot(dx, dz) || 1;
                    const nx = dx / len;
                    const nz = dz / len;
                    // Perpendicular offset (approx 35 units)
                    const ox = -nz * 35;
                    const oz = nx * 35;

                    return (
                        <React.Fragment key={t.id}>
                            {/* Hit Area Line (Wider, Invisible) */}
                            <line
                                x1={s.x} y1={s.z} x2={e.x} y2={e.z}
                                stroke="transparent"
                                strokeWidth="60"
                                strokeLinecap="round"
                                className="cursor-pointer"
                                style={{ pointerEvents: 'auto' }}
                                onMouseEnter={() => setHoveredRoadId(t.id)}
                                onMouseLeave={() => setHoveredRoadId(null)}
                            />
                            {/* Visual Line */}
                            <line
                                x1={s.x} y1={s.z} x2={e.x} y2={e.z}
                                stroke={hoveredRoadId === t.id ? "#facc15" : "#555"}
                                strokeWidth="20"
                                strokeLinecap="round"
                                style={{ pointerEvents: 'none' }}
                            />
                            {(minimapLabelMode === 'roads' || debugMode) && (
                                <g transform={`rotate(180, ${mx + ox}, ${mz + oz})`}>
                                    <text
                                        x={mx + ox}
                                        y={mz + oz}
                                        fill={hoveredRoadId === t.id ? "#facc15" : (minimapLabelMode === 'roads' ? "#cbd5e1" : "#ff00ff")}
                                        fontSize={minimapLabelMode === 'roads' ? "24" : "28"}
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ pointerEvents: 'auto', textShadow: '0 0 4px #000, 0 0 2px #000', cursor: 'pointer' }}
                                        onMouseEnter={() => setHoveredRoadId(t.id)}
                                        onMouseLeave={() => setHoveredRoadId(null)}
                                    >
                                        R{t.id}
                                    </text>
                                    <text
                                        x={mx + ox}
                                        y={mz + oz + 20}
                                        fill="white"
                                        fontSize="32"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ pointerEvents: 'none', textShadow: '0 0 4px #000, 0 0 2px #000' }}
                                    >
                                        {(Math.abs(dx) > Math.abs(dz)) ? (dx > 0 ? "←" : "→") : (dz > 0 ? "↑" : "↓")}
                                    </text>
                                </g>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Guidance Line (Moving Arrows) */}
                <line
                    ref={lineRef}
                    stroke="#facc15"
                    strokeWidth="4"
                    strokeDasharray="10,10"
                    className="animate-dash-flow"
                    markerEnd="url(#arrow)"
                    style={{ pointerEvents: 'none', transform: 'rotate(180deg)' }}
                    opacity="0.8"
                />

                {/* Stops */}
                {minimapLabelMode === 'stations' && STOPS.map(s => (
                    <g
                        key={s.id}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onMouseEnter={() => setHoveredStop({ x: s.position.x, y: s.position.z, name: s.name })}
                        onMouseLeave={() => setHoveredStop(null)}
                    >
                        <circle
                            cx={s.position.x}
                            cy={s.position.z}
                            r="25"
                            fill={s.id === activeStopId ? "#facc15" : "#4ade80"}
                            stroke="white"
                            strokeWidth={s.id === activeStopId ? "3" : "1"}
                        />
                        <text
                            x={s.position.x}
                            y={s.position.z}
                            fill="black"
                            fontSize="42"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(180, ${s.position.x}, ${s.position.z})`}
                            style={{ pointerEvents: 'none' }}
                        >
                            {s.id + 1}
                        </text>
                    </g>
                ))}

                {/* Landmarks */}
                {LANDMARKS.map((l, i) => (
                    <g
                        key={`landmark-${i}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredLandmark({ x: l.x, z: l.z, name: l.type })}
                        onMouseLeave={() => setHoveredLandmark(null)}
                    >
                        {minimapLabelMode === 'stations' ? (
                            <text
                                x={l.x}
                                y={l.z}
                                fontSize="30"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(180, ${l.x}, ${l.z})`}
                                style={{ pointerEvents: 'none' }}
                            >
                                {l.label}
                            </text>
                        ) : (
                            <circle
                                cx={l.x}
                                cy={l.z}
                                r="12"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="2"
                                style={{ pointerEvents: 'none' }}
                            />
                        )}
                    </g>
                ))}

                {/* Tram Indicator */}
                <circle ref={tramRef} cx="0" cy="0" r="20" fill="#3b82f6" stroke="white" strokeWidth="3" style={{ pointerEvents: 'none' }} />
            </svg>

            {/* Mode Toggle */}
            <button
                onClick={toggleMinimapLabelMode}
                className="absolute right-0 top-0 bg-slate-900/90 hover:bg-slate-800 border border-white/20 rounded-full px-3 py-2 text-[10px] text-white font-bold transition-all pointer-events-auto z-[60] shadow-xl flex items-center gap-2 group transform translate-x-1/4 -translate-y-1/4"
            >
                <div className={`w-2 h-2 rounded-full ${minimapLabelMode === 'stations' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className="opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase">{minimapLabelMode}</span>
            </button>

            {/* Tooltip - Positioned absolutely relative to the map container */}
            {(hoveredStop || hoveredLandmark || hoveredRoadId !== null) && (
                <div
                    className="absolute bg-white text-black text-sm font-bold px-3 py-1.5 rounded shadow-xl pointer-events-none z-[100] whitespace-nowrap border border-gray-200"
                    style={{
                        top: hoveredStop
                            ? `${((-hoveredStop.y + 350) / 700) * 100}%`
                            : hoveredLandmark
                                ? `${((-hoveredLandmark.z + 350) / 700) * 100}%`
                                : (() => {
                                    const road = TRACKS.find(r => r.id === hoveredRoadId);
                                    if (!road) return '0%';
                                    const midZ = (MAP_NODES[road.from].z + MAP_NODES[road.to].z) / 2;
                                    return `${((-midZ + 350) / 700) * 100}%`;
                                })(),
                        left: hoveredStop
                            ? `${((-hoveredStop.x + 350) / 700) * 100}%`
                            : hoveredLandmark
                                ? `${((-hoveredLandmark.x + 350) / 700) * 100}%`
                                : (() => {
                                    const road = TRACKS.find(r => r.id === hoveredRoadId);
                                    if (!road) return '0%';
                                    const midX = (MAP_NODES[road.from].x + MAP_NODES[road.to].x) / 2;
                                    return `${((-midX + 350) / 700) * 100}%`;
                                })(),
                        transform: 'translate(-50%, -150%)'
                    }}
                >
                    {hoveredStop
                        ? hoveredStop.name
                        : hoveredLandmark
                            ? hoveredLandmark.name
                            : `${TRACKS.find(t => t.id === hoveredRoadId)?.name || `Road ${hoveredRoadId}`} (PRESS T)`}
                </div>
            )}

            <div className="absolute bottom-4 w-full text-center text-[10px] text-gray-400 font-bold tracking-widest pointer-events-none">LIVE MAP</div>

            <style>{`
                @keyframes dashFlow {
                    to { stroke-dashoffset: -20; }
                }
                .animate-dash-flow {
                    animation: dashFlow 1s linear infinite;
                }
             `}</style>
        </div>
    );
};

const Overlay: React.FC = () => {
    const {
        score, speed, passengers, nextStop, weather, timeOfDay,
        doorsOpen, rampExtended, pantographUp,
        indicatorLeft, indicatorRight, currentPower,
        message, conductorMessage, conductorMessageExpiry, scoreFloatingTexts, removeFloatingText,
        showMinimap, musicEnabled, toggleMusic, setTimeOfDay, setWeather,
        viewDistance, setViewDistance, useGLBModel, toggleGLBModel
    } = useGameStore(useShallow(state => ({
        score: state.score,
        speed: state.speed,
        passengers: state.passengers,
        nextStop: state.nextStop,
        weather: state.weather,
        timeOfDay: state.timeOfDay,
        doorsOpen: state.doorsOpen,
        rampExtended: state.rampExtended,
        pantographUp: state.pantographUp,
        lightsOn: state.lightsOn,
        wipersOn: state.wipersOn,
        windowsOpen: state.windowsOpen,
        eBrakeActive: state.eBrakeActive,
        indicatorLeft: state.indicatorLeft,
        indicatorRight: state.indicatorRight,
        currentPower: state.currentPower,
        message: state.message,
        conductorMessage: state.conductorMessage,
        conductorMessageExpiry: state.conductorMessageExpiry,
        scoreFloatingTexts: state.scoreFloatingTexts,
        removeFloatingText: state.removeFloatingText,
        showMinimap: state.showMinimap,
        musicEnabled: state.musicEnabled,
        toggleMusic: state.toggleMusic,
        setTimeOfDay: state.setTimeOfDay,
        setWeather: state.setWeather,
        viewDistance: state.viewDistance,
        setViewDistance: state.setViewDistance,
        useGLBModel: state.useGLBModel,
        toggleGLBModel: state.toggleGLBModel
    })));

    // Cleanup floating texts
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            scoreFloatingTexts.forEach(t => {
                if (now - t.timestamp > 1500) removeFloatingText(t.id);
            });
        }, 100);
        return () => clearInterval(interval);
    }, [scoreFloatingTexts, removeFloatingText]);

    const [showConductor, setShowConductor] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowConductor(Date.now() < conductorMessageExpiry);
        }, 500);
        return () => clearInterval(interval);
    }, [conductorMessageExpiry]);

    const adjustTime = (delta: number) => {
        let newTime = timeOfDay + delta;
        if (newTime >= 24) newTime -= 24;
        if (newTime < 0) newTime += 24;
        setTimeOfDay(newTime);
    };

    // Format time (HH:MM)
    const hours = Math.floor(timeOfDay);
    const minutes = Math.floor((timeOfDay - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 select-none font-sans overflow-hidden z-[1000]">

            {/* Minimap */}
            {showMinimap && <Minimap />}

            {/* Score Floaters */}
            {scoreFloatingTexts.map(text => (
                <div
                    key={text.id}
                    className="absolute font-bold text-2xl animate-float-up flex flex-col items-center"
                    style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        color: text.amount >= 0 ? '#4ade80' : '#ef4444',
                        textShadow: '2px 2px 0 #000'
                    }}
                >
                    <span>{text.amount > 0 ? '+' : ''}{text.amount}</span>
                    {text.label && <span className="text-sm text-white font-normal uppercase tracking-widest">{text.label}</span>}
                </div>
            ))}

            {/* Top HUD */}
            <div className="flex justify-between items-start w-full">
                <div className="flex gap-4 bg-black/60 backdrop-blur-md p-4 rounded-xl text-white border border-white/10 shadow-lg">
                    <StatBox label="Score" value={Math.floor(score).toString()} />
                    <StatBox label="km/h" value={Math.floor(Math.abs(speed)).toString()} />
                    <StatBox label="Passengers" value={passengers.toString()} />
                    <StatBox label="Next Stop" value={nextStop} />
                    <div className="border-l border-white/20 pl-4 flex flex-col items-center">
                        <div className="text-2xl font-bold text-white drop-shadow-sm font-mono leading-none">{timeStr}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">TIME</div>
                        <div className="flex gap-4 pointer-events-auto">
                            <button onClick={() => adjustTime(-1)} className="hover:text-yellow-400 active:scale-95 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                </svg>
                            </button>
                            <button onClick={() => adjustTime(1)} className="hover:text-yellow-400 active:scale-95 transition-transform">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                    {/* Music Toggle - Top Right */}
                    <div className="pointer-events-auto">
                        <button
                            onClick={toggleMusic}
                            className={`p-3 rounded-full border border-white/20 transition-all shadow-lg ${musicEnabled ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                            title="Toggle Music"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {musicEnabled ? (
                                    <>
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </>
                                ) : (
                                    <>
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <line x1="23" y1="9" x2="17" y2="15"></line>
                                        <line x1="17" y1="9" x2="23" y2="15"></line>
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>

                    <div
                        onClick={() => {
                            const types = ['Clear', 'Rain', 'Snow'] as const;
                            const next = types[(types.indexOf(weather) + 1) % types.length];
                            setWeather(next);
                        }}
                        className="pointer-events-auto bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl text-white border border-white/10 font-bold text-sm tracking-wider cursor-pointer hover:bg-black/70 active:scale-95 transition-all select-none"
                        title="Click to cycle weather"
                    >
                        WEATHER: <span className={weather === 'Clear' ? 'text-yellow-400' : 'text-blue-300'}>{weather.toUpperCase()}</span>
                    </div>

                    <div className="mt-2 pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col gap-1 w-[200px]">
                        <div className="flex justify-between text-xs text-white font-bold uppercase">
                            <span>View Dist</span>
                            <span>{viewDistance}m</span>
                        </div>
                        <input
                            type="range"
                            min="200"
                            max="2000"
                            step="50"
                            value={viewDistance}
                            onChange={(e) => setViewDistance(Number(e.target.value))}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* GLB Model Toggle */}
                    <div
                        onClick={toggleGLBModel}
                        className={`pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 font-bold text-xs tracking-wider cursor-pointer hover:bg-black/70 active:scale-95 transition-all select-none text-center ${useGLBModel ? 'text-green-400' : 'text-gray-400'}`}
                        title="Toggle between procedural and GLB tram model"
                    >
                        TRAM: {useGLBModel ? '3D MODEL' : 'PROCEDURAL'}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                {message && (
                    <div className="bg-red-600/70 text-white px-8 py-4 rounded-lg text-xl font-bold shadow-2xl backdrop-blur-sm animate-bounce border-2 border-red-400">
                        {message}
                    </div>
                )}
            </div>

            {/* Object Ttooltip */}
            {useGameStore.getState().hoveredObject && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 bg-black/80 text-white px-3 py-1 rounded border border-white/30 text-sm font-sans pointer-events-none z-[2000] backdrop-blur-md">
                    {useGameStore.getState().hoveredObject}
                </div>
            )}

            {/* Bottom Controls Help & Dashboard */}
            <div className="flex items-end justify-between w-full relative">
                <div className="bg-black/70 text-white p-4 rounded-lg text-xs pointer-events-auto max-w-xs backdrop-blur-sm border border-white/10">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <ControlKey keys="W/S" desc="Accel/Brake" />
                        <ControlKey keys="A/D" desc="Turn/Indicators" />
                        <ControlKey keys="SPACE" desc="Doors" />
                        <ControlKey keys="G" desc="Ramp" />
                        <ControlKey keys="P" desc="Pantograph" />
                        <ControlKey keys="H" desc="Bell" />
                        <ControlKey keys="C" desc="Lights" />
                        <ControlKey keys="B" desc="Wipers" />
                        <ControlKey keys="X" desc="Windows" />
                        <ControlKey keys="I" desc="Driver" />
                        <ControlKey keys="R" desc="Sunblind" />
                        <ControlKey keys="N" desc="E-Brake" />
                        <ControlKey keys="M" desc="Minimap" />
                        <ControlKey keys="T" desc="Teleport (on Map)" />
                        <ControlKey keys="Shift+D" desc="Debug" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 absolute left-1/2 -translate-x-1/2 bottom-5">
                    {/* Dashboard Panel */}
                    <div className="bg-slate-800/90 p-4 rounded-2xl border-2 border-slate-600 flex items-center gap-4 shadow-2xl min-h-[80px]">
                        <div className="relative flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border border-slate-500 ${indicatorLeft ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse' : 'bg-slate-700'}`} />
                            {indicatorLeft && <IndicatorLabel side="left" />}
                        </div>

                        <div className="text-white font-bold tracking-widest">TRAM 802</div>

                        <div className="relative flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border border-slate-500 ${indicatorRight ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse' : 'bg-slate-700'}`} />
                            {indicatorRight && <IndicatorLabel side="right" />}
                        </div>

                        <div className="flex flex-col gap-1 ml-4 border-l border-slate-600 pl-4">
                            {/* Status Lights: Grey when inactive */}
                            <StatusLight label="Doors" active={doorsOpen} color="bg-red-500" offColor="bg-gray-600" />
                            <StatusLight label="Ramp" active={rampExtended} color="bg-yellow-500" offColor="bg-gray-600" />
                            <StatusLight label="Power" active={pantographUp} color="bg-green-500" offColor="bg-gray-600" />
                        </div>
                    </div>

                    {/* Power Meter */}
                    <div className="w-72 h-3 bg-gray-900 border border-gray-600 rounded overflow-hidden relative">
                        <div
                            className={`absolute top-0 bottom-0 transition-all duration-100 ${currentPower > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{
                                left: currentPower > 0 ? '50%' : `${50 + (currentPower * 50)}%`,
                                width: `${Math.abs(currentPower * 50)}%`
                            }}
                        />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
                    </div>
                    <div className="text-[10px] text-gray-400 tracking-[0.2em] font-bold">MOTOR POWER</div>
                </div>

                {/* Conductor Panel */}
                <div className={`w-[300px] transition-all duration-500 transform ${showConductor ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} bg-blue-900/80 border-2 border-blue-400/50 rounded-tl-2xl p-4 text-white backdrop-blur-md shadow-lg flex flex-col gap-2`}>
                    <div className="flex items-center gap-3 border-b border-blue-400/30 pb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Conductor&clothing=graphicShirt&top=hat" alt="Conductor" />
                        </div>
                        <div>
                            <div className="font-bold text-sm">Conductor Jean</div>
                            <div className="text-[10px] text-blue-200 uppercase tracking-wide">Tram Operator</div>
                        </div>
                    </div>
                    <div className="text-sm italic leading-snug min-h-[3em]">
                        "{conductorMessage}"
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-50px) scale(1.2); opacity: 0; }
                }
                .animate-float-up {
                    animation: float-up 1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

const IndicatorLabel: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
    const trackId = tramRealtimeData.currentTrackId;
    const currentTrack = TRACKS.find(t => t.id === trackId);
    if (!currentTrack) return null;

    const s_curr = MAP_NODES[currentTrack.from];
    const e_curr = MAP_NODES[currentTrack.to];
    const curAngle = Math.atan2(e_curr.z - s_curr.z, e_curr.x - s_curr.x);

    const nextOptions = TRACKS.filter(t => t.from === currentTrack.to && t.to !== currentTrack.from); // Filter out reversal
    if (nextOptions.length === 0) return null;

    const choices = nextOptions.map(opt => {
        const os = MAP_NODES[opt.from];
        const oe = MAP_NODES[opt.to];
        const nextAngle = Math.atan2(oe.z - os.z, oe.x - os.x);
        let diff = nextAngle - curAngle;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        return { track: opt, diff };
    });

    // In our coordinate system (X right, Z down):
    // Positive diff = turn Right (Clockwise)
    // Negative diff = turn Left (Counter-Clockwise)
    let chosen;
    if (side === 'left') {
        // Pick most negative (left-most turn)
        choices.sort((a, b) => a.diff - b.diff);
        chosen = choices[0].track;
    } else {
        // Pick most positive (right-most turn)
        choices.sort((a, b) => b.diff - a.diff);
        chosen = choices[0].track;
    }

    const s = MAP_NODES[chosen.from];
    const e = MAP_NODES[chosen.to];
    const dx = e.x - s.x;
    const dz = e.z - s.z;
    // Matching 180deg rotated minimap logic: East(+X) -> ←, South(+Z) -> ↑
    const symbol = (Math.abs(dx) > Math.abs(dz)) ? (dx > 0 ? "←" : "→") : (dz > 0 ? "↑" : "↓");

    return (
        <div className="absolute top-full mt-1 flex flex-col items-center leading-none text-amber-400 font-bold drop-shadow-md">
            <span className="text-[10px]">R{chosen.id}</span>
            <span className="text-xs">{symbol}</span>
        </div>
    );
};

const StatBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-center mx-2">
        <div className="text-2xl font-bold text-yellow-400 drop-shadow-sm">{value}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
    </div>
);

const ControlKey: React.FC<{ keys: string, desc: string }> = ({ keys, desc }) => (
    <div><span className="font-bold text-cyan-400">{keys}</span> {desc}</div>
);

const StatusLight: React.FC<{ label: string, active: boolean, color: string, offColor?: string }> = ({ label, active, color, offColor = 'bg-gray-700' }) => {
    const bgClass = active ? color : offColor;

    return (
        <div className="flex items-center text-[10px] text-white uppercase">
            <span className={`w-3 h-3 rounded-full mr-2 ${bgClass} transition-colors shadow-sm`}></span>
            {label}
        </div>
    );
};

export default Overlay;
