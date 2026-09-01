
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Goal, TransactionType, UserPlan } from '../types';
import { Microscope, Play, RefreshCw, Zap, ShoppingCart, Target, Lock, Loader2 } from 'lucide-react';
import { parseSimulationQuery } from '../services/geminiService';

interface SandboxProps {
  transactions: Transaction[];
  goals: Goal[];
  formatCurrency: (amount: number) => string | React.ReactNode;
  userPlan: UserPlan;
  onUpgradeClick: () => void;
  insightUsage: number;
  onIncrementUsage: (amount?: number) => void;
}

const detectNumberInSentence = (text: string): number | null => {
  // 1. Check for explicit currency symbols, e.g. $2500 or €1,200 (any match is likely the price)
  const currencyRegex = /[\$£€¥]\s*(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  let match;
  const currencyMatches: number[] = [];
  while ((match = currencyRegex.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/[\s,]/g, ''));
    if (!isNaN(val) && val > 0) currencyMatches.push(val);
  }
  if (currencyMatches.length > 0) {
    return Math.max(...currencyMatches);
  }

  // 2. Check for numbers preceded by "for", "at", "costs", "spend", "price of"
  const priceIndicatorRegex = /(?:for|at|costs|price of|buy|spend|of)\s*[\$£€¥]?\s*(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/gi;
  const indicatorMatches: number[] = [];
  while ((match = priceIndicatorRegex.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/[\s,]/g, ''));
    if (!isNaN(val) && val > 0) indicatorMatches.push(val);
  }
  if (indicatorMatches.length > 0) {
    return Math.max(...indicatorMatches);
  }

  // 3. Fallback: Find all numbers in the sentence and pick the LARGEST number (price is typically the largest number)
  const allNumbersRegex = /\b(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\b/g;
  const allNumbers: number[] = [];
  while ((match = allNumbersRegex.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/[\s,]/g, ''));
    if (!isNaN(val) && val > 0) allNumbers.push(val);
  }
  if (allNumbers.length > 0) {
    return Math.max(...allNumbers);
  }

  return null;
};

