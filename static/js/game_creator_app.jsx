const { useState, useEffect, useRef } = React;
const { MASTER_TEMPLATE, DEFAULT_CONFIG, EditorSidebar, TabNavigation, GamePreview, PromptPreview, SourceCodeView, EditInstructionsModal, FogSettings } = window;

function GameMakerApp() {
  const [activeTab, setActiveTab] = useState('editor'); // editor, preview, code
  // Load config from localStorage if available
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('gameConfig');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  // 1. Autofill API Key
  const [apiKey, setApiKey] = useState('AIzaSyCy9aSL-YVputv6gzHP_HOTvQ24pzlyyRE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameHtml, setGameHtml] = useState('');
  // Game versioning state
  const [gameId, setGameId] = useState(() => {
    let id = localStorage.getItem('gameId');
    if (!id) {
      id = Date.now().toString();
      localStorage.setItem('gameId', id);
    }
    return id;
  });
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  // Track changed config fields and original values
  const [originalConfig, setOriginalConfig] = useState(DEFAULT_CONFIG);
  const [changedFields, setChangedFields] = useState(() => {
    const saved = localStorage.getItem('gameConfig');
    if (!saved) return {};
    
    const currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    const changed = {};
    Object.keys(currentConfig).forEach(key => {
      if (currentConfig[key] !== DEFAULT_CONFIG[key]) {
        changed[key] = true;
      }
    });
    return changed;
  });
  // Edit instructions modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  // Fog settings modal state
  const [showFogModal, setShowFogModal] = useState(false);
  // Load stored image metadata if available
  const [imageData, setImageData] = useState(() => {
    try {
      const saved = localStorage.getItem('gameImageData');
      if (saved) {
        return JSON.parse(saved);
      }
      const legacyUrl = localStorage.getItem('gameImageUrl');
      return legacyUrl ? { url: legacyUrl } : null;
    } catch (err) {
      console.warn('Failed to parse stored image data', err);
      return null;
    }
  });
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Update generated prompt whenever config changes
  useEffect(() => {
    let prompt = MASTER_TEMPLATE;
    Object.keys(config).forEach(key => {
      const value = config[key];
      // Escape special regex chars if needed, but usually simple replace is fine for this
      prompt = prompt.split(`[${key}]`).join(value);
    });
    setGeneratedPrompt(prompt);
  }, [config]);

  const handleConfigChange = (key, value) => {
    // Track changed fields - do this first with current state
    if (String(value) !== String(originalConfig[key])) {
      setChangedFields(changes => ({ ...changes, [key]: true }));
    } else {
      setChangedFields(changes => {
        const newChanges = { ...changes };
        delete newChanges[key];
        return newChanges;
      });
    }
    
    // Update config
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('gameConfig', JSON.stringify(updated));
      return updated;
    });
  };

  const persistImageData = (data) => {
    if (data) {
      setImageData(data);
      localStorage.setItem('gameImageData', JSON.stringify(data));
      localStorage.removeItem('gameImageUrl'); // cleanup legacy key
    } else {
      setImageData(null);
      localStorage.removeItem('gameImageData');
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const hydrateImageData = async (data) => {
    if (!data?.url) return null;
    try {
      const res = await fetch(data.url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      const hydrated = {
        url: data.url,
        base64,
        mimeType: blob.type || data.mimeType || 'image/png'
      };
      persistImageData(hydrated);
      return hydrated;
    } catch (err) {
      console.warn('Failed to hydrate image data', err);
      return null;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result !== 'string') {
        setError('Image processing failed.');
        return;
      }

      const base64 = reader.result.split(',')[1];
      const mimeType = file.type || 'image/png';
      let uploadedUrl = null;

      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/upload-image', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
        } else {
          setError('Image upload failed.');
        }
      } catch (err) {
        setError('Image upload error.');
      }

      persistImageData({
        url: uploadedUrl || reader.result,
        base64,
        mimeType
      });
    };

    reader.readAsDataURL(file);
  };

  // 3. Save Config Logic
  const saveConfig = () => {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Load Config Logic
  const triggerLoadConfig = () => {
    fileInputRef.current?.click();
  };

  const loadConfig = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const newConfig = JSON.parse(event.target.result);
          // Merge with default to ensure all keys exist even if older config file
          setConfig(prev => {
            const updated = { ...DEFAULT_CONFIG, ...newConfig };
            localStorage.setItem('gameConfig', JSON.stringify(updated));
            return updated;
          });
        } catch (err) {
          setError("Failed to parse config file. Is it valid JSON?");
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  // 2. Updated Generate Logic to support Editing
  // Helper to get next version string
  const getNextVersion = () => {
    return new Date().toISOString().replace(/[:.]/g, '-');
  };

  const fetchVersions = async () => {
    const res = await fetch(`/list-game-versions/${gameId}`);
    const data = await res.json();
    setVersions(data.versions || []);
  };

  const openEditModal = () => {
    // Auto-generate change descriptions
    const changes = Object.keys(changedFields).map(key => {
      const fieldName = key.replace(/_/g, ' ').toLowerCase();
      return `change the ${fieldName} from "${originalConfig[key]}" to "${config[key]}"`;
    });
    
    if (changes.length > 0) {
      setEditInstructions(changes.join('\n- '));
    } else {
      setEditInstructions('');
    }
    
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditInstructions('');
  };

  const submitEdit = () => {
    setShowEditModal(false);
    generateGame(true);
  };

  useEffect(() => {
    fetchVersions();
  }, [gameId]);

  const generateGame = async (isRefinement = false) => {
    if (!apiKey) {
      setError("Please enter a Google Gemini API Key to generate the game.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setActiveTab('preview');

    try {
      const contents = [];
      
      if (isRefinement && gameHtml) {
        // Refinement Prompt Construction with edit instructions
        const changesList = editInstructions.trim() ? editInstructions : 'Apply configuration changes';
        
        contents.push({
          parts: [
            { text: "You are an expert Game Developer. The user has an existing HTML game and wants to modify it based on these edit instructions." },
            { text: "Edit Instructions:\n- " + changesList },
            { text: "\n\nHere is the EXISTING HTML CODE of the game:" },
            { text: gameHtml },
            { text: "\n\nHere is the UPDATED DESIGN SPECIFICATION:" },
            { text: generatedPrompt },
            { text: "Please re-write the code to incorporate these changes. Maintain the single-file structure. Output ONLY raw HTML." }
          ]
        });
        
        // Clear edit instructions and reset tracking after submission
        setEditInstructions('');
        setOriginalConfig(config);
        setChangedFields({});
      } else {
        // Fresh Generation Prompt Construction
        contents.push({
          parts: [
            { text: "You are an expert Game Developer. Create a single-file HTML game based strictly on the following design document. Output ONLY the raw HTML code. No markdown blocks, no explanation." },
            { text: generatedPrompt }
          ]
        });
      }

      const requestBody = { contents };

      let inlineImageData = imageData;
      if (inlineImageData && (!inlineImageData.base64 || !inlineImageData.mimeType)) {
        inlineImageData = await hydrateImageData(inlineImageData);
      }

      if (inlineImageData && !isRefinement) {
        requestBody.contents[0].parts.push({
          inlineData: {
            mimeType: inlineImageData.mimeType,
            data: inlineImageData.base64
          }
        });
        requestBody.contents[0].parts.push({
          text: "Use the visual style, color palette, and mood of the attached image to influence the game's aesthetics."
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      let rawHtml = data.candidates[0].content.parts[0].text;
      // Clean up markdown if the model accidentally added it
      rawHtml = rawHtml.replace(/^```html/, '').replace(/```$/, '');
      
      setGameHtml(rawHtml);
      // Save game HTML as a new version
      const version = getNextVersion();
      await fetch('/save-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rawHtml, game_id: gameId, version })
      });
      fetchVersions();
      
      // Reset change tracking after successful generation
      setOriginalConfig(config);
      setChangedFields({});
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadVersion = async (version) => {
    const res = await fetch(`/get-game/${gameId}/${version}`);
    if (res.ok) {
      const html = await res.text();
      setGameHtml(html);
      setSelectedVersion(version);
      setActiveTab('preview');
    }
  };

  const deleteVersion = async (version) => {
    const confirmed = window.confirm(`Are you sure you want to delete this version?\n\n${version.replace('.html', '')}`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/delete-game/${gameId}/${version}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh versions list
        fetchVersions();
        // Clear selected version if it was deleted
        if (selectedVersion === version) {
          setSelectedVersion(null);
        }
      } else {
        setError(data.error || 'Failed to delete version');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError('Error deleting version: ' + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const downloadGame = () => {
    const blob = new Blob([gameHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-game.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      <EditorSidebar
        fileInputRef={fileInputRef}
        loadConfig={loadConfig}
        triggerLoadConfig={triggerLoadConfig}
        saveConfig={saveConfig}
        apiKey={apiKey}
        setApiKey={setApiKey}
        imageData={imageData}
        handleImageUpload={handleImageUpload}
        config={config}
        handleConfigChange={handleConfigChange}
        versions={versions}
        selectedVersion={selectedVersion}
        loadVersion={loadVersion}
        deleteVersion={deleteVersion}
        gameHtml={gameHtml}
        isGenerating={isGenerating}
        generateGame={generateGame}
        changedFields={changedFields}
        openEditModal={openEditModal}
        setShowFogModal={setShowFogModal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
        
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          gameHtml={gameHtml}
          downloadGame={downloadGame}
        />

        {/* Content Views */}
        <div className="flex-1 relative overflow-hidden">
          
          {error && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg backdrop-blur flex items-center gap-2">
               <span className="font-bold">Error:</span> {error}
             </div>
          )}

          {activeTab === 'editor' && <PromptPreview generatedPrompt={generatedPrompt} />}
          {activeTab === 'preview' && <GamePreview gameHtml={gameHtml} isGenerating={isGenerating} />}
          {activeTab === 'code' && <SourceCodeView gameHtml={gameHtml} />}
        </div>
      </div>

      {/* Edit Instructions Modal */}
      <EditInstructionsModal 
        show={showEditModal}
        onClose={closeEditModal}
        onSubmit={submitEdit}
        editInstructions={editInstructions}
        setEditInstructions={setEditInstructions}
      />

      {/* Fog Settings Modal */}
      <FogSettings 
        show={showFogModal}
        onClose={() => setShowFogModal(false)}
        config={config}
        handleConfigChange={handleConfigChange}
      />
    </div>
  );
}

// --- Subcomponents ---

const Section = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-slate-400 pb-1 border-b border-slate-800/50">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, className }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-medium text-slate-500 uppercase">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
    />
  </div>
);

const ColorInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
     <label className="text-[10px] font-medium text-slate-500 uppercase truncate">{label}</label>
     <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded pr-2 p-1">
       <input 
        type="color" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" 
       />
       <span className="text-[10px] font-mono text-slate-400">{value}</span>
     </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
      ${active 
        ? 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/50' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
  >
    {icon}
    {label}
  </button>
);