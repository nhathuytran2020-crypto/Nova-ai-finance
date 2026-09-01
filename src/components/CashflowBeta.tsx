import React, { useMemo, useState } from 'react';
import { Transaction, Account, Goal, TransactionType, UserPlan, Category } from '../types';
import { 
  Flame, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Activity, 
  EyeOff, 
  Eye, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  Calendar, 
  Filter, 
  Sparkles, 
  Database, 
  ListOrdered,
  Layers,
  HelpCircle,
  TrendingUp,
  CircleHelp
} from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid 
} from 'recharts';

interface CashflowBetaProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  formatCurrency: (amount: number) => string | React.ReactNode;
  userPlan: UserPlan;
}

// Generate organic 12-month sample transactions to populate empty states
const generateDemoTransactions = (year: number): Transaction[] => {
  const demoList: Transaction[] = [];
  
  // Salary is deposited monthly on the 1st
  for (let m = 0; m < 12; m++) {
    // Income
    demoList.push({
      id: `demo-inc1-${m}`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-01`,
      merchant: 'Stripe Direct Deposit',
      amount: 4750,
      category: Category.INCOME,
      type: TransactionType.INCOME,
      accountId: 'checking-1'
    });
    
    // Rent/Housing on the 2nd
    demoList.push({
      id: `demo-rent-${m}`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-02`,
      merchant: 'Acme Properties landlord',
      amount: 1450,
      category: Category.HOUSING,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });

    // Utilities on the 5th
    demoList.push({
      id: `demo-util-${m}`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-05`,
      merchant: 'Constellation Grid',
      amount: m % 2 === 0 ? 175 : 195,
      category: Category.UTILITIES,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });

    // Subscriptions on the 10th
    demoList.push({
      id: `demo-sub-${m}`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-10`,
      merchant: 'Netflix Premium tier',
      amount: 22.99,
      category: Category.SUBSCRIPTION,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });

    demoList.push({
      id: `demo-sub2-${m}`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-12`,
      merchant: 'Claude AI Plus subscription',
      amount: 20.00,
      category: Category.SUBSCRIPTION,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });

    // Food & Dining
    demoList.push({
      id: `demo-food-${m}-1`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-08`,
      merchant: 'Safeway Supermarket',
      amount: 215.40,
      category: Category.FOOD,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });
    demoList.push({
      id: `demo-food-${m}-2`,
      date: `${year}-${String(m + 1).padStart(2, '0')}-21`,
      merchant: 'Sake Sushi Bar',
      amount: m % 3 === 0 ? 120.00 : 75.00,
      category: Category.FOOD,
      type: TransactionType.EXPENSE,
      accountId: 'checking-1'
    });

    // Shopping / Seasonal variance
    if (m === 11) { // Holiday shopping in Dec
      demoList.push({
        id: `demo-shop-${m}`,
        date: `${year}-12-19`,
        merchant: 'Target Holiday Gift shop',
        amount: 850.00,
        category: Category.SHOPPING,
        type: TransactionType.EXPENSE,
        accountId: 'checking-1'
      });
    } else if (m === 6) { // Vacation in Jul
      demoList.push({
        id: `demo-travel-${m}`,
        date: `${year}-07-16`,
        merchant: 'Kayak Airline reservation',
        amount: 650.00,
        category: Category.TRAVEL,
        type: TransactionType.EXPENSE,
        accountId: 'checking-1'
      });
    } else if (m % 3 === 1) {
      demoList.push({
        id: `demo-shop-${m}`,
        date: `${year}-${String(m + 1).padStart(2, '0')}-15`,
        merchant: 'Amazon Marketplace Order',
        amount: 110.50,
        category: Category.SHOPPING,
        type: TransactionType.EXPENSE,
        accountId: 'checking-1'
      });
    }
  }
  return demoList;
};

