const { Icon } = window;

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

const TabNavigation = ({ activeTab, setActiveTab, gameHtml, downloadGame }) => {
  return (
    <div className="h-14 border-b border-slate-800 flex items-center px-6 gap-6 bg-slate-900/80 backdrop-blur">
      <NavButton 
        active={activeTab === 'preview'} 
        onClick={() => setActiveTab('preview')} 
        icon={<Icon name="desktop" size={16} />} 
        label="Game Preview" 
      />
      <NavButton 
        active={activeTab === 'editor'} 
        onClick={() => setActiveTab('editor')} 
        icon={<Icon name="code" size={16} />} 
        label="Prompt Preview" 
      />
      <NavButton 
        active={activeTab === 'code'} 
        onClick={() => setActiveTab('code')} 
        icon={<Icon name="terminal" size={16} />} 
        label="Source Code" 
      />
      
      <div className="ml-auto flex items-center gap-2">
        {gameHtml && (
           <button 
            onClick={downloadGame}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <Icon name="download" size={14} />
            Download HTML
          </button>
        )}
      </div>
    </div>
  );
};

window.TabNavigation = TabNavigation;
