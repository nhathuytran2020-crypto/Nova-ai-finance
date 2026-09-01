import React, { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Line, AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Account, Transaction, TransactionType, Category, UserPlan, Goal, Budget, SpendingStatus, SpendingPeriod, Currency } from '../types';
import { Lightbulb, Flame, Wallet, CreditCard, Target, Zap, Microscope, FileText, ChevronDown, AlignLeft, GitFork, UserCircle, PieChart as PieChartIcon, TrendingUp, AlertCircle, Check, Plus, Rocket, BarChart3, Clock, Shield, Handshake, Gauge, ArrowUp, CalendarClock, CheckCircle2, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Activity, TrendingDown, Eye, EyeOff, Calendar, Sparkles, Edit2, Trash2, Info, XCircle } from 'lucide-react';
import { AddTransactionModal } from './Transactions'; // Import Modal
import { PocketMoneyCard } from './PocketMoneyCard';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  onNavigate: (tab: string, params?: any) => void;
  onAddAccount?: () => void;
  onAddTransaction?: () => void;
  onAddGoal?: () => void;
  formatCurrency: (amount: number) => string | React.ReactNode;
  userPlan?: UserPlan;
  onAskCoach?: (message: string) => void;
  isPinMode?: boolean;
  pinnedIds?: string[];
  onTogglePin?: (id: string) => void;
  trackEvent?: (id: string) => void;
  insightUsage?: number;
  spendingStatus?: SpendingStatus;
  currentPeriodSpend?: number;
  spendingLimit?: number;
  spendingPeriod?: SpendingPeriod;
  userName?: string;
  isPrivacyMode?: boolean;
  onTogglePrivacy?: () => void;
  creditScore?: number;
  onDeleteTransaction?: (id: string) => void; // New Prop
  onUpdateTransaction?: (t: Transaction) => void; // New Prop
  onAddTransactionObject?: (t: Transaction) => void; // New Prop
  currency?: Currency; // Added for modal prop
}

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const CircularProgress = ({ percentage, color }: { percentage: number, color: string }) => {
  const radius = 10; // Small radius for the mini charts
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle cx="16" cy="16" r={radius} stroke="#1e293b" strokeWidth="3" fill="transparent" />
        {/* Progress Circle */}
        <circle 
          cx="16" 
          cy="16" 
          r={radius} 
          stroke={color} 
          strokeWidth="3" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
};

