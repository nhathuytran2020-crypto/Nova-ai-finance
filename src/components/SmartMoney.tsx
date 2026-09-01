
import React, { useState, useEffect } from 'react';
import { Transaction, Account, Goal, UserPlan, Budget } from '../types';
import DetailedCharts from './DetailedCharts';
import { GitFork, Microscope, Handshake, Flame, Waves, Lock, Zap, PieChart as PieChartIcon, LayoutGrid } from 'lucide-react';
import CashflowBeta from './CashflowBeta';
import ScenarioSandbox from './ScenarioSandbox';
import BillNegotiator from './BillNegotiator';
import SankeyChart from './SankeyChart';
import BudgetMatrix from './BudgetMatrix';

interface SmartMoneyProps {
  initialTab?: string;
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets?: Budget[]; // optional until App.tsx updates
  formatCurrency: (amount: number) => string | React.ReactNode;
  userPlan: UserPlan;
  onUpgradeClick: () => void;
  insightUsage: number;
  onIncrementUsage: (amount?: number) => void;
  negotiationUsage: number;
  onIncrementNegotiationUsage: () => void;
}

const SmartMoney: React.FC<SmartMoneyProps> = ({
  initialTab = 'burn_vector',
  transactions,
  accounts,
  goals,
  budgets = [],
  formatCurrency,
  userPlan,
  onUpgradeClick,
  insightUsage,
  onIncrementUsage,
  negotiationUsage,
  onIncrementNegotiationUsage
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [devPassword, setDevPassword] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState(true);

  // Sync if initialTab prop changes (from parent navigation)
  useEffect(() => {
    // Map legacy cashflow param to new ID if needed
    if(initialTab === 'cashflow') setActiveTab('burn_vector');
    else if(initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleDevUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (devPassword === 'Novapro') {
          setIsDevUnlocked(true);
      } else {
          setDevPassword('');
      }
  };

  const isLocked = userPlan === 'free';

  return (
    <div className="h-auto min-h-0 flex flex-col max-w-7xl mx-auto w-full relative">
        {/* Navigation Header - Sticky to prevent scrolling out of view */}
        <div className="sticky top-0 z-30 bg-[#020617] border-b border-white/5 py-4 px-4 md:px-8 w-full">
            <div className="flex gap-2.5 overflow-x-auto custom-scrollbar no-scrollbar">
                <button
                    onClick={() => setActiveTab('budget_matrix')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'budget_matrix' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Dynamic Budget
                </button>
                <button
                    onClick={() => setActiveTab('burn_vector')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'burn_vector' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <Flame className="w-4 h-4" /> Cash Flow
                </button>
                <button
                    onClick={() => setActiveTab('detailed_charts')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'detailed_charts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <PieChartIcon className="w-4 h-4" /> Bar & Pie chart
                </button>
                <button
                    onClick={() => setActiveTab('sankey')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'sankey' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <Waves className="w-4 h-4" /> Money Flows {isLocked && <Lock className="w-3 h-3 ml-1 opacity-70" />}
                </button>
                <button
                    onClick={() => setActiveTab('sandbox')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'sandbox' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <Microscope className="w-4 h-4" /> Predictive Sandbox
                </button>
                <button
                    onClick={() => setActiveTab('negotiator')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'negotiator' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800 border border-white/5'}`}
                >
                    <Handshake className="w-4 h-4" /> Bill Negotiator
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 animate-fade-in px-4 md:px-8 pb-8">
            {activeTab === 'budget_matrix' && (
                <BudgetMatrix transactions={transactions} budgets={budgets} formatCurrency={formatCurrency} />
            )}
            {activeTab === 'burn_vector' && (
                isDevUnlocked ? (
                    <CashflowBeta transactions={transactions} accounts={accounts} goals={goals} formatCurrency={formatCurrency} userPlan={userPlan} />
                ) : (
                    <div className="py-20 flex items-center justify-center">
                        <div className="max-w-md p-10 text-center bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                                <Lock className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Cash Flow Vector Locked</h3>
                            <p className="text-slate-500 mb-8 text-sm font-medium">
                                This feature is currently in beta. Enter the developer password to visually inspect the module.
                            </p>
                            <form onSubmit={handleDevUnlock} className="flex gap-2">
                                <input 
                                    type="password" 
                                    placeholder="Enter Dev Password..." 
                                    value={devPassword}
                                    onChange={(e) => setDevPassword(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-rose-500"
                                />
                                <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                                    Unlock
                                </button>
                            </form>
                        </div>
                    </div>
                )
            )}
            {activeTab === 'detailed_charts' && (
                <DetailedCharts transactions={transactions} formatCurrency={formatCurrency} />
            )}
            {activeTab === 'sankey' && (
                isLocked ? (
                    <div className="py-20 flex items-center justify-center">
                        <div 
                            onClick={onUpgradeClick}
                            className="glass-card max-w-md p-10 rounded-[3rem] text-center border border-indigo-500/25 cursor-pointer hover:border-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:rotate-12 transition-transform duration-300">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 animate-fade-in">Money Flows Locked</h3>
                            <p className="text-slate-400 mb-8 font-medium">This high-fidelity dynamic visualization requires a Pro upgrade. Click anywhere in this square to unlock.</p>
                            <button className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                <Zap className="w-5 h-5 fill-indigo-600 text-indigo-600 animate-pulse" /> Upgrade Now
                            </button>
                        </div>
                    </div>
                ) : (
                    <SankeyChart transactions={transactions} formatCurrency={formatCurrency} />
                )
            )}
            {activeTab === 'sandbox' && (
                <ScenarioSandbox transactions={transactions} goals={goals} formatCurrency={formatCurrency} userPlan={userPlan} onUpgradeClick={onUpgradeClick} insightUsage={insightUsage} onIncrementUsage={onIncrementUsage} />
            )}
            {activeTab === 'negotiator' && (
                <BillNegotiator userPlan={userPlan} onIncrementUsage={onIncrementNegotiationUsage} negotiationUsage={negotiationUsage} transactions={transactions} onUpgradeClick={onUpgradeClick} />
            )}
        </div>
    </div>
  );
};

export default SmartMoney;
