
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, CornerDownLeft, Command, X, CreditCard, Wallet, Sparkles, Target, Settings, Zap, TrendingUp, LogOut } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  group: 'Navigation' | 'Action' | 'System';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small timeout to ensure DOM is ready for focus
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter commands
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.group.toLowerCase().includes(query.toLowerCase())
  );

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
        const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden animate-slide-up flex flex-col max-h-[60vh]">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-white/5 relative">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg font-medium"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-900 border border-white/5 px-2 py-1 rounded">
            <span className="text-xs">ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div 
            ref={listRef}
            className="overflow-y-auto custom-scrollbar p-2 scroll-py-2"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  index === selectedIndex 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                    {cmd.icon}
                </div>
                
                <div className="flex-1">
                    <span className="text-sm font-bold block">{cmd.label}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${index === selectedIndex ? 'text-indigo-200' : 'text-slate-600'}`}>{cmd.group}</span>
                </div>

                {index === selectedIndex && (
                    <CornerDownLeft className="w-4 h-4 text-white/50 animate-pulse" />
                )}
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
                <p className="text-sm font-medium">No matching commands found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            <div className="flex gap-4">
                <span><span className="text-slate-400">↑↓</span> Navigate</span>
                <span><span className="text-slate-400">↵</span> Select</span>
            </div>
            <span>Nova Command Core</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
