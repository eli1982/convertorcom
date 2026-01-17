
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stats } from '@react-three/drei';
import City from './components/game/City';
import Tram from './components/game/Tram';
import Weather from './components/game/Weather';
import Overlay from './components/ui/Overlay';
import BackgroundMusic from './components/game/BackgroundMusic';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-black" style={{height: '100vh', width: '100vw'}}>
      <BackgroundMusic />
      
      <Canvas shadows camera={{ fov: 60, position: [0, 10, 25] }}>
        <Stats />
        
        {/* Game World */}
        <City />
        <Tram />
        <Weather />
        
      </Canvas>
      
      <Overlay />
    </div>
  );
};

export default App;
