window.Input = ({ label, value, onChange, placeholder, className, isChanged }) => (
  <div className={`flex flex-col gap-1 ${className || ''}`}>
    <label className="text-[10px] font-medium text-slate-500 uppercase">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className={`bg-slate-950 border rounded px-2 py-1.5 text-xs text-slate-200 outline-none transition-colors ${
        isChanged 
          ? 'border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500' 
          : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
      }`}
    />
  </div>
);