const CashflowBeta: React.FC<CashflowBetaProps> = ({ transactions, accounts, formatCurrency }) => {
  const [isSandbox, setIsSandbox] = useState<boolean>(transactions.length === 0);
  
  // Year travel shift state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Selected month state inside the active trajectory (0-11, defaults to current month)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  
  // Granular Filter categories
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Years that contain transaction logs
  const availableYears = useMemo(() => {
    const list = isSandbox ? generateDemoTransactions(selectedYear) : transactions;
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    list.forEach(t => {
      const yr = new Date(t.date).getFullYear();
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, isSandbox, selectedYear]);

  // Handle year shifting
  const handleShiftYear = (direction: -1 | 1) => {
    setSelectedYear(prev => {
      const target = prev + direction;
      return target;
    });
  };

  // Safe manual currency format converter for the tooltip & pure numbers
  const formatCurrencyVal = (value: number) => {
    return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Compute 12-Month stats sequence
  const monthlyTimelineData = useMemo(() => {
    const activeList = isSandbox ? generateDemoTransactions(selectedYear) : transactions;
    
    const monthsLookup = [
      { name: 'Jan', index: 0 },
      { name: 'Feb', index: 1 },
      { name: 'Mar', index: 2 },
      { name: 'Apr', index: 3 },
      { name: 'May', index: 4 },
      { name: 'Jun', index: 5 },
      { name: 'Jul', index: 6 },
      { name: 'Aug', index: 7 },
      { name: 'Sep', index: 8 },
      { name: 'Oct', index: 9 },
      { name: 'Nov', index: 10 },
      { name: 'Dec', index: 11 }
    ];

    // Read liquid balance baseline (default checking & savings balances of the system today)
    const baselineBalance = accounts
      .filter(a => ['Checking', 'Savings'].includes(a.type))
      .reduce((acc, a) => acc + a.balance, 0) || 12000;

    let runningTrajectoryAccumulator = baselineBalance - 8000; // start index lower to showcase historical escalation path

    return monthsLookup.map(m => {
      const monthTransactions = activeList.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m.index && d.getFullYear() === selectedYear;
      });

      const income = monthTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      const net = income - expenses;
      runningTrajectoryAccumulator += net;

      // Savings Rate %: (net savings / income) * 100
      const savingsRate = income > 0 ? Math.round((net / income) * 100) : (net > 0 ? 100 : 0);

      return {
        name: m.name,
        monthIndex: m.index,
        income,
        expenses,
        net,
        trajectory: runningTrajectoryAccumulator,
        savingsRate,
        transactions: monthTransactions
      };
    });
  }, [transactions, selectedYear, isSandbox, accounts]);

  // Read current selected month values
  const activeMonthData = useMemo(() => {
    return monthlyTimelineData[selectedMonthIndex] || {
      name: 'N/A',
      monthIndex: selectedMonthIndex,
      income: 0,
      expenses: 0,
      net: 0,
      trajectory: 0,
      savingsRate: 0,
      transactions: []
    };
  }, [monthlyTimelineData, selectedMonthIndex]);

  // Aggregate Category statistics specifically for the active selected month
  const categorySplitData = useMemo(() => {
    const list = activeMonthData.transactions;
    const expenseOnly = list.filter(t => t.type === TransactionType.EXPENSE);
    const totalSpent = expenseOnly.reduce((acc, t) => acc + t.amount, 0) || 1;
    
    const catMap: Record<string, number> = {};
    expenseOnly.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    return Object.entries(catMap).map(([category, value]) => {
      return {
        category: category as Category,
        value,
        percentage: Math.round((value / totalSpent) * 100)
      };
    }).sort((a,b) => b.value - a.value);
  }, [activeMonthData]);

  // Filters actual transactions for detail display list
  const filteredActiveTransactions = useMemo(() => {
    let list = activeMonthData.transactions;
    if (selectedCategory) {
      list = list.filter(t => t.category === selectedCategory);
    }
    // Sort by date descending
    return [...list].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeMonthData, selectedCategory]);

  // Composed Chart custom Tooltip
  const CustomComposedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPayload = payload[0].payload;
      const netVal = dataPayload.net;
      const isPositive = netVal >= 0;
      return (
        <div className="bg-slate-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-sans min-w-[200px] z-50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">
            {label} {selectedYear}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Income:</span>
              <span className="font-mono font-bold text-emerald-400">+{formatCurrencyVal(dataPayload.income)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Expense:</span>
              <span className="font-mono font-bold text-rose-400">-{formatCurrencyVal(dataPayload.expenses)}</span>
            </div>
            <div className="border-t border-white/5 pt-1.5 flex justify-between items-center">
              <span className="text-slate-200">Net Flow:</span>
              <span className={`font-mono font-black ${isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                {isPositive ? '+' : ''}{formatCurrencyVal(netVal)}
              </span>
            </div>
            <div className="border-t border-white/5 pt-1 flex justify-between items-center text-indigo-300">
              <span>Net Wealth Index:</span>
              <span className="font-mono font-bold">{formatCurrencyVal(dataPayload.trajectory)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-slide-up pb-10 space-y-6 w-full font-sans">
      
      {/* Main Visualizer Composed Chart Card */}
      <div className="bg-[#0f172a]/60 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Title / Controls Header line */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-indigo-400" /> Monthly Money Cash Flow
            </h3>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Select any month from the chart below to inspect category sharing and transactions
            </p>
          </div>

          {/* Integrated Minimialist Action Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Source Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/5 rounded-2xl p-1 shadow-md">
              <button
                onClick={() => {
                  setIsSandbox(false);
                  setSelectedMonthIndex(new Date().getMonth());
                  setSelectedCategory(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isSandbox 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Use Live Data
              </button>
              <button
                onClick={() => {
                  setIsSandbox(true);
                  setSelectedMonthIndex(new Date().getMonth());
                  setSelectedCategory(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSandbox 
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Use Demo Data
              </button>
            </div>

            {/* Time Travel Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Select Year:</span>
              <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-2xl p-1 shadow-lg">
                <button 
                  onClick={() => handleShiftYear(-1)}
                  id="btn_year_prev"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  ←
                </button>
                <span className="px-4 font-mono text-xs font-black tracking-widest text-[#f59e0b]">{selectedYear}</span>
                <button 
                  onClick={() => handleShiftYear(1)}
                  id="btn_year_next"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Composed Chart Plot Container */}
        <div className="relative z-10 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyTimelineData}
              onClick={(clickEvent) => {
                if (clickEvent && typeof clickEvent.activeTooltipIndex === 'number') {
                  setSelectedMonthIndex(clickEvent.activeTooltipIndex);
                  setSelectedCategory(null);
                }
              }}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="positiveGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="negativeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#475569" 
                fontSize={11} 
                fontFamily="monospace"
                tickLine={false} 
                axisLine={false}
                className="font-bold"
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                fontFamily="monospace"
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CustomComposedTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }} />
              
              {/* Monthly Net Flows represented as Bars */}
              <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                {monthlyTimelineData.map((entry, index) => {
                  const isSelected = index === selectedMonthIndex;
                  const isPositive = entry.net >= 0;
                  let fillAmount = isPositive ? '#10b981' : '#f43f5e';
                  if (!isSelected) {
                    fillAmount = isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)';
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={fillAmount}
                      stroke={isSelected ? '#ffffff' : 'transparent'}
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-300"
                    />
                  );
                })}
              </Bar>
              
              {/* Continuous trajectory path index */}
              <Line 
                type="monotone" 
                dataKey="trajectory" 
                stroke="#818cf8" 
                strokeWidth={3} 
                dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 1, fill: '#ffffff' }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Month Selector Buttons for Touch/Mobile Devices */}
        <div className="relative z-10 flex gap-1.5 mt-4 overflow-x-auto custom-scrollbar no-scrollbar py-1">
          {monthlyTimelineData.map((m, idx) => {
            const isActive = idx === selectedMonthIndex;
            const isNetPositive = m.net >= 0;
            return (
              <button
                key={`pill-${idx}`}
                onClick={() => {
                  setSelectedMonthIndex(idx);
                  setSelectedCategory(null);
                }}
                id={`btn_month_pill_${m.name.toLowerCase()}`}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl uppercase tracking-wider transition-all min-w-[55px] ${
                  isActive 
                    ? 'bg-white text-slate-950 font-bold shadow-lg scale-105' 
                    : isNetPositive 
                      ? 'bg-slate-950/80 text-emerald-400 hover:bg-slate-850 border border-emerald-500/10'
                      : 'bg-slate-950/80 text-rose-400 hover:bg-slate-850 border border-rose-500/10'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================== QUICK-STATS GRID =================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* INFLOWS CARD */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Money In</h4>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-2 tracking-tight">
            +{formatCurrency(activeMonthData.income)}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-black">
            {activeMonthData.name} {selectedYear}
          </div>
        </div>

        {/* OUTFLOWS CARD */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-rose-500/5 flex items-center justify-center border border-rose-500/10">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          </div>
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Money Out</h4>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-2 tracking-tight">
            -{formatCurrency(activeMonthData.expenses)}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-black">
            {activeMonthData.name} {selectedYear}
          </div>
        </div>

        {/* NET DIFFERENCE CARD */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className={`absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center border ${
            activeMonthData.net >= 0 
              ? 'bg-emerald-500/5 border-emerald-500/10 text-[#10b981]' 
              : 'bg-rose-500/5 border-rose-500/10 text-[#f43f5e]'
          }`}>
            {activeMonthData.net >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Leftover Money</h4>
          <div className={`text-lg sm:text-2xl font-black mt-2 tracking-tight ${
            activeMonthData.net >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'
          }`}>
            {activeMonthData.net >= 0 ? '+' : ''}{formatCurrency(activeMonthData.net)}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-black">
            {activeMonthData.net >= 0 ? 'surplus month' : 'deficit month'}
          </div>
        </div>

        {/* SAVINGS RATE CARD */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10">
            <Flame className="w-5 h-5 text-indigo-400" />
          </div>
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Saved Percentage</h4>
          <div className="text-lg sm:text-2xl font-black text-indigo-400 mt-2 tracking-tight">
            {activeMonthData.savingsRate}%
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-black">
            of income saved
          </div>
        </div>

      </div>

      {/* =================== CATEGORIES SPLIT AND LEDGER =================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Categories Split Sidebar Column */}
        <div className="bg-[#0f172a]/40 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 p-5 sm:p-6 shadow-xl space-y-4">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4" /> Where Money Goes
          </h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Click any category pill below to isolate transactions for {activeMonthData.name}.
          </p>

          {categorySplitData.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium italic">
              No calculated expenses for {activeMonthData.name}.
            </div>
          ) : (
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setSelectedCategory(null)}
                id="btn_filter_cat_all"
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border flex justify-between items-center ${
                  selectedCategory === null 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                    : 'bg-slate-950/45 border-transparent text-slate-400 hover:bg-slate-950/70 hover:text-white'
                }`}
              >
                <span>All categories</span>
                <span className="font-bold text-[10px] bg-white/5 px-2 py-0.5 rounded-lg text-slate-300">
                  {categorySplitData.length} items
                </span>
              </button>

              {categorySplitData.map((cat, i) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={`cat-agg-${i}`}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                    id={`btn_filter_cat_${cat.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                        : 'bg-slate-950/45 border-transparent text-slate-400 hover:bg-slate-950/70 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full font-bold">
                      <span>{cat.category}</span>
                      <span className="font-bold tracking-tight">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full" 
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 w-full">
                      <span>Share of expenses</span>
                      <span>{cat.percentage}% of total</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Granular Transactions List Log panel */}
        <div className="lg:col-span-2 bg-[#0f172a]/40 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <ListOrdered className="w-4 h-4" /> Monthly Transactions Ledger
              </h4>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  id="btn_clear_cat_filter"
                  className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Conditional Transaction List - Empty State Logic */}
            {filteredActiveTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-[1.5rem] bg-slate-900/10 backdrop-blur-sm transform transition-all duration-500 my-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 mb-4 border border-white/5">
                  <Clock className="w-8 h-8 text-indigo-400 opacity-60" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">No matching transactions</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm px-6 leading-relaxed">
                  No income or expense records found for {activeMonthData.name} {selectedYear}. Use the "Use Demo Data" button above to view a fully filled sandbox layout.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                {filteredActiveTransactions.map((tx, idx) => {
                  const isIncome = tx.type === TransactionType.INCOME;
                  return (
                    <div 
                      key={tx.id || idx} 
                      className="bg-slate-950/45 border border-white/5 rounded-xl p-3.5 transition-all hover:bg-slate-900/60 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${
                          isIncome 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-white truncate uppercase tracking-widest">{tx.merchant}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">{tx.date}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className="text-[9px] uppercase font-black bg-white/5 text-slate-400 px-1.5 py-0.5 rounded-md">{tx.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`font-bold tracking-tight text-xs shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aesthetic footer */}
          {filteredActiveTransactions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Displaying {filteredActiveTransactions.length} items</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default CashflowBeta;
