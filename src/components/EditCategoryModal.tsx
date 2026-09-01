import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  initialGroup: string;
  onSave: (updates: { group: string; isRollover: boolean; isExcluded: boolean }) => void;
}

const GROUPS = [
  'Fixed Costs',
  'Variable Spending',
  'Savings & Investments'
];

export default function EditCategoryModal({
  isOpen,
  onClose,
  categoryName,
  initialGroup,
  onSave
}: EditCategoryModalProps) {
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [isRollover, setIsRollover] = useState(false);
  const [isExcluded, setIsExcluded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedGroup(initialGroup);
      setIsRollover(false);
      setIsExcluded(false);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialGroup]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ group: selectedGroup, isRollover, isExcluded });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#020617] border border-slate-800/80 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">Edit Category</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Metadata Block */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                📋
              </div>
              <h3 className="text-lg font-bold text-white">{categoryName}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              This system category automatically categorizes transactions related to {categoryName}.
            </p>
          </div>

          {/* Group Dropdown */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Group</label>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-sm hover:border-slate-700 transition-colors"
              >
                <span className="font-medium text-slate-200">{selectedGroup}</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                  {GROUPS.map(g => (
                    <button
                      key={g}
                      onClick={() => { setSelectedGroup(g); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedGroup === g ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-slate-300 hover:bg-slate-800/50'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toggle Stack */}
          <div className="space-y-3">
            {/* Rollover Toggle */}
            <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Make this category a rollover fund</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Carry over remaining balances or set due dates to better plan for future expenses.
                </p>
              </div>
              <button 
                onClick={() => setIsRollover(!isRollover)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 mt-1 ${isRollover ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isRollover ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Exclusion Toggle */}
            <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Exclude this category from the budget</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This category and any transactions linked to it will be hidden from your budget.
                </p>
              </div>
              <button 
                onClick={() => setIsExcluded(!isExcluded)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 mt-1 ${isExcluded ? 'bg-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isExcluded ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-white/5 bg-slate-950/50">
          <button 
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            Disable
          </button>
          <button 
            onClick={handleSave}
            className="text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
