const { Icon, Section, Input, ColorInput } = window;

window.EditorSidebar = ({
  fileInputRef,
  loadConfig,
  triggerLoadConfig,
  saveConfig,
  apiKey,
  setApiKey,
  imageData,
  handleImageUpload,
  config,
  handleConfigChange,
  changedFields,
  versions,
  selectedVersion,
  loadVersion,
  deleteVersion,
  gameHtml,
  isGenerating,
  generateGame,
  openEditModal,
  setShowFogModal
}) => {
  return (
    <div className="w-[450px] flex flex-col border-r border-slate-800 bg-slate-900 h-full shadow-2xl z-10">
      {/* Hidden Input for Load Config */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={loadConfig} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header with Save/Load */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <Icon name="microchip" size={24} className="text-purple-500" />
          <h1 className="font-bold text-lg tracking-tight text-slate-100">GameForge AI</h1>
        </div>
        
        <div className="flex gap-2">
          <button onClick={triggerLoadConfig} title="Load Config" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-colors">
            <Icon name="upload" size={16} />
          </button>
          <button onClick={saveConfig} title="Save Config" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-colors">
            <Icon name="save" size={16} />
          </button>
          <div className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-800 ml-2">
            v1.1
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* API Key Section */}
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Gemini API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API Key here..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all"
          />
          <p className="text-[10px] text-slate-500 mt-1">Required to generate the game code.</p>
        </div>

        {/* Reference Image */}
        <Section title="Visual Reference" icon={<Icon name="image" size={16}/>}>
          <div className="relative group cursor-pointer border-2 border-dashed border-slate-700 rounded-lg hover:border-purple-500 transition-colors p-4 text-center bg-slate-900/50">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {imageData ? (
              <div className="relative h-32 w-full flex items-center justify-center overflow-hidden rounded">
                <img src={imageData.url} alt="Ref" className="object-cover h-full w-full opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-white">Change Image</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Icon name="image" size={24} />
                <span className="text-xs">Upload style reference (Optional)</span>
              </div>
            )}
          </div>
        </Section>

        {/* Game Versions Section */}
        <Section title="Game Versions" icon={<Icon name="history" size={16}/> }>
          <div className="max-h-32 overflow-y-auto">
            {versions.length === 0 ? (
              <span className="text-xs text-slate-500">No saved versions yet.</span>
            ) : (
              <ul className="space-y-1">
                {versions.map(v => (
                  <li key={v} className="flex items-center gap-1">
                    <button
                      className={`text-xs px-2 py-1 rounded flex-1 text-left ${selectedVersion === v ? 'bg-purple-900 text-purple-300' : 'bg-slate-800 text-slate-300 hover:bg-purple-800'}`}
                      onClick={() => loadVersion(v)}
                    >
                      {v.replace('.html', '')}
                    </button>
                    <button
                      onClick={() => deleteVersion(v)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
                      title="Delete this version"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* Core Settings */}
        <Section title="Core Concept" icon={<Icon name="layer-group" size={16}/>}>
          <Input label="Setting / Theme" value={config.SETTING} onChange={v => handleConfigChange('SETTING', v)} placeholder="e.g. Cyberpunk City" isChanged={changedFields.SETTING} />
          <Input label="Objective" value={config.OBJECTIVE} onChange={v => handleConfigChange('OBJECTIVE', v)} placeholder="e.g. collect" isChanged={changedFields.OBJECTIVE} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Target Count" value={config.TOTAL_TARGETS} onChange={v => handleConfigChange('TOTAL_TARGETS', v)} isChanged={changedFields.TOTAL_TARGETS} />
            <Input label="Target Name" value={config.ENEMIES} onChange={v => handleConfigChange('ENEMIES', v)} isChanged={changedFields.ENEMIES} />
          </div>
          <Input label="Start State" value={config.START_STATE} onChange={v => handleConfigChange('START_STATE', v)} isChanged={changedFields.START_STATE} />
          <Input label="End State" value={config.END_STATE} onChange={v => handleConfigChange('END_STATE', v)} isChanged={changedFields.END_STATE} />
        </Section>

        {/* Visuals */}
        <Section title="Atmosphere & Colors" icon={<Icon name="palette" size={16}/>}>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <ColorInput label="Start Sky" value={config.COLOR_SKY_START} onChange={v => handleConfigChange('COLOR_SKY_START', v)} isChanged={changedFields.COLOR_SKY_START} />
            <ColorInput label="Start Fog" value={config.COLOR_FOG_START} onChange={v => handleConfigChange('COLOR_FOG_START', v)} isChanged={changedFields.COLOR_FOG_START} />
            <ColorInput label="Start Light" value={config.COLOR_LIGHT_START} onChange={v => handleConfigChange('COLOR_LIGHT_START', v)} isChanged={changedFields.COLOR_LIGHT_START} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ColorInput label="End Sky" value={config.COLOR_SKY_END} onChange={v => handleConfigChange('COLOR_SKY_END', v)} isChanged={changedFields.COLOR_SKY_END} />
            <ColorInput label="End Fog" value={config.COLOR_FOG_END} onChange={v => handleConfigChange('COLOR_FOG_END', v)} isChanged={changedFields.COLOR_FOG_END} />
            <ColorInput label="End Light" value={config.COLOR_LIGHT_END} onChange={v => handleConfigChange('COLOR_LIGHT_END', v)} isChanged={changedFields.COLOR_LIGHT_END} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input label="Weather Effects" className="flex-1" value={config.WEATHER_EFFECTS} onChange={v => handleConfigChange('WEATHER_EFFECTS', v)} isChanged={changedFields.WEATHER_EFFECTS} />
            <button
              onClick={() => setShowFogModal(true)}
              className="mt-5 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
              title="Fog Settings"
            >
              <Icon name="sliders-h" size={12} />
              Fog
            </button>
          </div>
        </Section>

        {/* Gameplay */}
        <Section title="Combat & Controls" icon={<Icon name="crosshairs" size={16}/>}>
          <Input label="Weapon Name" value={config.WEAPON_TYPE} onChange={v => handleConfigChange('WEAPON_TYPE', v)} isChanged={changedFields.WEAPON_TYPE} />
          <div className="grid grid-cols-2 gap-2">
             <Input label="Weapon Shape" value={config.WEAPON_SHAPE} onChange={v => handleConfigChange('WEAPON_SHAPE', v)} isChanged={changedFields.WEAPON_SHAPE} />
             <ColorInput label="Weapon Color" value={config.WEAPON_MATERIAL_COLOR} onChange={v => handleConfigChange('WEAPON_MATERIAL_COLOR', v)} isChanged={changedFields.WEAPON_MATERIAL_COLOR} />
          </div>
           <div className="grid grid-cols-2 gap-2 mt-2">
             <Input label="Projectile Shape" value={config.PROJECTILE_MAIN_GEOMETRY} onChange={v => handleConfigChange('PROJECTILE_MAIN_GEOMETRY', v)} isChanged={changedFields.PROJECTILE_MAIN_GEOMETRY} />
             <ColorInput label="Projectile Color" value={config.PROJECTILE_COLOR} onChange={v => handleConfigChange('PROJECTILE_COLOR', v)} isChanged={changedFields.PROJECTILE_COLOR} />
          </div>
        </Section>

         {/* Roaming NPCs */}
        <Section title="Roaming NPCs" icon={<Icon name="otter" size={16}/>}>
          <Input label="Animals" value={config.NPC_ANIMALS} onChange={v => handleConfigChange('NPC_ANIMALS', v)} placeholder="e.g. Bunnies, Deer, Birds" isChanged={changedFields.NPC_ANIMALS} />
          <Input label="Behaviors" value={config.NPC_BEHAVIORS} onChange={v => handleConfigChange('NPC_BEHAVIORS', v)} placeholder="e.g. Hopping, Grazing, Flying" isChanged={changedFields.NPC_BEHAVIORS} />
          <Input label="Details" value={config.NPC_DETAILS} onChange={v => handleConfigChange('NPC_DETAILS', v)} placeholder="e.g. Peaceful creatures that flee" isChanged={changedFields.NPC_DETAILS} />
        </Section>

         {/* Enemies */}
        <Section title="Enemies & Logic" icon={<Icon name="ghost" size={16}/>}>
          <Input label="Enemy Shape" value={config.BODY_GEOMETRY} onChange={v => handleConfigChange('BODY_GEOMETRY', v)} isChanged={changedFields.BODY_GEOMETRY} />
          <Input label="Spawn Count" value={config.SPAWN_COUNT} onChange={v => handleConfigChange('SPAWN_COUNT', v)} isChanged={changedFields.SPAWN_COUNT} />
          <Input label="Behaviors" value={config.BEHAVIOR_STATES} onChange={v => handleConfigChange('BEHAVIOR_STATES', v)} isChanged={changedFields.BEHAVIOR_STATES} />
        </Section>

         {/* Environment */}
        <Section title="Environment Details" icon={<Icon name="cube" size={16}/>}>
           <div className="grid grid-cols-2 gap-2">
              <Input label="Wall Material" value={config.WALL_MATERIAL_TYPE} onChange={v => handleConfigChange('WALL_MATERIAL_TYPE', v)} isChanged={changedFields.WALL_MATERIAL_TYPE} />
              <Input label="Roof Type" value={config.ROOF_TYPE} onChange={v => handleConfigChange('ROOF_TYPE', v)} isChanged={changedFields.ROOF_TYPE} />
           </div>
           <Input label="Structure Details" className="mt-2" value={config.STRUCTURE_DETAILS} onChange={v => handleConfigChange('STRUCTURE_DETAILS', v)} placeholder="e.g. Ancient walls with glowing runes" isChanged={changedFields.STRUCTURE_DETAILS} />
           <Input label="Foliage Type" className="mt-2" value={config.FOLIAGE_GEOMETRY} onChange={v => handleConfigChange('FOLIAGE_GEOMETRY', v)} isChanged={changedFields.FOLIAGE_GEOMETRY} />
        </Section>

        {/* Free Text */}
        <Section title="Additional Instructions" icon={<Icon name="terminal" size={16}/>}>
           <textarea 
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all h-24 resize-none"
              value={config.USER_FREE_TEXT}
              onChange={(e) => handleConfigChange('USER_FREE_TEXT', e.target.value)}
              placeholder="Add specific instructions for logic, physics, or style..."
           />
        </Section>

      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
         
         {/* Secondary Action if Game Exists */}
         {gameHtml && !isGenerating && (
           <button 
             onClick={openEditModal}
             className="w-full py-2 rounded-md font-bold text-sm uppercase tracking-wide border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
           >
             <Icon name="edit" size={16} />
             Update Existing Game
           </button>
         )}

         <button 
          onClick={() => generateGame(false)}
          disabled={isGenerating}
          className={`w-full py-3 rounded-md font-bold text-sm uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all
            ${isGenerating 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
            }`}
         >
           {isGenerating ? (
             <>
              <Icon name="sync" size={16} className="fa-spin" />
              {gameHtml ? "Updating Game..." : "Generating Game..."}
             </>
           ) : (
             <>
              <Icon name="bolt" size={16} />
              {gameHtml ? "Regenerate New (Reset)" : "Generate Game"}
             </>
           )}
         </button>
      </div>
    </div>
  );
};
