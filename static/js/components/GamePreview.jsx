const { Icon } = window;

window.GamePreview = ({ gameHtml, isGenerating }) => {
  return (
    <div className="h-full w-full bg-black flex items-center justify-center relative">
      {gameHtml ? (
        <iframe 
          srcDoc={gameHtml} 
          className="w-full h-full border-none"
          title="Generated Game"
          sandbox="allow-scripts allow-pointer-lock allow-same-origin"
        />
      ) : (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto">
            <Icon name="play" size={32} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-300">No Game Generated</h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              Configure your game settings on the left, add an API key, and click "Generate Game" to compile a playable 3D experience.
            </p>
          </div>
        </div>
      )}
      
      {/* Overlay loader if regenerating */}
      {isGenerating && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-purple-400 font-mono animate-pulse">Compiling Shaders & Logic...</p>
        </div>
      )}
    </div>
  );
};
