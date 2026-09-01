
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '../types';
import { DollarSign, ArrowRight, Rocket, TrendingUp, TrendingDown, Wallet, Tag } from 'lucide-react';

interface FirstTransactionOnboardingProps {
  onAdd: (t: Transaction) => void;
  userName: string;
  accounts: Account[];
}

const FirstTransactionOnboarding: React.FC<FirstTransactionOnboardingProps> = ({ onAdd, userName, accounts }) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'manual');
  const [isVisible, setIsVisible] = useState(false);

  const incomeCategories = [
    Category.INCOME,
    Category.SALARY,
    Category.FREELANCE,
    Category.TRADING,
    Category.CRYPTO,
    Category.BUSINESS,
    Category.CASHBACK,
    Category.INVESTMENT
  ];
  const expenseCategories = Object.values(Category).filter(c => !incomeCategories.includes(c));

  useEffect(() => setIsVisible(true), []);

  useEffect(() => {
    if (type === TransactionType.INCOME) {
      setCategory(Category.SALARY);
    } else {
      setCategory(Category.FOOD);
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      merchant,
      amount: parseFloat(amount),
      category,
      type,
      accountId, 
      notes: 'First calibration entry'
    };
    onAdd(newTx);
  };

  const accountName = accounts.find(a => a.id === accountId)?.name || 'Manual';

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="w-full max-w-lg bg-[#0f172a]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-slide-up">
            
            {/* Header / Info */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">System Calibration</h2>
                        <p className="text-slate-400 text-xs font-medium">Log the first signal to activate the dashboard.</p>
                    </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/10 text-[10px] font-bold text-slate-300">
                    <Wallet className="w-3 h-3 text-indigo-400" />
                    Linked to: <span className="text-white">{accountName}</span>
                </div>
            </div>

            {/* Form */}
            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Toggle */}
                    <div className="bg-slate-950 p-1.5 rounded-xl flex relative border border-white/5">
                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800 rounded-lg shadow-sm transition-all duration-300 ${type === TransactionType.EXPENSE ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}></div>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${type === TransactionType.EXPENSE ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <TrendingDown className="w-4 h-4" /> Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${type === TransactionType.INCOME ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <TrendingUp className="w-4 h-4" /> Income
                        </button>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Magnitude</label>
                        <div className="relative group">
                            <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-emerald-500'}`} />
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-3xl font-black text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                            <input 
                                type="text"
                                value={merchant}
                                onChange={(e) => setMerchant(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                                placeholder={type === TransactionType.EXPENSE ? "e.g. Coffee" : "e.g. Salary"}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as Category)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    {(type === TransactionType.INCOME ? incomeCategories : expenseCategories).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group mt-4 border border-white/10"
                    >
                        Activate Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default FirstTransactionOnboarding;
