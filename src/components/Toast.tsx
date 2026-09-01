
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, RotateCcw } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const duration = toast.action ? 6000 : 4000; // Give more time if there's an action
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove, toast.action]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-950/90 border-emerald-500/20 shadow-emerald-900/20';
      case 'error': return 'bg-rose-950/90 border-rose-500/20 shadow-rose-900/20';
      default: return 'bg-slate-900/90 border-slate-700/50 shadow-slate-900/20';
    }
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg animate-slide-up transition-all ${getStyles()}`}>
      {getIcon()}
      <p className="text-xs font-bold text-slate-100 flex-1">{toast.message}</p>
      
      {toast.action && (
        <button 
          onClick={() => { toast.action?.onClick(); onRemove(toast.id); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors mr-2"
        >
          <RotateCcw className="w-3 h-3" />
          {toast.action.label}
        </button>
      )}

      <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
