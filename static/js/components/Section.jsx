window.Section = ({ title, icon, children }) => (
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
