window.FogSettings = ({ show, onClose, config, handleConfigChange }) => {
  if (!show) return null;

  const { FOG_ENABLED, FOG_NEAR, FOG_FAR, FOG_OPACITY } = config;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="cloud" size={18} />
            Fog Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="times" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Enable Fog</label>
            <button
              onClick={() => handleConfigChange('FOG_ENABLED', !FOG_ENABLED)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                FOG_ENABLED ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  FOG_ENABLED ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Fog Near Distance */}
          <div className={FOG_ENABLED ? '' : 'opacity-40 pointer-events-none'}>
            <label className="text-sm font-medium text-slate-300 block mb-1">
              Near Distance: {FOG_NEAR}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={FOG_NEAR}
              onChange={(e) => handleConfigChange('FOG_NEAR', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              disabled={!FOG_ENABLED}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Close (1)</span>
              <span>Far (100)</span>
            </div>
          </div>

          {/* Fog Far Distance */}
          <div className={FOG_ENABLED ? '' : 'opacity-40 pointer-events-none'}>
            <label className="text-sm font-medium text-slate-300 block mb-1">
              Far Distance: {FOG_FAR}
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={FOG_FAR}
              onChange={(e) => handleConfigChange('FOG_FAR', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              disabled={!FOG_ENABLED}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Near (50)</span>
              <span>Very Far (1000)</span>
            </div>
          </div>

          {/* Fog Opacity */}
          <div className={FOG_ENABLED ? '' : 'opacity-40 pointer-events-none'}>
            <label className="text-sm font-medium text-slate-300 block mb-1">
              Opacity: {(FOG_OPACITY * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={FOG_OPACITY}
              onChange={(e) => handleConfigChange('FOG_OPACITY', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              disabled={!FOG_ENABLED}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Transparent (0%)</span>
              <span>Opaque (100%)</span>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800">
            <p className="text-xs text-slate-400 mb-2">Preview:</p>
            <div className="h-20 rounded relative overflow-hidden" style={{
              background: `linear-gradient(to top, ${config.COLOR_FOG_START} 0%, transparent 100%)`,
              opacity: FOG_ENABLED ? FOG_OPACITY : 0
            }}>
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                {FOG_ENABLED ? `Fog: ${FOG_NEAR} → ${FOG_FAR}` : 'Fog Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
