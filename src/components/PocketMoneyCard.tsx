import React from 'react';

interface PocketMoneyCardProps {
  formatCurrency: (v: number) => React.ReactNode;
  safeToSpend?: number;
  income?: number;
  bills?: number;
  goals?: number;
}

export const PocketMoneyCard: React.FC<PocketMoneyCardProps> = ({ 
  formatCurrency,
  safeToSpend = 0,
  income = 0,
  bills = 0,
  goals = 0
}) => {
  return (
    <div className="glass-card p-6 rounded-[2rem] border border-cyan-500/20 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between relative overflow-hidden h-full shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none"></div>
      
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span className="text-xs font-bold text-cyan-400 tracking-wide leading-tight">In My Pocket</span>
        </div>
        
        <div className="relative z-10 mb-6">
          <div className="text-3xl font-black text-white tracking-tight">{formatCurrency(safeToSpend)}</div>
          <div className="text-[10px] text-slate-400 mt-1 tracking-wide font-medium">Safe to spend today</div>
        </div>
      </div>

      <div className="space-y-3 relative z-10 mt-auto">
        <div className="flex justify-between items-center text-xs font-medium tracking-wide border-t border-white/5 pt-3">
          <span className="text-slate-400">Income</span>
          <span className="text-emerald-400 font-bold">+ {formatCurrency(income)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-medium tracking-wide border-t border-white/5 pt-3">
          <span className="text-slate-400">Bills</span>
          <span className="text-rose-400 font-bold">- {formatCurrency(bills)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-medium tracking-wide border-t border-white/5 pt-3">
          <span className="text-slate-400">Goals</span>
          <span className="text-amber-400 font-bold">- {formatCurrency(goals)}</span>
        </div>
      </div>
    </div>
  );
};
