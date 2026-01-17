window.ColorInput = ({ label, value, onChange, isChanged }) => (
  <div className="flex flex-col gap-1">
     <label className="text-[10px] font-medium text-slate-500 uppercase truncate">{label}</label>
     <div className={`flex items-center gap-2 bg-slate-950 border rounded pr-2 p-1 focus-within:ring-1 transition-all ${
       isChanged 
         ? 'border-orange-500 focus-within:border-orange-500 focus-within:ring-orange-500' 
         : 'border-slate-800 focus-within:border-purple-500 focus-within:ring-purple-500'
     }`}>
       <input 
        type="color" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 outline-none" 
       />
       <span className="text-[10px] font-mono text-slate-400">{value}</span>
     </div>
  </div>
);
