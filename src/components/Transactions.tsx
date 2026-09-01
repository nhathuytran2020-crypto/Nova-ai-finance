
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, TransactionType, Category, Account, UserPlan, Currency, Budget } from '../types';
import { Search, ArrowUpCircle, ArrowDownCircle, Filter, Calendar, Trash2, Tag, Plus, X, Check, DollarSign, Wallet, FileText, Sparkles, Loader2, StickyNote, ArrowUp, ArrowDown, Camera, AlertCircle, ScanLine, Upload, Layers, AlertTriangle, FileUp, ChevronDown, Clock, History } from 'lucide-react';
import { categorizeTransaction, parseReceiptImage } from '../services/geminiService';
import { BarChart, Bar, ResponsiveContainer, Tooltip, ReferenceLine, XAxis, YAxis } from 'recharts';

interface TransactionsProps {
  transactions: Transaction[];
  accounts?: Account[]; 
  budgets?: Budget[];
  onDelete?: (id: string) => void;
  onAdd?: (transaction: Transaction) => void;
  onUpdate?: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string | React.ReactNode;
  onNavigateToAccounts?: () => void;
  userPlan?: UserPlan;
  scanUsage?: number;
  onIncrementScan?: () => void;
  currency?: Currency;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, accounts = [], budgets = [], onDelete, onAdd, onUpdate, formatCurrency, onNavigateToAccounts, userPlan = 'free', scanUsage = 0, onIncrementScan, currency = 'USD' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filtered = useMemo(() => {
      return transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                              t.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                              (t.notes && t.notes.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        const matchesType = filterType === 'ALL' || t.type === filterType;
        return matchesSearch && matchesType;
      });
  }, [transactions, debouncedSearchTerm, filterType]);

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      filtered.forEach(t => {
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      // Sort dates descending
      return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filtered]);

  const formatDateHeader = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc && id === 'manual') return 'Cash / Manual';
    return acc ? acc.name : 'Unknown Account';
  };

  const getCategoryTrend = (category: Category, type: TransactionType) => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth();
        const year = d.getFullYear();
        
        const total = transactions
            .filter(tx => 
                tx.category === category && 
                tx.type === type && 
                new Date(tx.date).getMonth() === month && 
                new Date(tx.date).getFullYear() === year
            )
            .reduce((acc, tx) => acc + tx.amount, 0);
            
        data.push({
            name: d.toLocaleDateString('en-US', { month: 'short' }),
            value: total
        });
    }
    return data;
  };

  const getCategoryInsight = (category: Category, type: TransactionType) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriodTxs = transactions.filter(tx => 
        tx.category === category && 
        tx.type === type &&
        new Date(tx.date) >= oneWeekAgo &&
        new Date(tx.date) <= now
    );

    const prevPeriodTxs = transactions.filter(tx => 
        tx.category === category && 
        tx.type === type &&
        new Date(tx.date) >= twoWeeksAgo &&
        new Date(tx.date) < oneWeekAgo
    );

    const currentSum = currentPeriodTxs.reduce((sum, t) => sum + t.amount, 0);
    const prevSum = prevPeriodTxs.reduce((sum, t) => sum + t.amount, 0);

    if (prevSum === 0) {
        return { 
            text: currentSum > 0 ? "Insight: New Activity" : "Insight: Stable", 
            className: "text-slate-500" 
        };
    }

    const percentChange = ((currentSum - prevSum) / prevSum) * 100;
    const isIncrease = percentChange > 0;
    
    return {
        text: `Insight: ${isIncrease ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(0)}% this week`,
        className: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" // Unique Nova Blue/Purple Highlight
    };
  };

  const isElite = userPlan === 'ultra';

  return (
    <div className="flex flex-col h-auto min-h-0 max-w-7xl mx-auto w-full animate-slide-up space-y-6 relative">
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto px-2">
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
              <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-white/10 text-xs font-bold text-indigo-300 shadow-inner">{filtered.length}</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all md:w-64 placeholder:text-slate-600 shadow-inner"
              />
            </div>
            
            <div className="flex gap-3">
                <div className="relative">
                    <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="appearance-none bg-slate-950/50 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer shadow-inner font-medium h-full"
                    >
                    <option value="ALL">All Types</option>
                    <option value={TransactionType.INCOME}>Income</option>
                    <option value={TransactionType.EXPENSE}>Expense</option>
                    </select>
                    <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {isElite && (
                    <button 
                        onClick={() => setIsBatchModalOpen(true)}
                        className="bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 group"
                    >
                        <Layers className="w-4 h-4 group-hover:rotate-12 transition-transform" /> <span className="hidden md:inline">Batch Upload</span>
                    </button>
                )}

                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Add Transaction</span>
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar space-y-6 pb-4">
          {/* Header Row - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-12 px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <div className="col-span-2">Time</div>
              <div className="col-span-4">Merchant</div>
              <div className="col-span-3">Account</div>
              <div className="col-span-3 text-right">Amount</div>
          </div>

          {groupedTransactions.map(([date, txs]) => (
              <div key={date} className="space-y-3">
                  <div className="sticky top-0 z-10 bg-[#020617]/90 backdrop-blur-md py-2 px-4 md:px-6 border-b border-white/5 flex items-center justify-between shadow-lg shadow-black/20 rounded-xl mx-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{formatDateHeader(date)}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-white/5">{txs.length} Transactions</span>
                  </div>

                  {txs.map(t => (
                    <div key={t.id} className="flex flex-col gap-2">
                        <div 
                            className={`group glass-card rounded-2xl p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 items-center gap-4 transition-all duration-300 hover:bg-slate-800/40 ${
                                t.isVirtual 
                                ? 'border-dashed border-amber-500/30 bg-amber-500/[0.01] hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                                : 'hover:border-indigo-500/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                            }`}
                        >
                            <div className="w-full md:col-span-2 flex items-center gap-3 text-slate-400 order-2 md:order-1 justify-between md:justify-start">
                                <span className="text-xs font-bold font-mono text-slate-500">{new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                                <span className={`md:hidden text-lg font-black tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-400' : t.isVirtual ? 'text-amber-400 font-sans' : 'text-white'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : ''}
                                    {formatCurrency(t.amount)}
                                </span>
                            </div>

                            <div className="w-full md:col-span-4 flex items-center gap-4 order-1 md:order-2">
                                <div className={`p-2.5 rounded-full border border-white/5 shadow-sm shrink-0 transition-colors ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10' : t.isVirtual ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                                    {t.type === TransactionType.INCOME ? 
                                    <ArrowUpCircle className="w-5 h-5 text-emerald-500" /> : 
                                    t.isVirtual ? 
                                    <Sparkles className="w-5 h-5 text-amber-400" /> :
                                    <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                                    }
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="block text-base font-bold text-slate-100 group-hover:text-white truncate capitalize">{t.merchant}</span>
                                        {t.isVirtual && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider font-sans shrink-0">
                                                Planned
                                            </span>
                                        )}
                                    </div>
                                    {t.notes && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <StickyNote className="w-3 h-3 text-slate-600" />
                                            <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{t.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="hidden md:block col-span-3 order-3">
                            <div className="flex flex-col gap-1.5 items-start">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm backdrop-blur-md ${
                                        t.category === Category.FOOD ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                        t.category === Category.SHOPPING ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                        t.category === Category.TRANSPORT ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                        t.category === Category.INCOME ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        t.category === Category.SALARY ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                                        t.category === Category.FREELANCE ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                                        t.category === Category.TRADING ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                        t.category === Category.CRYPTO ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
                                        t.category === Category.BUSINESS ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                        t.category === Category.CASHBACK ? 'bg-lime-500/10 border-lime-500/20 text-lime-400' :
                                        t.category === Category.INVESTMENT ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                        t.category === Category.SUBSCRIPTION ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                        'bg-slate-800/50 border-slate-700 text-slate-400'
                                    }`}>
                                        {t.category}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black text-slate-500 border border-white/5 bg-slate-900/50 uppercase tracking-widest">
                                        <Wallet className="w-2.5 h-2.5" />
                                        {getAccountName(t.accountId)}
                                    </span>
                            </div>
                            </div>

                            <div className="hidden md:flex col-span-3 order-4 justify-end items-center gap-4">
                                <span className={`text-xl font-black tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : t.isVirtual ? 'text-amber-400' : 'text-white'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : ''}
                                    {formatCurrency(t.amount)}
                                </span>
                                
                                {t.isVirtual && onUpdate && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...t, isVirtual: false }); }}
                                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all"
                                        title="Confirm Transaction"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === t.id ? null : t.id); }}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                >
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedId === t.id ? 'rotate-180' : ''}`} />
                                </button>

                                {onDelete && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                )}
                            </div>
                        </div>

                        {expandedId === t.id && (
                            <div className="mx-2 md:mx-6 p-4 bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col gap-4 animate-slide-up shadow-inner">
                                {t.isVirtual && (
                                    <div className="p-4 bg-amber-500/[0.03] border border-amber-500/20 rounded-xl text-xs text-slate-300 flex flex-col gap-3 font-sans">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-400">
                                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Planned Pre-Transaction
                                        </div>
                                        <p className="leading-relaxed">
                                            This is a virtual transaction. It is currently factored into your daily budget and coach insights, but has not yet been deducted from your account. Did you make this transaction?
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {onUpdate && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onUpdate({ ...t, isVirtual: false }); }}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                                                >
                                                    <Check className="w-3 h-3" /> Yes, Confirm & Apply
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all border border-white/5 flex items-center gap-1.5"
                                                >
                                                    <X className="w-3 h-3" /> No, Dismiss
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {t.notes && (
                                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-200">
                                        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                            <StickyNote className="w-3 h-3" /> Your Note
                                        </div>
                                        {t.notes}
                                    </div>
                                )}
                                {t.tax !== undefined && t.tax > 0 && (
                                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-200 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-rose-400">
                                                <DollarSign className="w-3 h-3" /> Associated Tax
                                            </div>
                                            <div className="text-[10px] text-slate-400">This tax is excluded from spend & daily burn, but still reduces Safe-To-Spend.</div>
                                        </div>
                                        <span className="text-sm font-black font-mono text-rose-400">+{formatCurrency(t.tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t.category} Trend (6 Mo)
                                    </span>
                                    {(() => {
                                        const insight = getCategoryInsight(t.category, t.type);
                                        return (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${insight.className}`}>
                                                {insight.text}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="h-40 w-full relative">
                                    {(() => {
                                      const budget = budgets.find(b => b.category === t.category);
                                      return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getCategoryTrend(t.category, t.type)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#64748b" 
                                                    fontSize={10} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    dy={10}
                                                />
                                                {budget && (
                                                    <ReferenceLine 
                                                        y={budget.limit} 
                                                        stroke="#ef4444" 
                                                        strokeDasharray="3 3" 
                                                        strokeOpacity={0.8} 
                                                        label={{ position: 'insideTopLeft', value: 'BUDGET TARGET', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
                                                    />
                                                )}
                                                <Bar 
                                                    dataKey="value" 
                                                    fill="#818cf8" 
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                                    formatter={(val: number) => [formatCurrency(val), t.type === TransactionType.INCOME ? 'Total Earned' : 'Total Spent']}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                      );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                  ))}
              </div>
          ))}

          {filtered.length === 0 && (
              <div className="glass-card rounded-3xl p-20 flex flex-col items-center justify-center text-center opacity-60">
                  <Search className="w-12 h-12 text-slate-700 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">No entries found</h3>
                  <p className="text-slate-500 text-xs font-medium">Clear search or filters to restore visibility.</p>
              </div>
          )}
      </div>

      {isAddModalOpen && onAdd && (
        <AddTransactionModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={onAdd}
            accounts={accounts}
            onNavigateToAccounts={onNavigateToAccounts}
            userPlan={userPlan}
            formatCurrency={formatCurrency}
            scanUsage={scanUsage}
            onIncrementScan={onIncrementScan}
            currency={currency}
            history={transactions} // Inject history for heuristic analysis
        />
      )}

      {isBatchModalOpen && onAdd && (
        <BatchUploadModal 
            onClose={() => setIsBatchModalOpen(false)}
            onAdd={onAdd}
            accounts={accounts}
            scanUsage={scanUsage}
            onIncrementScan={onIncrementScan}
            formatCurrency={formatCurrency}
            userPlan={userPlan}
        />
      )}
    </div>
  );
};

// Batch Upload Implementation (Elite Only)
const BatchUploadModal: React.FC<{
    onClose: () => void;
    onAdd: (t: Transaction) => void;
    accounts: Account[];
    scanUsage: number;
    onIncrementScan?: () => void;
    formatCurrency: (amount: number) => string | React.ReactNode;
    userPlan: UserPlan;
}> = ({ onClose, onAdd, accounts, scanUsage, onIncrementScan, formatCurrency, userPlan }) => {
    const [files, setFiles] = useState<{ file: File; id: string; status: 'pending' | 'processing' | 'success' | 'error'; progress: number; result?: any; errorMsg?: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'manual');
    const inputRef = useRef<HTMLInputElement>(null);

    const MAX_BATCH = 10;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []).slice(0, MAX_BATCH);
        const newFiles = selected.map(f => ({
            file: f,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending' as const,
            progress: 0
        }));
        setFiles(prev => [...prev, ...newFiles].slice(0, MAX_BATCH));
    };

    const processBatch = async () => {
        setIsUploading(true);
        // Process sequentially to respect throttling and count scans correctly
        for (let i = 0; i < files.length; i++) {
            const fItem = files[i];
            if (fItem.status !== 'pending') continue;

            setFiles(prev => prev.map(p => p.id === fItem.id ? { ...p, status: 'processing', progress: 30 } : p));
            
            try {
                const base64 = await compressImage(fItem.file);
                setFiles(prev => prev.map(p => p.id === fItem.id ? { ...p, progress: 60 } : p));
                
                const result = await parseReceiptImage(base64, userPlan);
                if (result) {
                    const newTx: Transaction = {
                        id: Date.now().toString() + i,
                        date: result.date || new Date().toISOString().split('T')[0],
                        merchant: result.merchant || 'Unknown Merchant',
                        amount: result.amount || 0,
                        category: (result.category as Category) || Category.OTHER,
                        type: TransactionType.EXPENSE,
                        accountId: selectedAccountId,
                    };
                    onAdd(newTx);
                    if (onIncrementScan) onIncrementScan();
                    setFiles(prev => prev.map(p => p.id === fItem.id ? { ...p, status: 'success', progress: 100, result: newTx } : p));
                } else {
                    throw new Error("AI parsing failed");
                }
            } catch (err) {
                setFiles(prev => prev.map(p => p.id === fItem.id ? { ...p, status: 'error', progress: 100, errorMsg: "Extraction Failed" } : p));
            }
        }
        setIsUploading(false);
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
                    }
                }
            };
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white z-10"><X className="w-6 h-6" /></button>
                <div className="p-10 border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-transparent">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"><Layers className="w-8 h-8 text-white" /></div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Elite Batch Upload</h3>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Upload multiple receipts at once.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                    {files.length === 0 ? (
                        <div 
                            onClick={() => inputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/50 rounded-[2rem] p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group"
                        >
                            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileUp className="w-10 h-10 text-slate-500 group-hover:text-indigo-400" /></div>
                            <div className="text-center">
                                <p className="text-white font-bold">Drop or click to select receipts</p>
                                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-black">Max 10 per batch</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {files.map(f => (
                                <div key={f.id} className="p-5 bg-slate-900/80 rounded-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden group">
                                    {f.status === 'processing' && <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-shimmer" style={{ width: `${f.progress}%` }}></div>}
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white shrink-0">
                                        {f.status === 'success' ? <Check className="w-6 h-6 text-emerald-400" /> : f.status === 'error' ? <AlertTriangle className="w-6 h-6 text-rose-400" /> : <FileText className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-white truncate">{f.file.name}</h4>
                                            {f.status === 'success' && <span className="text-[10px] font-black text-emerald-400 uppercase">{formatCurrency(f.result.amount)}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${f.status === 'success' ? 'text-emerald-500' : f.status === 'error' ? 'text-rose-500' : 'text-slate-500'}`}>
                                                {f.status === 'pending' ? 'Ready to Upload' : f.status === 'processing' ? 'AI Analyzing...' : f.status === 'success' ? 'Added Successfully' : f.errorMsg}
                                            </span>
                                        </div>
                                    </div>
                                    {!isUploading && f.status === 'pending' && (
                                        <button onClick={() => setFiles(prev => prev.filter(p => p.id !== f.id))} className="p-2 text-slate-600 hover:text-rose-500"><X className="w-4 h-4" /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account</label>
                        <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-indigo-500 appearance-none cursor-pointer">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            <option value="manual">Manual / Cash</option>
                        </select>
                    </div>

                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500/10"><ScanLine className="w-5 h-5 text-indigo-400" /></div>
                        <div>
                            <p className="text-[10px] text-indigo-200/60 font-bold uppercase tracking-wider">Quota Telemetry</p>
                            <p className="text-xs text-white font-bold">{files.length} Scans Ready • {scanUsage} used this cycle</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-white/5 bg-slate-900/20 flex gap-4">
                    <input type="file" ref={inputRef} multiple accept="image/*" onChange={handleFileSelect} hidden />
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
                    >
                        Abort
                    </button>
                    <button 
                        disabled={files.length === 0 || isUploading}
                        onClick={processBatch}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                        {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Start Upload</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// EXPORT THIS SO DASHBOARD CAN USE IT
export const AddTransactionModal: React.FC<{ 
    onClose: () => void; 
    onAdd: (t: Transaction) => void;
    accounts: Account[];
    onNavigateToAccounts?: () => void;
    userPlan?: UserPlan;
    formatCurrency: (amount: number) => string | React.ReactNode;
    scanUsage: number;
    onIncrementScan?: () => void;
    currency: Currency;
    history?: Transaction[];
    initialData?: Transaction | null; // Added support for editing
}> = ({ onClose, onAdd, accounts, onNavigateToAccounts, userPlan = 'free', formatCurrency, scanUsage, onIncrementScan, currency, history = [], initialData }) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
    const [merchant, setMerchant] = useState(initialData?.merchant || '');
    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [category, setCategory] = useState<Category | ''>(initialData?.category || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(initialData?.accountId || accounts[0]?.id || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [tax, setTax] = useState(initialData?.tax?.toString() || '');
    const [isVirtual, setIsVirtual] = useState(initialData?.isVirtual || false);
    const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [heuristicUsed, setHeuristicUsed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isUltra = userPlan === 'ultra';
    const isPro = userPlan === 'pro';
    const scanLimit = isUltra ? 500 : isPro ? 50 : 3;
    const canScan = scanUsage < scanLimit;

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

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]); 
                    } else { reject(new Error("Canvas failure")); }
                }
            };
        });
    };

    const handleMerchantBlur = async () => {
        if (!merchant || isAutoCategorizing || category) return;
        setIsAutoCategorizing(true);
        setHeuristicUsed(false);

        // 1. Heuristic Local Lookup
        const normalizedMerchant = merchant.trim().toLowerCase();
        const pastTx = history.filter(t => t.merchant.toLowerCase().includes(normalizedMerchant) && t.type === type)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (pastTx) {
            setCategory(pastTx.category);
            setAmount(pastTx.amount.toString());
            // Optionally set account if it exists in current accounts list
            if (accounts.some(a => a.id === pastTx.accountId)) {
                setSelectedAccountId(pastTx.accountId);
            }
            setHeuristicUsed(true);
            setIsAutoCategorizing(false);
            return;
        }

        // 2. Fallback to AI (if Pro+)
        if (!isPro) {
            setIsAutoCategorizing(false);
            return;
        }

        try {
            const predicted = await categorizeTransaction(merchant, parseFloat(amount) || 0, userPlan);
            if (Object.values(Category).includes(predicted as Category)) setCategory(predicted as Category);
        } finally { setIsAutoCategorizing(false); }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanning(true);
        setScanError(null);
        try {
            const base64 = await compressImage(file);
            const result = await parseReceiptImage(base64, userPlan as UserPlan);
            if (result) {
                setMerchant(result.merchant || '');
                setAmount(result.amount?.toString() || '');
                if (result.date) setDate(result.date);
                if (onIncrementScan) onIncrementScan();
            } else { setScanError("AI could not parse receipt. Entry required manually."); }
        } catch (err) { setScanError("Scanning protocol failure."); } finally { setIsScanning(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchant || !amount || !category) return;
        if (type === TransactionType.EXPENSE && !selectedAccountId) return;
        const newTx: Transaction = {
            id: initialData ? initialData.id : Date.now().toString(),
            date,
            merchant,
            amount: parseFloat(amount),
            category: category as Category,
            type,
            accountId: selectedAccountId || 'manual',
            notes,
            tax: type === TransactionType.EXPENSE && tax ? parseFloat(tax) : undefined,
            isVirtual
        };
        onAdd(newTx);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden animate-slide-up flex flex-col max-h-[90vh] relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10"><X className="w-6 h-6" /></button>
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-indigo-900/20 to-transparent">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{initialData ? 'Edit Transaction' : 'Add New Transaction'}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{initialData ? 'Modify transaction data.' : 'Record your expenses and income.'}</p>
                </div>
                <div className="overflow-y-auto p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!initialData && (
                            <div className="relative">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} hidden />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!canScan || isScanning}
                                    className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${isScanning ? 'border-indigo-500 bg-indigo-500/10' : !canScan ? 'opacity-50 grayscale cursor-not-allowed' : 'border-slate-700 bg-slate-800/30 hover:border-indigo-500 hover:text-white text-slate-400'}`}
                                >
                                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <Camera className="w-5 h-5" />}
                                    <span className="text-xs font-black uppercase tracking-widest">{isScanning ? "Analyzing..." : !canScan ? "Scan Limit Reached" : "Scan Receipt"}</span>
                                </button>
                            </div>
                        )}

                        <div className="relative flex bg-slate-950 rounded-2xl p-1.5 border border-white/10 h-14">
                            <div className={`absolute top-1.5 bottom-1.5 rounded-xl shadow-lg transition-all duration-300 ${type === TransactionType.EXPENSE ? 'left-1.5 w-[calc(50%-6px)] bg-rose-600' : 'left-[calc(50%+3px)] w-[calc(50%-6px)] bg-emerald-600'}`}></div>
                            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`relative z-10 flex-1 text-xs font-black uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'text-white' : 'text-slate-500'}`}>Expense</button>
                            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`relative z-10 flex-1 text-xs font-black uppercase tracking-widest ${type === TransactionType.INCOME ? 'text-white' : 'text-slate-500'}`}>Income</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</label>
                                <div className="relative mt-2">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 pl-9 text-white focus:border-indigo-500 focus:outline-none font-mono text-lg" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none text-sm [color-scheme:dark]" />
                            </div>
                        </div>

                        {type === TransactionType.EXPENSE && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tax (Optional)</label>
                                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Excluded from Burn</span>
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 pl-9 text-white focus:border-indigo-500 focus:outline-none font-mono text-sm" placeholder="0.00" />
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant / Source</label>
                                {heuristicUsed && <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 animate-fade-in"><History className="w-3 h-3" /> Auto-Filled</span>}
                            </div>
                            <input required type="text" value={merchant} onChange={e => setMerchant(e.target.value)} onBlur={handleMerchantBlur} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none text-sm" placeholder="Starbucks, Apple, Salary..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                <select required value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none focus:xs appearance-none cursor-pointer">
                                    <option value="" disabled>Select Category</option>
                                    {(type === TransactionType.INCOME ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account</label>
                                <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none text-xs appearance-none cursor-pointer">
                                    <option value="manual">Manual / Cash</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl animate-fade-in">
                            <div className="flex flex-col gap-0.5 pr-2">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                                    <Sparkles className="w-3.5 h-3.5" /> Pre-Transaction (Planned)
                                </span>
                                <span className="text-[10px] text-slate-400 font-sans">
                                    Include in Daily Analysis but do not deduct balance yet.
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input 
                                    type="checkbox" 
                                    checked={isVirtual} 
                                    onChange={e => setIsVirtual(e.target.checked)} 
                                    className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-slate-950 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950 peer-checked:after:border-amber-400"></div>
                            </label>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none text-sm h-24 resize-none" 
                                placeholder="Add context to this transaction..."
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">
                            {initialData ? 'Update Transaction' : 'Add Transaction'}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Transactions;
