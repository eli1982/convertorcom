window.SourceCodeView = ({ gameHtml }) => {
  return (
    <div className="h-full overflow-auto p-4 bg-[#1e1e1e] text-slate-300 font-mono text-sm">
       {gameHtml ? (
         <textarea 
           readOnly 
           value={gameHtml} 
           className="w-full h-full bg-transparent resize-none outline-none"
         />
       ) : (
          <div className="h-full flex items-center justify-center text-slate-600">
            Generate a game to see the source code here.
          </div>
       )}
    </div>
  );
};