const CustomChartTooltip = ({ active, payload, label, formatCurrency }: any) => {
    if (active && payload && payload.length) {
        const currentData = payload.find((p: any) => p.dataKey === 'ThisMonth');
        const prevData = payload.find((p: any) => p.dataKey === 'Comparison');
        
        const valCurrent = currentData ? currentData.value : 0;
        const valPrev = prevData ? prevData.value : 0;
        const delta = valCurrent - valPrev;
        
        return (
            <div className="bg-[#020617]/90 border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl min-w-[180px] animate-fade-in z-50">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Day {label}</div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                            <span className="text-xs font-bold text-indigo-100">Current</span>
                        </div>
                        <span className="text-sm font-black text-white">{formatCurrency(valCurrent)}</span>
                    </div>

                    <div className="flex justify-between items-center opacity-60">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <span className="text-xs font-bold text-slate-300">Previous</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{formatCurrency(valPrev)}</span>
                    </div>
                    
                    {valPrev > 0 && (
                        <div className={`flex justify-between items-center pt-2 border-t border-white/5 text-[10px] font-black uppercase tracking-wider ${delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            <span>Variance</span>
                            <span>{delta > 0 ? '+' : ''}{formatCurrency(delta)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const CreditScoreGauge = ({ score, onNavigate }: { score: number, onNavigate: (tab: string) => void }) => {
    // If score is 0 or undefined, show "Set Score" state
    if (!score || score === 0) {
        return (
            <div className="flex flex-col items-center justify-center relative w-full h-full p-4 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Gauge className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1 uppercase tracking-wider">Score Not Set</h3>
                <p className="text-slate-500 text-[10px] mb-4 max-w-[120px] font-medium">Configure your credit score in settings.</p>
                <button 
                    onClick={() => onNavigate('settings')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                >
                    Configure
                </button>
            </div>
        );
    }

    const max = 850;
    const min = 300;
    const range = max - min;
    const percentage = Math.min(Math.max((score - min) / range, 0), 1) * 100;
    
    // SVG Geometry for a 260-degree arc gauge
    const size = 160; 
    const strokeWidth = 12; 
    const center = size / 2;
    const radius = (size - strokeWidth) / 2 - 10;
    const startAngle = 140; // degrees
    const endAngle = 400; // degrees (140 + 260)
    const totalAngle = 260;
    
    const angleToRad = (angle: number) => (angle * Math.PI) / 180;
    
    const calculatePath = (percent: number) => {
        const start = angleToRad(startAngle);
        const end = angleToRad(startAngle + (percent / 100) * totalAngle);
        
        const x1 = center + radius * Math.cos(start);
        const y1 = center + radius * Math.sin(start);
        const x2 = center + radius * Math.cos(end);
        const y2 = center + radius * Math.sin(end);
        
        const largeArc = (percent / 100) * totalAngle > 180 ? 1 : 0;
        
        // If 0%, draw nothing to avoid artifact
        if (percent <= 0) return "";
        
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    let statusText = 'Good';
    let statusColor = 'text-emerald-400';
    let statusBg = 'bg-emerald-500/10 border-emerald-500/20';

    if (score >= 800) { statusText = 'Excellent'; }
    else if (score >= 740) { statusText = 'Very Good'; }
    else if (score >= 670) { statusText = 'Good'; statusColor = 'text-blue-400'; statusBg = 'bg-blue-500/10 border-blue-500/20'; }
    else if (score >= 580) { statusText = 'Fair'; statusColor = 'text-amber-400'; statusBg = 'bg-amber-500/10 border-amber-500/20'; }
    else { statusText = 'Poor'; statusColor = 'text-rose-400'; statusBg = 'bg-rose-500/10 border-rose-500/20'; }

    return (
        <div className="flex flex-col items-center justify-center relative w-full h-full">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {/* Track */}
                    <path 
                        d={calculatePath(100)} 
                        fill="none" 
                        stroke="#1e293b" 
                        strokeWidth={strokeWidth} 
                        strokeLinecap="round" 
                    />
                    {/* Progress */}
                    <path 
                        d={calculatePath(percentage)} 
                        fill="none" 
                        stroke="url(#gaugeGradient)" 
                        strokeWidth={strokeWidth} 
                        strokeLinecap="round" 
                        filter="url(#glow)"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">FICO</span>
                    <div className="text-3xl font-black text-white tracking-tighter leading-none">{score}</div>
                    <div className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded border ${statusColor} ${statusBg}`}>{statusText}</div>
                </div>
            </div>
            
            <div className="absolute -bottom-2 flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/5 shadow-lg backdrop-blur-sm">
                <span className="text-[8px] text-slate-400 font-bold uppercase">Updated Today</span>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = React.memo(({ 
    accounts, 
    transactions, 
    goals, 
    budgets,
    onNavigate, 
    onAddAccount, 
    onAddTransaction, 
    onAddGoal, 
    formatCurrency, 
    userPlan, 
    onAskCoach, 
    insightUsage = 0,
    spendingStatus,
    currentPeriodSpend = 0,
    spendingLimit = 1000,
    spendingPeriod = 'monthly',
    userName = 'Pilot',
    isPrivacyMode = false,
    onTogglePrivacy,
    creditScore = 0,
    onDeleteTransaction,
    onUpdateTransaction,
    onAddTransactionObject,
    currency = 'USD'
}) => {
  const [spendingComparison, setSpendingComparison] = useState<'year' | 'month'>('month');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const [openTransactionMenuId, setOpenTransactionMenuId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showHealthInfo, setShowHealthInfo] = useState(false);
  const [expandedHealthSection, setExpandedHealthSection] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<{ merchant: string; amount: number; daysLeft: number; date: Date } | null>(null);
  
  // Close menus on click outside
  useEffect(() => {
      const handleClickOutside = () => {
          setActiveMenu(null);
          setOpenTransactionMenuId(null);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, menuId: string) => {
      e.stopPropagation();
      setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const toggleTransactionMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setOpenTransactionMenuId(openTransactionMenuId === id ? null : id);
  };

  const handleEditClick = (t: Transaction) => {
      setEditingTransaction(t);
      setOpenTransactionMenuId(null);
  };

  const handleDeleteClick = (id: string) => {
      if (onDeleteTransaction) onDeleteTransaction(id);
      setOpenTransactionMenuId(null);
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Capture timestamp on mount/render for "Last Updated"
  const lastUpdated = useMemo(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []);

  const netWorth = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);
  
  const { netWorthHistory, netWorthGrowth } = useMemo(() => {
    const history = [];
    let runningNetWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    // Day 0 (today)
    history.unshift({ value: runningNetWorth });

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    for (let i = 1; i < 7; i++) {
        // Find transactions for (today - i)
        const dEnd = new Date(startOfToday);
        dEnd.setDate(dEnd.getDate() - (i - 1));
        const dStart = new Date(startOfToday);
        dStart.setDate(dStart.getDate() - i);

        // Reverse the transactions to find previous balance
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= dStart && tDate < dEnd) {
                if (t.type === TransactionType.EXPENSE) runningNetWorth += t.amount;
                if (t.type === TransactionType.INCOME) runningNetWorth -= t.amount;
            }
        });
        history.unshift({ value: runningNetWorth });
    }

    const startValue = history[0].value;
    const endValue = history[history.length - 1].value;
    const growth = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : (endValue > 0 ? 100 : 0);

    return { netWorthHistory: history, netWorthGrowth: growth };
  }, [accounts, transactions]);

  const stats = useMemo(() => {
    const currentMTDExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === TransactionType.EXPENSE && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMTDTotal = currentMTDExpenses.reduce((acc, t) => acc + t.amount, 0);
    const currentDay = today.getDate();
    const currentDailyAvg = currentMTDTotal / Math.max(currentDay, 1);
    
    // Calculate Today's Burn and Yesterday's Burn
    // In UTC date or local, matching the transactions which are usually ISO strings
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    
    const startOfTomorrow = new Date(today);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    let todayBurn = 0;
    let yesterdayBurn = 0;

    transactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE) {
            const d = new Date(t.date);
            if (d >= startOfToday && d < startOfTomorrow) {
                todayBurn += t.amount;
            } else if (d >= startOfYesterday && d < startOfToday) {
                yesterdayBurn += t.amount;
            }
        }
    });

    let burnChangePct = 0;
    if (yesterdayBurn > 0) {
        burnChangePct = ((todayBurn - yesterdayBurn) / yesterdayBurn) * 100;
    } else if (todayBurn > 0) {
        burnChangePct = 100;
    }

    return { 
        currentDailyAvg,
        todayBurn, 
        yesterdayBurn, 
        burnChangePct
    };
  }, [transactions, currentMonth, currentYear]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const dynamicBudgetStats = useMemo(() => {
    let activeBudgets = budgets;
    if (!activeBudgets || activeBudgets.length === 0) {
        activeBudgets = [
            { id: '1', category: 'Housing' as any, limit: 1500, currentAmount: 0 },
            { id: '2', category: 'Utilities' as any, limit: 200, currentAmount: 0 },
            { id: '3', category: 'Subscription' as any, limit: 100, currentAmount: 0 },
            { id: '4', category: 'Food & Dining' as any, limit: 600, currentAmount: 0 },
            { id: '5', category: 'Transport' as any, limit: 200, currentAmount: 0 },
            { id: '6', category: 'Shopping' as any, limit: 300, currentAmount: 0 },
            { id: '7', category: 'Entertainment' as any, limit: 150, currentAmount: 0 },
        ];
    }
    let budgeted = 0;
    activeBudgets.forEach(b => budgeted += b.limit);
    let actual = 0;
    currentMonthTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => actual += t.amount);
    return { budgeted, actual, remaining: budgeted - actual };
  }, [budgets, currentMonthTransactions]);

  const currentMonthRatio = useMemo(() => {
      const income = currentMonthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const expense = currentMonthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      const ratio = income > 0 ? (expense / income) * 100 : 0;
      return { ratio, income, expense };
  }, [currentMonthTransactions]);

  const expenditureData = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === TransactionType.EXPENSE);

    const total = expenses.reduce((acc, t) => acc + t.amount, 0);
    const catMap: Record<string, number> = {};

    expenses.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    let sorted = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    
    const topCategory = sorted[0]; // Capture true top category before grouping

    // Logic: Top 5 Categories, rest group as "Other"
    if (sorted.length > 5) {
        const top5 = sorted.slice(0, 5);
        const othersValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
        sorted = [...top5, { name: 'Other', value: othersValue }];
    }

    if (sorted.length === 0) {
        return { chartData: [], total: 0, isEmpty: true, topCategory: null };
    }

    return { chartData: sorted, total, isEmpty: false, topCategory };
  }, [transactions, currentMonth, currentYear]);

  const isZeroTransactionHistory = useMemo(() => {
    return transactions.length === 0;
  }, [transactions]);

  const lineChartData = useMemo(() => {
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    
    // If no transactions exist, render interactive fallback / sample baseline trajectory
    if (isZeroTransactionHistory) {
      const currentDay = today.getDate();
      for (let i = 1; i <= daysInCurrentMonth; i++) {
        // Modeled comparison baseline: smooth progression up to ~1800
        const compVal = Math.round(1800 * (1 - Math.exp(-0.08 * i)));
        // Modeled current month baseline: gentle curve up to current day, then projected
        const thisVal = i <= currentDay 
          ? Math.round(1400 * (1 - Math.exp(-0.07 * i))) 
          : Math.round(1400 * (1 - Math.exp(-0.07 * currentDay)));
        data.push({
          day: i,
          ThisMonth: thisVal,
          Comparison: compVal,
          isBaseline: true
        });
      }
      return data;
    }

    // Calculate comparison month/year
    let compMonth = currentMonth - 1;
    let compYear = currentYear;
    if (spendingComparison === 'year') {
        compYear = currentYear - 1;
        compMonth = currentMonth;
    } else if (compMonth < 0) {
        compMonth = 11;
        compYear = currentYear - 1;
    }

    const currentDaily = new Array(32).fill(0);
    const comparisonDaily = new Array(32).fill(0);

    // Single pass for all daily sums
    transactions.forEach(t => {
        if (t.type !== TransactionType.EXPENSE) return;
        const d = new Date(t.date);
        const m = d.getMonth();
        const y = d.getFullYear();
        const day = d.getDate();

        if (m === currentMonth && y === currentYear) {
            currentDaily[day] += t.amount;
        } else if (m === compMonth && y === compYear) {
            comparisonDaily[day] += t.amount;
        }
    });

    // Cumulative sums
    for (let i = 1; i < 32; i++) {
        currentDaily[i] += currentDaily[i-1];
        comparisonDaily[i] += comparisonDaily[i-1];
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
        data.push({
            day: i,
            ThisMonth: currentDaily[i],
            Comparison: comparisonDaily[i] 
        });
    }
    return data;
  }, [isZeroTransactionHistory, transactions, currentMonth, currentYear, spendingComparison, today]);

  // Insight Metric: Month over Month
  const spendingInsight = useMemo(() => {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = currentYear - 1; }

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let totalDiscretionary = 0;
    const avoidableClusters: Record<string, number> = {
        [Category.SUBSCRIPTION]: 0,
        [Category.FOOD]: 0,
        [Category.ENTERTAINMENT]: 0,
        [Category.SHOPPING]: 0
    };

    transactions.forEach(t => {
        if (t.type !== TransactionType.EXPENSE) return;
        const d = new Date(t.date);
        const m = d.getMonth();
        const y = d.getFullYear();

        if (m === currentMonth && y === currentYear) {
            thisMonthTotal += t.amount;
            
            const isFixed = [Category.HOUSING, Category.UTILITIES, Category.HEALTH, Category.EDUCATION].includes(t.category);
            if (!isFixed) {
                totalDiscretionary += t.amount;
                if (t.category in avoidableClusters) {
                    avoidableClusters[t.category] += t.amount;
                }
            }
        } else if (m === prevMonth && y === prevYear) {
            lastMonthTotal += t.amount;
        }
    });

    const percentage = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    let targetCluster = '';
    let maxClusterSpend = 0;
    Object.entries(avoidableClusters).forEach(([category, amount]) => {
        if (amount > maxClusterSpend) {
            maxClusterSpend = amount;
            targetCluster = category;
        }
    });

    const avoidableSpendRatio = totalDiscretionary > 0 ? (maxClusterSpend / totalDiscretionary) * 100 : 0;
    const currentDay = today.getDate();
    const currentDailyAvg = thisMonthTotal / Math.max(currentDay, 1);
    const recoveredAmount = maxClusterSpend * 0.5;
    const calculatedRunwayDays = currentDailyAvg > 0 ? recoveredAmount / currentDailyAvg : 0;
    
    const confidenceScore = Math.floor(Math.random() * (96 - 88 + 1) + 88);
    
    return {
        percent: Math.abs(percentage).toFixed(0),
        isIncrease: percentage > 0,
        hasData: lastMonthTotal > 0,
        diff: Math.abs(thisMonthTotal - lastMonthTotal),
        targetCluster,
        clusterTotal: maxClusterSpend,
        avoidableSpendRatio,
        calculatedRunwayDays,
        confidenceScore
    };
  }, [transactions, currentMonth, currentYear, today]);

  const { paidBills, upcomingBills } = useMemo(() => {
      const subs = transactions.filter(t => t.category === Category.SUBSCRIPTION || t.category === Category.UTILITIES || t.category === Category.HOUSING);
      const unique = new Map<string, Transaction>();
      
      // Get latest transaction for each subscription merchant
      subs.forEach(t => {
          const key = t.merchant.toLowerCase();
          const existing = unique.get(key);
          if (!existing || new Date(t.date) > new Date(existing.date)) {
              unique.set(key, t);
          }
      });

      const paid: Transaction[] = [];
      const upcoming: { merchant: string; amount: number; date: Date; daysLeft: number }[] = [];
      
      const now = new Date();
      
      unique.forEach(t => {
          const tDate = new Date(t.date);
          // Check if paid this month
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
              paid.push(t);
          } else {
              // Estimate next due date (same day of current month)
              let due = new Date(currentYear, currentMonth, tDate.getDate());
              // If day passed, move to next month
              if (due < now && due.getDate() !== now.getDate()) {
                  due = new Date(currentYear, currentMonth + 1, tDate.getDate());
              }
              
              const diffTime = due.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              upcoming.push({
                  merchant: t.merchant,
                  amount: t.amount,
                  date: due,
                  daysLeft: diffDays
              });
          }
      });

      // Sort
      paid.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      upcoming.sort((a, b) => a.daysLeft - b.daysLeft);

      return { paidBills: paid.slice(0, 5), upcomingBills: upcoming.slice(0, 5) };
  }, [transactions, currentMonth, currentYear]);

  const recentTransactions = useMemo(() => {
      return transactions.slice(0, 5);
  }, [transactions]);

  const dynamicIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth]);

  const dynamicBills = useMemo(() => {
    const totalTransactionsBills = transactions
      .filter(t => (t.category === Category.SUBSCRIPTION || t.category === Category.UTILITIES || t.category === Category.HOUSING) && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalUpcomingBills = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    return totalTransactionsBills + totalUpcomingBills;
  }, [transactions, currentMonth, upcomingBills]);

  const dynamicGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.targetAmount / 12), 0);
  }, [goals]);

  const dynamicSafeToSpend = useMemo(() => {
    if (accounts.length === 0) return 0;
    
    const nonSafeIncomeCategories = [Category.TRADING, Category.CRYPTO, Category.INVESTMENT];
    
    const totalMonthIncome = transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const safeIncomeTransactionsSum = transactions
      .filter(t => t.type === TransactionType.INCOME && 
                   !nonSafeIncomeCategories.includes(t.category) && 
                   new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const safeIncome = totalMonthIncome === 0 ? 4500 : safeIncomeTransactionsSum;
    const spentThisMonth = transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount + (t.tax || 0), 0);

    const balanceLeft = safeIncome - dynamicBills - dynamicGoals - spentThisMonth;
    return balanceLeft > 0 ? balanceLeft : Math.max(1450, netWorth * 0.15);
  }, [accounts.length, transactions, currentMonth, dynamicBills, dynamicGoals, netWorth]);

  const goalMetrics = useMemo(() => {
      const limitVal = Number(spendingLimit);
      const safeLimit = !isNaN(limitVal) && limitVal > 0 ? limitVal : 1;
      const budgetUtilization = (currentPeriodSpend / safeLimit) * 100;
      
      const budgetProgress = budgets.map(b => {
          const spent = transactions
            .filter(t => t.category === b.category && t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);
          return { ...b, spent, percentage: Math.min((spent / b.limit) * 100, 100) };
      });

      // Total Savings calculation
      const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
      const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
      const savingsProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

      return { budgetUtilization, budgetProgress, totalTarget, totalSaved, savingsProgress };
  }, [currentPeriodSpend, spendingLimit, budgets, transactions, currentMonth, goals]);

  const neuralCapacity = userPlan === 'ultra' ? 500 : userPlan === 'pro' ? 50 : 3;
  const neuralRemaining = Math.max(0, neuralCapacity - insightUsage);
  const safeName = userName && userName.trim() !== '' ? userName : 'Pilot';
  const displayLimit = spendingLimit && !isNaN(Number(spendingLimit)) ? Number(spendingLimit) : 0;

  const handleProceedWithScan = () => {
    setShowScanConfirm(false);
    onNavigate('insights', { reportType: 'daily' });
  };

  // Find a specific budget for the Goal Vector card
  const highlightedBudget = budgets.find(b => b.category === 'Entertainment') || budgets[0];
  const highlightedBudgetMetrics = highlightedBudget 
      ? goalMetrics.budgetProgress.find(b => b.id === highlightedBudget.id) 
      : null;

  const displayGoals = goals.slice(0, 2);

  const radarData = useMemo(() => {
    if (isZeroTransactionHistory) {
      // Balanced sample baseline model when transaction history is zero
      const velocityIdx = creditScore ? Math.min(100, (creditScore / 850) * 100) : 75;
      return [
        { subject: 'Health', A: 80, fullMark: 100 },
        { subject: 'Budget', A: 85, fullMark: 100 },
        { subject: 'Savings', A: 70, fullMark: 100 },
        { subject: 'Income', A: 78, fullMark: 100 },
        { subject: 'Credit', A: velocityIdx, fullMark: 100 },
      ];
    }

    const healthIndex = Math.min(100, Math.max(0, 100 - (currentMonthRatio.ratio || 0)));
    const budgetIndex = Math.min(100, Math.max(0, 100 - (goalMetrics.budgetUtilization || 0)));
    const saveIdx = Math.min(100, goalMetrics.savingsProgress || 0);
    const incomeIdx = Math.min(100, (currentMonthRatio.income / 10000) * 100); // Normalized
    const velocityIdx = creditScore ? Math.min(100, (creditScore / 850) * 100) : 70;
     
    return [
      { subject: 'Health', A: healthIndex, fullMark: 100 },
      { subject: 'Budget', A: budgetIndex, fullMark: 100 },
      { subject: 'Savings', A: saveIdx, fullMark: 100 },
      { subject: 'Income', A: incomeIdx, fullMark: 100 },
      { subject: 'Credit', A: velocityIdx, fullMark: 100 },
    ];
  }, [isZeroTransactionHistory, currentMonthRatio, goalMetrics, creditScore]);

  const overallRadarScore = useMemo(() => {
    return Math.round(radarData.reduce((acc, curr) => acc + curr.A, 0) / radarData.length);
  }, [radarData]);

  const unconfirmedPreTransactions = useMemo(() => {
    return transactions.filter(t => t.isVirtual);
  }, [transactions]);

  return (
    <div className="pb-20 px-2 md:px-0 font-sans">
        
        {/* Header */}
        <div className="mb-6 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Good {dayName}, {safeName}
                    </h1>
                </div>
            </div>
            
            {onAddTransaction && (
                <button 
                    onClick={onAddTransaction}
                    className="hidden md:flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-3 rounded-2xl text-xs font-bold tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span>Make New Transaction</span>
                </button>
            )}
        </div>

        {/* End of Day Pre-Transaction Verification Banner */}
        {unconfirmedPreTransactions.length > 0 && (
            <div className="mb-6 p-6 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/[0.02] shadow-[0_0_50px_rgba(245,158,11,0.03)] flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">End-of-Day Verification</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Nova modeled the following planned transactions. Did you actually make these purchases today?</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 tracking-wide font-mono shrink-0">
                        {unconfirmedPreTransactions.length} Pending
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                    {unconfirmedPreTransactions.map(t => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-4 hover:border-amber-500/20 transition-all duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-amber-500/5 text-amber-400 border border-amber-500/10">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-sm font-bold text-slate-200 truncate capitalize">{t.merchant}</span>
                                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {t.category}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-black text-amber-400 mr-2 font-mono">{formatCurrency(t.amount)}</span>
                                {onUpdateTransaction && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onUpdateTransaction({ ...t, isVirtual: false }); }}
                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-xl transition-all border border-emerald-500/20 hover:border-emerald-500"
                                        title="Confirm Transaction"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                {onDeleteTransaction && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteTransaction(t.id); }}
                                        className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500"
                                        title="Dismiss Planned"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT MAIN PANEL */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                
                {/* 1. Command Grid (Moved To Top as Requested) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Left Side: Compressed Stats */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                        {/* Net Worth */}
                        <div className="glass-card p-4 rounded-3xl border border-white/5 bg-[#0f172a]/60 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-8 h-8 text-blue-500" /></div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-blue-500/10"><Wallet className="w-3.5 h-3.5 text-blue-500" /></div>
                                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">Net Worth</span>
                            </div>
                            <div className="flex items-center justify-between relative z-10 mt-1">
                                <div className={`text-xl font-black tracking-tight ${netWorth < 0 ? 'text-rose-500' : 'text-white'}`}>{formatCurrency(netWorth)}</div>
                                <span className={`text-[10px] font-bold ${netWorthGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ({netWorthGrowth >= 0 ? '+' : ''}{netWorthGrowth.toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        {/* Monthly Spend */}
                        <div className="glass-card p-4 rounded-3xl border border-white/5 bg-[#0f172a]/60 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard className="w-8 h-8 text-indigo-500" /></div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /></div>
                                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight line-clamp-1">Monthly Spend</span>
                            </div>
                            <div className="flex items-center justify-between relative z-10 mt-1">
                                <div className={`text-xl font-black tracking-tight ${expenditureData.total < 0 ? 'text-rose-500' : 'text-white'}`}>{formatCurrency(expenditureData.total)}</div>
                                <span className={`text-[10px] font-bold ${spendingInsight.isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    ({spendingInsight.isIncrease ? '+' : '-'}{spendingInsight.percent}%)
                                </span>
                            </div>
                        </div>

                        {/* Today Burn */}
                        <div className="glass-card p-4 rounded-3xl border border-white/5 bg-[#0f172a]/60 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Flame className="w-8 h-8 text-orange-500" /></div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-orange-500/10"><Flame className="w-3.5 h-3.5 text-orange-500" /></div>
                                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight line-clamp-1">Today's Burn</span>
                            </div>
                            <div className="flex items-center justify-between relative z-10 mt-1">
                                <div className={`text-xl font-black tracking-tight ${stats.todayBurn < 0 ? 'text-rose-500' : 'text-white'}`}>{formatCurrency(stats.todayBurn)}</div>
                                <span className={`text-[10px] font-bold ${stats.burnChangePct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    ({stats.burnChangePct > 0 ? '+' : ''}{stats.burnChangePct.toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        {/* Neural Capacity */}
                        <div className="glass-card p-4 rounded-3xl border border-white/5 bg-[#0f172a]/60 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-8 h-8 text-purple-500" /></div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-purple-500/10"><Zap className="w-3.5 h-3.5 text-purple-500" /></div>
                                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight line-clamp-1">AI Access</span>
                            </div>
                            <div className={`text-xl font-black tracking-tight relative z-10 ${neuralRemaining < 0 ? 'text-rose-500' : 'text-white'}`}>{neuralRemaining} <span className="text-xs text-slate-500 font-bold">Credits</span></div>
                        </div>
                    </div>

                    {/* Right Side: Container */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch w-full h-full flex-1">
                        {/* In My Pocket */}
                        <div className="w-full sm:w-[150px] lg:w-[180px] flex-shrink-0 flex items-stretch">
                            <div className="flex-1 flex flex-col items-stretch h-full">
                                <PocketMoneyCard 
                                    formatCurrency={formatCurrency} 
                                    safeToSpend={dynamicSafeToSpend}
                                    income={dynamicIncome}
                                    bills={dynamicBills}
                                    goals={dynamicGoals}
                                />
                            </div>
                        </div>

                        {/* Forecast */}
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group shadow-2xl flex-1 w-full sm:w-auto h-full">
                            
                            <div className="flex flex-col flex-1 relative z-10 w-full mb-2">
                                <span className="text-xs font-bold text-slate-400 tracking-wide mb-6 block">Monthly Budget Overview</span>
                                <div className="flex flex-col gap-2.5 w-full h-full justify-end pb-1">
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[11px] font-medium text-slate-500 tracking-wide">Budget</span>
                                        <div className="text-sm font-bold text-slate-300 tracking-tight">{formatCurrency(dynamicBudgetStats.budgeted)}</div>
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[11px] font-medium text-slate-500 tracking-wide">Actual</span>
                                        <div className="text-sm font-bold text-white tracking-tight">{formatCurrency(dynamicBudgetStats.actual)}</div>
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[11px] font-medium text-slate-500 tracking-wide">Remaining</span>
                                        <div className={`text-sm font-black tracking-tight ${dynamicBudgetStats.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {dynamicBudgetStats.remaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(dynamicBudgetStats.remaining))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-end relative z-10 space-y-4">
                                <div className="w-full h-[3px] bg-slate-900 rounded-full overflow-hidden flex">
                                    <div 
                                        className={`h-full ${dynamicBudgetStats.actual > dynamicBudgetStats.budgeted ? 'bg-rose-500' : 'bg-emerald-400'} transition-all`} 
                                        style={{ width: `${Math.min((dynamicBudgetStats.actual / (dynamicBudgetStats.budgeted || 1)) * 100, 100)}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Spending chart */}
                <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-white/5 bg-[#0f172a]/60 backdrop-blur-xl relative overflow-hidden min-h-[300px]">
                    {expenditureData.isEmpty ? (
                        <div className="flex flex-col md:flex-row items-center gap-8 py-2 w-full">
                            {/* Visual Icon Box */}
                            <div className="w-44 h-44 md:w-52 md:h-52 relative shrink-0 flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[35px] pointer-events-none" />
                                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full border border-indigo-500/20 bg-slate-950/60 backdrop-blur-md flex items-center justify-center shadow-2xl">
                                    <div className="absolute inset-2.5 rounded-full border border-dashed border-indigo-500/30 animate-[spin_30s_linear_infinite]" />
                                    <div className="absolute inset-6 rounded-full border border-indigo-500/10" />
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                        <PieChartIcon className="w-7 h-7 text-indigo-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Empty State Content */}
                            <div className="flex-1 w-full flex flex-col justify-center text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-indigo-400 tracking-wide bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono flex items-center gap-1">
                                        <AlignLeft className="w-3 h-3 text-indigo-400" />
                                        Spending Categories
                                    </span>
                                </div>

                                <h4 className="text-xl font-bold text-white tracking-tight mb-2">
                                    No transactions recorded this month
                                </h4>

                                <p className="text-slate-400 text-xs font-medium mb-6 max-w-lg leading-relaxed">
                                    Track where your money flows. Logging expenses activates real-time category distribution, budget utilization limits, and proactive spending alerts.
                                </p>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button 
                                        onClick={onAddTransaction} 
                                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold tracking-wide rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        <span>Log First Expense</span>
                                    </button>
                                    <button 
                                        onClick={() => onNavigate('smart_money')} 
                                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold tracking-wide rounded-xl border border-white/10 transition-all cursor-pointer"
                                    >
                                        Explore Budgets
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                            <div className="w-40 h-40 md:w-44 md:h-44 relative shrink-0 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenditureData.chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {expenditureData.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }} 
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }} 
                                            formatter={(v: number) => formatCurrency(v)} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 w-full pt-2">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-sm font-bold text-slate-400 tracking-wide flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-indigo-500" />
                                        Spending Categories
                                    </h3>
                                </div>
                                
                                {expenditureData.topCategory && (
                                    <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-indigo-400 tracking-wide block mb-1">Top Expense</span>
                                            <span className="text-lg font-bold text-white">{expenditureData.topCategory.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white">{formatCurrency(expenditureData.topCategory.value)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 block">{((expenditureData.topCategory.value / expenditureData.total) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-3">
                                    {expenditureData.chartData.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                                            </div>
                                            <div className="h-1 flex-1 mx-4 bg-slate-800/50 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(item.value / expenditureData.total) * 60}%`, backgroundColor: COLORS[i % COLORS.length], opacity: 0.6 }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => onNavigate('smart_money', { tab: 'detailed_charts' })}
                                    className="w-full mt-6 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-indigo-400 hover:bg-slate-800 transition-colors"
                                >
                                    View in Detail
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. My Recent Transactions (Corrected Layout - Flexbox) */}
                <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#0f172a]/60 p-0 overflow-hidden min-h-[300px] flex flex-col lg:flex-row">
                    
                    {/* Main Section: Transaction List */}
                    <div className="flex-1 p-6 flex flex-col relative z-10 min-w-0"> 
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-400 tracking-wide flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Recent Activity
                            </h3>
                            <button 
                                onClick={() => onNavigate('transactions')} 
                                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                            >
                                View All <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        
                        <div className="flex-1 w-full space-y-3">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((t) => (
                                    <div key={t.id} className="group relative flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{t.merchant}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">
                                                    {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {t.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pl-2 shrink-0">
                                            <span className={`text-sm font-black tracking-tight ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                                                {t.type === TransactionType.INCOME ? '+' : ''}{formatCurrency(t.amount)}
                                            </span>
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => toggleTransactionMenu(e, t.id)}
                                                    className="p-2 rounded-full hover:bg-white/10 text-slate-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                {openTransactionMenuId === t.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(t); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 uppercase tracking-wider">
                                                            <Edit2 className="w-3 h-3 text-indigo-400" /> Edit
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(t.id); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-300 hover:bg-white/5 hover:text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                                                            <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900/30 rounded-2xl border-2 border-dashed border-white/5">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                        <Rocket className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h4 className="text-white font-bold text-sm">Start Tracking</h4>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-4">No transactions found.</p>
                                    <button onClick={onAddTransaction} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                                        Record Event
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Insight Side Panel (Right) - High Contrast & Flexbox Layout */}
                    <div className="w-full lg:w-[25%] bg-slate-900/80 border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col items-center justify-center text-center relative z-10 shrink-0">
                         <div className="h-32 w-3 bg-slate-800 rounded-full relative overflow-hidden mb-4">
                             <div 
                                className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000 ${currentMonthRatio.ratio > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                style={{ height: `${Math.min(currentMonthRatio.ratio, 100)}%` }}
                             ></div>
                         </div>
                         <div className="text-3xl font-black text-white mb-2">{currentMonthRatio.ratio.toFixed(0)}%</div>
                         <p className="text-xs font-bold text-slate-300 uppercase tracking-wide text-center leading-relaxed">
                            You have spent {currentMonthRatio.ratio.toFixed(0)}% compared to your income this month.
                         </p>
                    </div>
                </div>

                {/* 4. Spending Graph (Redesigned Grid - Extended Vertical) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Spend Trajectory Chart (2/3 width, Fixed Height) */}
                    <div className="md:col-span-2 glass-card p-6 md:p-10 rounded-[2.5rem] border border-white/5 bg-[#0f172a] flex flex-col relative overflow-visible h-[32rem]">
                        
                        {/* Header & Legend */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 relative z-50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-white tracking-tight">Spending Progress</h3>
                                    {isZeroTransactionHistory && (
                                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 tracking-wide flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" /> Sample Baseline
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 font-medium mt-1">
                                    {isZeroTransactionHistory ? 'Interactive sample benchmark vs modeled trajectory' : 'Cumulative spending vs previous month'}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0 bg-white/5 p-2 px-4 rounded-full">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]"></div>
                                    <span className="text-[10px] font-bold text-slate-300 tracking-wide">{isZeroTransactionHistory ? 'Model Current' : 'Current'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wide">{isZeroTransactionHistory ? 'Model Target' : 'Previous'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actual Chart Component */}
                        <div className="flex-1 w-full min-h-0 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={lineChartData} margin={{ top: 10, right: 10, left: 15, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis 
                                        dataKey="day" 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10} 
                                        tick={{ fill: '#64748b' }}
                                        interval={4} 
                                        tickFormatter={(value) => `${value}`} 
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={50} 
                                        dx={-5}
                                        tickFormatter={(val) => isPrivacyMode ? '•••' : `$${val}`}
                                        tickCount={6}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <Tooltip 
                                        content={<CustomChartTooltip formatCurrency={formatCurrency} />} 
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} 
                                    />
                                    
                                    {/* Previous Period Line */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="Comparison" 
                                        stroke="#475569" 
                                        strokeWidth={2} 
                                        dot={false} 
                                        strokeDasharray="4 4" 
                                        activeDot={false}
                                    />
                                    {/* Current Period Line */}
                                    <Area 
                                        type="monotone" 
                                        dataKey="ThisMonth" 
                                        stroke="#6366f1" 
                                        strokeWidth={3} 
                                        fill="url(#colorThisMonth)"
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* New Insight Card (1/3 width) */}
                    <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 bg-slate-900/60 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className={`p-2 rounded-lg ${spendingInsight.isIncrease ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {spendingInsight.isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                </div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Spending Insight</h3>
                            </div>

                            <div className="space-y-1">
                                {spendingInsight.hasData ? (
                                    <>
                                        <div className="flex flex-col gap-4 mb-4 mt-2">
                                            {/* Squared block for percentage with correct aspect square proportions */}
                                            <div className="flex flex-col w-full gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-20 h-20 flex-shrink-0 border ${spendingInsight.isIncrease ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'} rounded-none flex flex-col items-center justify-center font-black aspect-square`}>
                                                        <span className="text-2xl font-black tracking-tight leading-none">
                                                            {spendingInsight.percent}%
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                                            {spendingInsight.isIncrease ? 'Up' : 'Down'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-base md:text-lg text-slate-250 font-bold leading-normal">
                                                            You've spent <span className="text-white font-extrabold underline decoration-indigo-500/30 decoration-2">{formatCurrency(spendingInsight.diff)}</span> {spendingInsight.isIncrease ? 'more' : 'less'} than last month.
                                                        </p>
                                                        <p className="text-xs text-slate-400 font-medium mt-1 leading-normal">
                                                            Your spending has {spendingInsight.isIncrease ? 'increased' : 'decreased'} compared to last month's ledger.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Dynamic Sparkline */}
                                                <div className="w-full h-16 sm:h-20 md:h-24 relative mt-2 -mx-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={spendingInsight.isIncrease ? [ { value: 10 }, { value: 25 }, { value: 20 }, { value: 50 }, { value: 45 }, { value: 80 }, { value: 95 } ] : [ { value: 90 }, { value: 75 }, { value: 85 }, { value: 50 }, { value: 35 }, { value: 15 }, { value: 5 } ]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="colorSparkline" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor={spendingInsight.isIncrease ? '#f43f5e' : '#10b981'} stopOpacity={0.3}/>
                                                                    <stop offset="95%" stopColor={spendingInsight.isIncrease ? '#f43f5e' : '#10b981'} stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <Area type="monotone" dataKey="value" stroke={spendingInsight.isIncrease ? '#f43f5e' : '#10b981'} strokeWidth={2} fillOpacity={1} fill="url(#colorSparkline)" isAnimationActive={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* OPTIMIZATION SUGGESTION */}
                                        {spendingInsight.targetCluster && (
                                            <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg mt-4 relative overflow-hidden group">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-400 font-mono">
                                                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                                        Optimization Suggestion
                                                    </div>
                                                    {(() => {
                                                        const ratio = spendingInsight.avoidableSpendRatio;
                                                        let colorClass = 'text-emerald-400';
                                                        let label = 'Low';
                                                        if (ratio > 40) {
                                                            colorClass = 'text-rose-400';
                                                            label = 'High';
                                                        } else if (ratio >= 15) {
                                                            colorClass = 'text-amber-400';
                                                            label = 'Medium';
                                                        }
                                                        return (
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                                                                [{label}]
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                
                                                <p className="text-base text-slate-200 font-medium leading-relaxed mb-3">
                                                    You spent a lot on <span className="text-white font-bold">{spendingInsight.targetCluster}</span> ({spendingInsight.avoidableSpendRatio.toFixed(0)}% of extra spending). Cutting this in half saves you enough to last <span className="text-white font-bold">{spendingInsight.calculatedRunwayDays.toFixed(0)}</span> more days.
                                                </p>
                                                
                                                <div className="flex items-center text-xs font-bold text-slate-500 tracking-wider uppercase">
                                                    🎯 {spendingInsight.confidenceScore}% Confidence Score
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[150px] w-full mt-4">
                                        <div className="w-full h-0.5 border-t-2 border-dashed border-slate-700/50 relative mb-6">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] border border-slate-700 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                <Activity className="w-3 h-3" /> Baseline State
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 max-w-[200px] text-center">More transaction data is required to model reliable comparison trends.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                
                {/* Goal Vector - Redesigned to be highly clean, elegant and liminal */}
                <div className="glass-card p-6 rounded-[2rem] border border-slate-800/60 bg-slate-950/20 backdrop-blur-md flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-800 text-slate-400">
                                <Target className="w-4 h-4 text-rose-450" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Goal Tracker</h3>
                            </div>
                        </div>
                        <button
                            onClick={() => onNavigate('goals')}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold tracking-wide transition-all"
                        >
                            <Plus className="w-3 h-3" /> Add Goal
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Limits Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 tracking-wide">
                                <span>Absolute Limit</span>
                                <span className={goalMetrics.budgetUtilization > 90 ? 'text-rose-400' : 'text-slate-400 font-bold'}>
                                    {goalMetrics.budgetUtilization.toFixed(0)}%
                                </span>
                            </div>
                            
                            {/* Global Limit Row */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-1 px-0.5">
                                    <span className="text-xs font-medium text-slate-300 tracking-wide">Global Spend</span>
                                    <div className="text-[10px] font-bold">
                                        <span className="text-white">{formatCurrency(currentPeriodSpend)}</span>
                                        <span className="text-slate-500 mx-1">/</span>
                                        <span className="text-slate-500">{formatCurrency(displayLimit)}</span>
                                    </div>
                                </div>
                                <div className="h-[3px] w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${goalMetrics.budgetUtilization > 90 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                        style={{ width: `${Math.min(goalMetrics.budgetUtilization, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Highlighted Category Row */}
                            {highlightedBudgetMetrics && (
                                <div className="group">
                                    <div className="flex items-center justify-between mb-1 px-0.5">
                                        <span className="text-xs font-medium text-slate-300 tracking-wide truncate max-w-[120px]">{highlightedBudgetMetrics.category}</span>
                                        <div className="text-[10px] font-bold">
                                            <span className="text-white">{formatCurrency(highlightedBudgetMetrics.spent)}</span>
                                            <span className="text-slate-500 mx-1">/</span>
                                            <span className="text-slate-500">{formatCurrency(highlightedBudgetMetrics.limit)}</span>
                                        </div>
                                    </div>
                                    <div className="h-[3px] w-full bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${highlightedBudgetMetrics.percentage > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${Math.min(highlightedBudgetMetrics.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Savings Section */}
                        <div className="space-y-3 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-500 tracking-wide">
                                <span>Savings Targets</span>
                                <span className="font-bold">{goalMetrics.savingsProgress.toFixed(0)}%</span>
                            </div>

                            {/* Total Savings Row */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-1 px-0.5">
                                    <span className="text-xs font-medium text-slate-300 tracking-wide">Total Portfolio</span>
                                    <div className="text-[10px] font-bold">
                                        <span className="text-emerald-400">{formatCurrency(goalMetrics.totalSaved)}</span>
                                        <span className="text-slate-500 mx-1">/</span>
                                        <span className="text-slate-500">{formatCurrency(goalMetrics.totalTarget)}</span>
                                    </div>
                                </div>
                                <div className="h-[3px] w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min(goalMetrics.savingsProgress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Individual Goals */}
                            {displayGoals.map((goal, idx) => {
                                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                                const isEven = idx % 2 === 0;
                                return (
                                    <div key={goal.id} className="group">
                                        <div className="flex items-center justify-between mb-1 px-0.5">
                                            <span className="text-xs font-medium text-slate-300 uppercase tracking-tight truncate max-w-[120px]">{goal.name}</span>
                                            <div className="text-[10px] font-bold">
                                                <span className="text-white">{formatCurrency(goal.currentAmount)}</span>
                                                <span className="text-slate-500 mx-1">/</span>
                                                <span className="text-slate-500">{formatCurrency(goal.targetAmount)}</span>
                                            </div>
                                        </div>
                                        <div className="h-[3px] w-full bg-slate-950 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${isEven ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Simulate Button */}
                    <button 
                        onClick={() => onNavigate('smart_money', { tab: 'sandbox' })}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
                    >
                        <Microscope className="w-3.5 h-3.5 text-indigo-400" /> Simulate Growth
                    </button>
                </div>

                {/* Financial Health Radar */}
                <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-colors"></div>
                    
                    <div className="flex-1 w-full relative z-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Financial Health</h3>
                            {isZeroTransactionHistory && (
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 tracking-wide flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" /> Baseline Model
                                </span>
                            )}
                            <button onClick={() => setShowHealthInfo(true)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                                <Info className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex-none whitespace-nowrap">
                            Overall Score: {overallRadarScore}/100
                        </p>

                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-5xl font-black text-white tracking-tighter">{overallRadarScore}</span>
                            <span className="text-sm font-bold text-slate-500 mb-1">/ 100</span>
                        </div>
                        
                        <div className="h-1.5 w-full max-w-[200px] bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className={`h-full transition-all duration-1000 ${overallRadarScore >= 80 ? 'bg-emerald-500' : overallRadarScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                style={{ width: `${overallRadarScore}%` }}
                            ></div>
                        </div>

                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all" onClick={() => onNavigate('settings')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                    <Gauge className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Score</div>
                                    <div className="text-lg font-black text-white tracking-tight">{creditScore ? creditScore : 'N/A'}</div>
                                </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 h-[300px] relative z-10 flex items-center justify-center -ml-4 md:ml-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="50%" data={radarData}>
                                <PolarGrid stroke="#ffffff15" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Health" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recurring Bills - Redesigned Vertical Stack */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    
                    {/* Box 1: Upcoming Bills */}
                    <div className="glass-card p-5 rounded-[2rem] border border-white/5 bg-slate-900/40 flex flex-col gap-4 relative overflow-hidden flex-1 min-h-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Upcoming Bills</h3>
                                <p className="text-[10px] text-slate-500 font-bold">Projected Outflows</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {upcomingBills.length > 0 ? (
                                upcomingBills.map((bill, i) => (
                                    <div 
                                        key={`up-${i}`} 
                                        onClick={() => setSelectedBill(bill)}
                                        className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-amber-500/30 cursor-pointer hover:bg-slate-950/80 hover:scale-[1.01] active:scale-[0.99] transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500/20 w-full">
                                            <div className="h-full bg-amber-500" style={{ width: `${Math.max(0, 100 - (bill.daysLeft * 10))}%` }}></div>
                                        </div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-300 border border-white/5">
                                                {bill.merchant.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors truncate max-w-[80px]">{bill.merchant}</div>
                                                <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                    {bill.daysLeft <= 0 ? 'Due Today' : `In ${bill.daysLeft} Days`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <div className="text-xs font-black text-white">{formatCurrency(bill.amount)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <CheckCircle2 className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No pending bills</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Box 2: Subscriptions */}
                    <div className="glass-card p-5 rounded-[2rem] border border-white/5 bg-slate-900/40 flex flex-col gap-4 relative overflow-hidden flex-1 min-h-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Subscriptions</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {paidBills.length > 0 ? (
                                paidBills.map(bill => (
                                    <div 
                                        key={bill.id} 
                                        onClick={() => setSelectedBill({ merchant: bill.merchant, amount: bill.amount, daysLeft: 0, date: new Date(bill.date) })}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/30 hover:bg-slate-950/60 border border-transparent hover:border-indigo-500/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors truncate max-w-[100px]">{bill.merchant}</span>
                                                <span className="text-[8px] text-slate-500 font-bold uppercase">Paid {new Date(bill.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200">{formatCurrency(bill.amount)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Calendar className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No active subs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Scan Confirmation Modal */}
        {showScanConfirm && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-slide-up">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <Zap className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 text-center uppercase tracking-tight">Start Scan?</h3>
                    <p className="text-sm text-slate-400 mb-8 text-center leading-relaxed">This will analyze your spending and goals to provide smart financial insights. <br/><span className="text-indigo-400 font-bold">1 Credit will be used.</span></p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowScanConfirm(false)} className="py-4 bg-slate-800 text-slate-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleProceedWithScan} className="py-4 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> Proceed
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Transaction Modal via Dashboard */}
        {editingTransaction && (
            <AddTransactionModal 
                onClose={() => setEditingTransaction(null)} 
                onAdd={(updatedTx) => { 
                    if (editingTransaction?.id?.startsWith('temp-')) {
                        const newTx = { ...updatedTx, id: 'tx-' + Date.now() };
                        if (onAddTransactionObject) {
                            onAddTransactionObject(newTx);
                        }
                    } else if (onUpdateTransaction) {
                        onUpdateTransaction(updatedTx);
                    }
                    setEditingTransaction(null); 
                }}
                accounts={accounts}
                userPlan={userPlan}
                formatCurrency={formatCurrency}
                scanUsage={0} // Dashboard editing doesn't affect scan usage logic
                currency={currency}
                initialData={editingTransaction}
            />
        )}

        {/* Upcoming Bill Details / Utility Modal */}
        {selectedBill && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
                <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden animate-slide-up">
                    <button onClick={() => setSelectedBill(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10 bg-black/20 rounded-full backdrop-blur-md">
                        <XCircle className="w-6 h-6" />
                    </button>
                    
                    <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-500/15 to-transparent">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><Clock className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">{selectedBill.merchant}</h2>
                                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Recurring Bill Detected</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Facts Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                            <div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Estimated Amount</span>
                                <span className="text-lg font-black text-white">{formatCurrency(selectedBill.amount)}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Predicted Due</span>
                                <span className="text-sm font-bold text-white block mt-1">
                                    {selectedBill.daysLeft <= 0 ? 'Today' : `In ${selectedBill.daysLeft} Days`}
                                </span>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="text-xs text-slate-400 leading-relaxed font-normal space-y-2">
                            <p>
                                <span className="text-white font-bold">How does this work?</span> Nova AI runs pattern matching over your historical transaction flows. Since you recurringly transact with <span className="text-slate-100 font-bold">{selectedBill.merchant}</span> for subscription, utility, or housing services, Nova safely projects this upcoming debit so your safe-to-spend "In My Pocket" balance stays safe and realistic.
                            </p>
                        </div>

                        {/* Interactive Actions */}
                        <div className="space-y-2.5 pt-4 border-t border-white/5">
                            {/* Option 1: Negotiate rate with AI */}
                            <button
                                onClick={() => {
                                    if (onAskCoach) {
                                        onAskCoach(`Can you help me write a negotiation script to lower my monthly payment for the ${selectedBill.merchant} bill? It currently costs ${typeof selectedBill.amount === 'number' ? '$' + selectedBill.amount : selectedBill.amount} per month.`);
                                        setSelectedBill(null);
                                    } else {
                                        onNavigate('smart_money', { tab: 'negotiator' });
                                        setSelectedBill(null);
                                    }
                                }}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 group"
                            >
                                <Handshake className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                <span>Negotiate Bill with Nova AI</span>
                            </button>

                            {/* Option 2: Record Transaction (Mark as Paid) */}
                            <button
                                onClick={() => {
                                    const tempId = 'temp-' + Date.now();
                                    setEditingTransaction({
                                        id: tempId,
                                        accountId: accounts[0]?.id || '',
                                        amount: selectedBill.amount,
                                        type: TransactionType.EXPENSE,
                                        merchant: selectedBill.merchant,
                                        category: Category.SUBSCRIPTION,
                                        date: new Date().toISOString().split('T')[0],
                                        notes: 'Recorded from Predicted Recurring Bill'
                                    });
                                    setSelectedBill(null);
                                }}
                                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-350 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4 text-emerald-450" />
                                <span>Mark as Paid (Record Log)</span>
                            </button>

                            {/* Close */}
                            <button
                                onClick={() => setSelectedBill(null)}
                                className="w-full py-2 px-4 bg-transparent text-slate-500 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Financial Health Info Modal */}
        {showHealthInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden animate-slide-up">
                    <button onClick={() => setShowHealthInfo(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10 bg-black/20 rounded-full backdrop-blur-md">
                        <XCircle className="w-6 h-6" />
                    </button>
                    <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-900/40 to-transparent">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><Activity className="w-6 h-6" /></div>
                            <h2 className="text-xl font-bold text-white tracking-tight">How it works</h2>
                        </div>
                        <p className="text-sm text-slate-400">Your Financial Health score is based on 4 key areas:</p>
                    </div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {[
                            {
                                id: 'credit',
                                title: 'Credit Score',
                                icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
                                bgClass: 'bg-emerald-500/10',
                                desc: 'Based on your simulated credit profile. Keep utilization low and pay on time.',
                                steps: [
                                    '1. Pay bills on time: Set up auto-pay for minimums.',
                                    '2. Keep utilization under 30%: Pay down balances before the statement closes.',
                                    '3. Don\'t close old accounts: Length of credit history matters.'
                                ],
                                example: 'Example: Paying your $500 credit card balance in full every month boosts this stat over time.'
                            },
                            {
                                id: 'savings',
                                title: 'Savings',
                                icon: <Wallet className="w-5 h-5 text-blue-400" />,
                                bgClass: 'bg-blue-500/10',
                                desc: 'Measures your cash reserves compared to your goals and expenses.',
                                steps: [
                                    '1. Automate transfers: Send 20% of income directly to savings.',
                                    '2. Build an emergency fund: Aim for 3-6 months of basic expenses.',
                                    '3. Set specific goals: Label accounts for "Vacation" or "House".'
                                ],
                                example: 'Example: Transferring $100 every paycheck to your "Emergency Fund" goal increases this score.'
                            },
                            {
                                id: 'income',
                                title: 'Income',
                                icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
                                bgClass: 'bg-purple-500/10',
                                desc: 'Evaluates your inward cash flow stability and growth over time.',
                                steps: [
                                    '1. Diversify streams: Try starting a small side hustle or freelance gig.',
                                    '2. Upskill for raises: Invest in certifications that increase your base salary.',
                                    '3. Invest for passive income: Put money into index funds.'
                                ],
                                example: 'Example: Adding an extra $200/mo income stream from a side hustle improves stability.'
                            },
                            {
                                id: 'budgeting',
                                title: 'Budgeting',
                                icon: <Target className="w-5 h-5 text-amber-400" />,
                                bgClass: 'bg-amber-500/10',
                                desc: 'How well you stick to your limits across different spending categories.',
                                steps: [
                                    '1. Use the 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings.',
                                    '2. Track daily: Log transactions quickly to avoid end-of-month surprises.',
                                    '3. Adjust limits flexibly: Re-allocate if you overspend in one category.'
                                ],
                                example: 'Example: Staying $50 under your "Dining Out" limit for the month directly boosts this.'
                            }
                        ].map((section) => (
                            <div 
                                key={section.id}
                                className={`border rounded-2xl transition-all overflow-hidden cursor-pointer ${expandedHealthSection === section.id ? 'border-white/20 bg-white/5' : 'border-transparent hover:bg-white/5'}`}
                                onClick={() => setExpandedHealthSection(expandedHealthSection === section.id ? null : section.id)}
                            >
                                <div className="flex gap-4 items-center p-4">
                                    <div className={`p-2 rounded-lg shrink-0 ${section.bgClass}`}>{section.icon}</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm mb-0.5">{section.title}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-2">{section.desc}</p>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${expandedHealthSection === section.id ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {expandedHealthSection === section.id && (
                                    <div className="px-4 pb-5 pt-2 border-t border-white/5 animate-fade-in">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">How to gain</h5>
                                        <ul className="space-y-2 mb-4">
                                            {section.steps.map((step, idx) => (
                                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                                    <span className="text-indigo-400 mt-0.5">•</span> 
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                            <p className="text-xs text-indigo-300 font-medium">{section.example}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Floating Action Button for Mobile */}
        {onAddTransaction && (
            <div className="fixed bottom-6 right-6 md:hidden z-50 animate-fade-in">
                <button 
                    onClick={onAddTransaction} 
                    className="bg-indigo-500 hover:bg-indigo-400 text-white w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(99,102,241,0.4)] border border-indigo-400/50 flex items-center justify-center transition-transform active:scale-95 group"
                >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        )}
    </div>
  );
});

export default Dashboard;