const ScenarioSandbox: React.FC<SandboxProps> = ({ transactions, goals, formatCurrency, userPlan, onUpgradeClick, insightUsage, onIncrementUsage }) => {
  const [params, setParams] = useState({
    monthlyIncome: 0,
    currentSavings: 0,
    itemPrice: 0,
    buyItemName: '',
  });

  // Effect to sync with real data on load
  useEffect(() => {
    const now = new Date();
    const monthlyIncome = transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === now.getMonth())
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    // We'll estimate savings from liquid accounts if possible, or just default
    setParams(p => ({
        ...p,
        monthlyIncome: monthlyIncome || 5000,
        currentSavings: 15000, // Placeholder or user-defined starting point
    }));
  }, [transactions]);

  const [aiAnalysis, setAiAnalysis] = useState<{
      verdict: 'SAFE' | 'RISKY' | 'BAD';
      reason: string;
      suggestions: string[];
  } | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);

  const calculations = useMemo(() => {
    const now = new Date();
    const monthlyExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === now.getMonth())
      .reduce((acc, curr) => acc + curr.amount, 0) || (params.monthlyIncome * 0.7); // Fallback to 70% of income if no data

    const monthlySurplus = Math.max(0, params.monthlyIncome - monthlyExpenses);
    const afterBuySavings = params.currentSavings - params.itemPrice;
    const savingsIntactPercent = params.currentSavings > 0 ? Math.max(0, Math.round((afterBuySavings / params.currentSavings) * 100)) : 0;
    
    // Recovery Months: How long it takes for monthly surplus to replace the itemPrice
    const recoveryMonths = monthlySurplus > 0 ? Math.ceil(params.itemPrice / monthlySurplus) : 99;
    
    const sixMonthNoBuy = params.currentSavings + (monthlySurplus * 6);
    const sixMonthWithBuy = afterBuySavings + (monthlySurplus * 6);

    // Hard Logic for Verdict
    let verdict: 'SAFE' | 'RISKY' | 'BAD' = 'SAFE';
    if (params.itemPrice > params.currentSavings || params.itemPrice > (params.monthlyIncome * 2)) {
        verdict = 'BAD';
    } else if (params.itemPrice > (params.currentSavings * 0.2) || params.itemPrice > (monthlySurplus * 3)) {
        verdict = 'RISKY';
    } else if (params.itemPrice < (params.currentSavings * 0.05) && params.itemPrice < (monthlySurplus * 0.5)) {
        verdict = 'SAFE';
    } else {
        verdict = 'RISKY'; // Default to cautionary if not clearly safe
    }

    return {
        afterBuySavings,
        savingsIntactPercent,
        recoveryMonths,
        sixMonthNoBuy,
        sixMonthWithBuy,
        monthlySurplus,
        verdict
    };
  }, [params, transactions]);

  const handleExecuteAIsim = async () => {
    if (!params.buyItemName.trim()) return;
    const detected = detectNumberInSentence(params.buyItemName);
    setIsExecuting(true);
    try {
        const result = await parseSimulationQuery(params.buyItemName, userPlan, {
            income: params.monthlyIncome,
            savings: params.currentSavings,
            surplus: calculations.monthlySurplus
        });
        
        if (result) {
            setParams(p => ({
                ...p,
                itemPrice: result.oneTimeTotal || detected || p.itemPrice,
            }));
            
            setAiAnalysis({
                verdict: calculations.verdict, // Use our hard logic for the tag
                reason: result.aiOpinion,
                suggestions: result.aiSuggestions && result.aiSuggestions.length > 0 ? result.aiSuggestions : ['Consider the long-term impact on your emergency fund.']
            });
            onIncrementUsage(10); 
        }
    } finally {
        setIsExecuting(false);
    }
  };

  const getVerdictColor = (v: string) => {
      if (v === 'SAFE') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (v === 'RISKY') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const currentVerdict = aiAnalysis?.verdict || calculations.verdict;

  if (userPlan === 'free') {
      return (
          <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
              <div 
                  onClick={onUpgradeClick}
                  className="glass-card max-w-md p-10 rounded-[3rem] text-center border border-indigo-500/25 cursor-pointer hover:border-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-2xl"
              >
                  <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:rotate-12 transition-transform duration-300">
                      <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 animate-fade-in">Decision Sandbox Locked</h3>
                  <p className="text-slate-400 mb-8 font-medium">Predictive Decision Sandbox requires a Pro or Elite upgrade. Click anywhere in this square to unlock.</p>
                  <button className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 fill-indigo-600 text-indigo-600 animate-pulse" /> Upgrade Now
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="animate-slide-up pb-20 max-w-xl mx-auto">
      <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">
             Decision Sandbox
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
             Immediate Financial Reality Check
          </p>
      </div>

      <div className="space-y-4">
          {/* Main Inquiry */}
          <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-4 focus-within:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3 px-2">
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <input 
                    type="text"
                    placeholder="What if I buy a MacBook for $2500?"
                    value={params.buyItemName}
                    onChange={(e) => {
                      const text = e.target.value;
                      const detected = detectNumberInSentence(text);
                      setParams(p => ({
                        ...p,
                        buyItemName: text,
                        itemPrice: detected !== null ? detected : p.itemPrice
                      }));
                    }}
                    className="flex-1 bg-transparent border-none text-white font-bold placeholder:text-slate-700 outline-none h-10 text-sm"
                  />
                  <button 
                    onClick={handleExecuteAIsim}
                    disabled={isExecuting || !params.buyItemName.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
                  >
                    {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ANALYZE'}
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900/30 rounded-2xl border border-white/5">
                  <label className="text-[8px] font-black text-slate-600 uppercase block mb-1">Price</label>
                  <input type="number" value={params.itemPrice || ''} onChange={(e) => setParams(p => ({ ...p, itemPrice: parseFloat(e.target.value) || 0 }))} className="w-full bg-transparent text-white font-bold text-xs outline-none" />
              </div>
              <div className="p-3 bg-slate-900/30 rounded-2xl border border-white/5">
                  <label className="text-[8px] font-black text-slate-600 uppercase block mb-1">Income</label>
                  <input type="number" value={params.monthlyIncome || ''} onChange={(e) => setParams(p => ({ ...p, monthlyIncome: parseFloat(e.target.value) || 0 }))} className="w-full bg-transparent text-white font-bold text-xs outline-none" />
              </div>
              <div className="p-3 bg-slate-900/30 rounded-2xl border border-white/5">
                  <label className="text-[8px] font-black text-slate-600 uppercase block mb-1">Savings</label>
                  <input type="number" value={params.currentSavings || ''} onChange={(e) => setParams(p => ({ ...p, currentSavings: parseFloat(e.target.value) || 0 }))} className="w-full bg-transparent text-white font-bold text-xs outline-none" />
              </div>
          </div>

          {/* Results Area */}
          {(aiAnalysis || params.itemPrice > 0) && (
              <div className="animate-slide-up space-y-4 pt-4">
                  {/* Verdict */}
                  <div className={`p-5 rounded-[2rem] border text-center ${getVerdictColor(currentVerdict)}`}>
                      <h3 className="text-4xl font-black mb-1">{currentVerdict}</h3>
                      <p className="text-xs font-bold opacity-70">{aiAnalysis?.reason || (currentVerdict === 'SAFE' ? 'Negligible impact.' : 'Noticeable impact on savings.')}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                      <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 text-center">
                          <h4 className="text-[8px] font-black text-slate-500 uppercase mb-1">Cash Left</h4>
                          <div className="text-lg font-black text-white">{formatCurrency(calculations.afterBuySavings)}</div>
                      </div>
                      <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 text-center">
                          <h4 className="text-[8px] font-black text-slate-500 uppercase mb-1">Recovery</h4>
                          <div className="text-lg font-black text-white">{calculations.recoveryMonths} <span className="text-[10px] text-slate-500">Mo</span></div>
                      </div>
                  </div>

                  {/* 6 Month Impact */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 text-center">
                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4">6-Month Path</div>
                      <div className="flex items-center justify-around">
                          <div>
                              <div className="text-[8px] text-slate-500 font-bold uppercase">Wait</div>
                              <div className="text-lg font-black text-emerald-400">{formatCurrency(calculations.sixMonthNoBuy)}</div>
                          </div>
                          <div className="h-4 w-px bg-white/5"></div>
                          <div>
                              <div className="text-[8px] text-slate-500 font-bold uppercase">Buy Now</div>
                              <div className="text-lg font-black text-white">{formatCurrency(calculations.sixMonthWithBuy)}</div>
                          </div>
                      </div>
                  </div>

                  {aiAnalysis && aiAnalysis.suggestions && (
                      <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] text-left">
                        <h4 className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-3 block">Tactical Action Plan (How to Deal with It)</h4>
                        <ul className="space-y-2">
                          {aiAnalysis.suggestions.map((item, idx) => (
                             <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300">
                               <span className="text-indigo-400 font-bold font-mono">0{idx + 1}.</span>
                               <span className="font-semibold leading-relaxed">{item}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ScenarioSandbox;

const QuickInput: React.FC<{ label: string, value: number, onChange: (v: number) => void, format: (n: number) => any }> = ({ label, value, onChange, format }) => (
    <div className="p-5 bg-slate-900/50 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
        <div className="relative">
            <input 
                type="number" 
                value={value || ''} 
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-black text-lg outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
            />
        </div>
    </div>
);
