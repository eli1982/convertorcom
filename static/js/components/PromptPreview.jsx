const { Icon } = window;

window.PromptPreview = ({ generatedPrompt }) => {
  return (
    <div className="h-full overflow-auto p-8">
       <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
         <h3 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-4 flex items-center gap-2">
           <Icon name="terminal" size={14} />
           Generated Prompt Payload
         </h3>
         <pre className="font-mono text-xs md:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
           {generatedPrompt}
         </pre>
       </div>
    </div>
  );
};
