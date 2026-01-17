window.EditInstructionsModal = ({ show, onClose, onSubmit, editInstructions, setEditInstructions }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="edit" size={18} />
            Edit Instructions
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="times" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-slate-300 mb-4">
            The following changes have been detected. You can provide additional edit instructions below before updating the game.
          </p>
          
          <textarea
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all h-64 resize-none text-white"
            value={editInstructions}
            onChange={(e) => setEditInstructions(e.target.value)}
            placeholder="The detected changes are already included. Add any additional refinement instructions here..."
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all"
          >
            Submit & Update Game
          </button>
        </div>
      </div>
    </div>
  );
};
