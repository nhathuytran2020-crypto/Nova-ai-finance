
import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { Landmark, ArrowRight, Wallet, CreditCard, DollarSign, TrendingUp, Shield } from 'lucide-react';

interface FirstAccountOnboardingProps {
  onAdd: (account: Account) => void;
  userName: string;
}

const FirstAccountOnboarding: React.FC<FirstAccountOnboardingProps> = ({ onAdd, userName }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<Account['type']>('Checking');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(true), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newAccount: Account = {
      id: Date.now().toString(),
      name,
      type,
      balance: parseFloat(balance) || 0,
      institution: 'Manual Entry',
      color: '#6366f1' // Default Indigo
    };
    onAdd(newAccount);
  };

  const accountTypes = [
      { id: 'Checking', icon: Wallet, label: 'Checking', desc: 'Daily Spending', tooltip: 'Everyday account for bills & daily purchases' },
      { id: 'Savings', icon: Landmark, label: 'Savings', desc: 'Reserves & Emergency', tooltip: 'Money set aside for emergencies or goals' },
      { id: 'Credit Card', icon: CreditCard, label: 'Credit Card', desc: 'Liabilities & Cards', tooltip: 'Credit cards or loans (money you owe)' },
      { id: 'Investment', icon: TrendingUp, label: 'Investment', desc: 'Growth & Stocks', tooltip: 'Stocks, retirement accounts, or funds' },
  ];

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="w-full max-w-2xl bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Panel: Visual/Context */}
            <div className="md:w-5/12 bg-slate-900/50 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50"></div>
                
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <Shield className="w-7 h-7 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-tight mb-2">
                        Set Up <br/><span className="text-indigo-400">Main Account</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Welcome, {userName || 'there'}. Let's add your main bank account to get started.
                    </p>
                </div>

                <div className="relative z-10 mt-8 md:mt-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Quick Setup
                    </div>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex-1 p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Account Type Grid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                            <span className="text-[10px] text-slate-500">Select category</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {accountTypes.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id as any)}
                                    title={t.tooltip}
                                    className={`relative p-3 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                                        type === t.id 
                                        ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' 
                                        : 'bg-slate-900/50 border-white/5 hover:border-white/10 hover:bg-slate-800'
                                    }`}
                                >
                                    <div className={`mb-2 ${type === t.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                                        <t.icon className="w-5 h-5" />
                                    </div>
                                    <div className={`text-xs font-bold ${type === t.id ? 'text-white' : 'text-slate-200'}`}>{t.label}</div>
                                    <div className={`text-[9px] font-medium tracking-wide mt-0.5 ${type === t.id ? 'text-indigo-200' : 'text-slate-500'}`}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</label>
                                <span className="text-[10px] text-slate-500">e.g. Main Checking, Chase</span>
                            </div>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                                placeholder="e.g. Main Checking"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Balance</label>
                                <span className="text-[10px] text-slate-500">How much money is currently in this account</span>
                            </div>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-2xl font-black text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-800"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={!name}
                        className="w-full py-4 bg-white text-slate-950 font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                    >
                        Save & Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default FirstAccountOnboarding;
