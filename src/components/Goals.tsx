
import React, { useEffect, useState, useMemo } from 'react';
import { Target, Trophy, Plane, Home, TrendingUp, Plus, DollarSign, Laptop, Check, Star, XCircle, Wallet, Gift, AlertCircle, PieChart, Trash2, Calendar, Clock, AlertTriangle, Zap, Shield, Edit2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Goal, Budget, Transaction, TransactionType, Category } from '../types';
import confetti from 'canvas-confetti';

interface GoalsProps {
  goals?: Goal[];
  budgets?: Budget[];
  transactions?: Transaction[];
  onAddGoal?: (goal: Goal) => void;
  onUpdateGoal?: (goal: Goal) => void;
  onAddBudget?: (budget: Budget) => void;
  onDeleteBudget?: (id: string) => void;
  formatCurrency: (amount: number) => string | React.ReactNode;
}

const Goals: React.FC<GoalsProps> = ({ goals = [], budgets = [], transactions = [], onAddGoal, onUpdateGoal, onAddBudget, onDeleteBudget, formatCurrency }) => {
    const [activeTab, setActiveTab] = useState<'limits' | 'goals'>('goals');
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [streak, setStreak] = useState(0);

    // --- STREAK ALGORITHM (PRESERVED) ---
    useEffect(() => {
        const lastVisit = localStorage.getItem('nova_last_visit');
        const currentStreak = parseInt(localStorage.getItem('nova_streak') || '0');
        const today = new Date().toDateString();

        if (lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastVisit === yesterday.toDateString()) {
                const newStreak = currentStreak + 1;
                setStreak(newStreak);
                localStorage.setItem('nova_streak', newStreak.toString());
            } else {
                setStreak(1);
                localStorage.setItem('nova_streak', '1');
            }
            localStorage.setItem('nova_last_visit', today);
        } else {
            setStreak(currentStreak || 1);
        }
    }, []);

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal || !depositAmount) return;
        
        const amount = parseFloat(depositAmount);
        const newAmount = selectedGoal.currentAmount + amount;
        
        const updatedGoal = { ...selectedGoal, currentAmount: newAmount };
        if (onUpdateGoal) onUpdateGoal(updatedGoal);
        
        if (newAmount >= selectedGoal.targetAmount && selectedGoal.currentAmount < selectedGoal.targetAmount) {
             confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#10b981', '#fbbf24']
            });
        }
        setSelectedGoal(null);
        setDepositAmount('');
    };

    // Aggregate Budget Stats for the Summary Header
    const budgetStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let totalLimit = 0;
        let totalSpent = 0;

        budgets.forEach(b => {
            totalLimit += b.limit;
            const spent = transactions
                .filter(t => 
                    t.category === b.category && 
                    t.type === TransactionType.EXPENSE && 
                    new Date(t.date).getMonth() === currentMonth &&
                    new Date(t.date).getFullYear() === currentYear
                )
                .reduce((acc, t) => acc + t.amount, 0);
            totalSpent += spent;
        });
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysLeft = daysInMonth - now.getDate();
        
        return { 
            totalLimit, 
            totalSpent, 
            percentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
            daysLeft: Math.max(0, daysLeft)
        };
    }, [budgets, transactions]);

    // Aggregate Savings Stats
    const savingsStats = useMemo(() => {
        const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
        const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
        const percentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
        return { totalTarget, totalSaved, percentage, count: goals.length };
    }, [goals]);

    return (
        <div className="animate-slide-up pb-6 space-y-4 h-auto min-h-0 flex flex-col max-w-7xl mx-auto w-full px-4 lg:px-6">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-1">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" />
                        My Savings Goals & Spending Limits
                    </h2>
                    <p className="text-slate-500 font-medium text-xs mt-1">Plan for what you want while keeping your spending on track.</p>
                </div>
                
                {/* Streak Badge */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-2 pr-4 flex items-center gap-3 backdrop-blur-sm hidden sm:flex">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-600 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <Zap className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Consecutive Visits</div>
                        <div className="text-sm font-black text-white leading-none">{streak} <span className="text-[10px] text-amber-500 font-bold">DAYS</span></div>
                    </div>
                </div>
            </div>

            {/* Sliding Tab Switcher (Mobile Only) */}
            <div className="lg:hidden flex p-1 bg-slate-900/50 rounded-2xl w-full border border-white/5 mb-1">
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'goals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Target className="w-3 h-3" /> Savings Goals
                </button>
                <button
                    onClick={() => setActiveTab('limits')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'limits' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Shield className="w-3 h-3" /> Spending Limits
                </button>
            </div>

            {/* Content Area - 2 Columns on Desktop */}
            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-1 items-start">
                {/* Goals Section */}
                <div className={`${activeTab !== 'goals' ? 'hidden lg:flex' : 'flex'} flex-col gap-3 w-full`}>
                
                    {/* Aggregate Savings Summary Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                       
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300">My Saved Money</h3>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-black text-white tracking-tighter">
                                        {formatCurrency(savingsStats.totalSaved)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">saved out of {formatCurrency(savingsStats.totalTarget)}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsAddGoalModalOpen(true)} 
                                className="p-1.5 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-3">
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-1.5 border border-white/5">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 bg-emerald-500"
                                    style={{ width: `${Math.min(savingsStats.percentage, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>{savingsStats.percentage.toFixed(0)}% Saved</span>
                                <span>{savingsStats.count} Goals</span>
                            </div>
                        </div>
                    </div>

                    {/* Goal Rows Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goals.length === 0 ? (
                            <button 
                                onClick={() => setIsAddGoalModalOpen(true)} 
                                className="border-2 border-dashed border-white/5 hover:border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center p-4 max-h-48 h-32 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all w-full col-span-full group"
                            >
                                <Plus className="w-6 h-6 mb-2 p-1 bg-slate-900 rounded-full border border-white/5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Start First Target</span>
                            </button>
                        ) : goals.map((goal) => (
                             <CompactGoalRow 
                                key={goal.id} 
                                goal={goal} 
                                formatCurrency={formatCurrency} 
                                onDeposit={() => setSelectedGoal(goal)}
                                onEdit={() => setEditingGoal(goal)}
                            />
                        ))}
                    </div>
                </div>
                {/* Limits Section */}
                <div className={`${activeTab !== 'limits' ? 'hidden lg:flex' : 'flex'} flex-col gap-3 w-full`}>
                    {/* Aggregate Summary Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                       
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300">Monthly Spending Limit</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Combined spending caps for all categories</p>
                            </div>
                            <button 
                                onClick={() => setIsAddBudgetModalOpen(true)} 
                                className="p-1.5 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-2xl font-black tracking-tighter ${budgetStats.totalSpent > budgetStats.totalLimit ? 'text-rose-500' : 'text-white'}`}>
                                {formatCurrency(budgetStats.totalSpent)}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                                / {formatCurrency(budgetStats.totalLimit)}
                            </span>
                        </div>

                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-1.5 border border-white/5">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${budgetStats.percentage > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${Math.min(budgetStats.percentage, 100)}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>{budgetStats.percentage.toFixed(0)}% Spent</span>
                            <span>{budgetStats.daysLeft} Days Left</span>
                        </div>
                    </div>

                    {/* Budget Rows Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                        {budgets.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center max-h-48 h-32 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-[10px] font-bold text-slate-500 uppercase tracking-widest">No limits set</div>
                        ) : (
                            budgets.map((budget) => (
                                <CompactBudgetRow key={budget.id} budget={budget} transactions={transactions} onDelete={onDeleteBudget} formatCurrency={formatCurrency} />
                            ))
                        )}
                    </div>
                </div>

            </div>

            {isAddGoalModalOpen && onAddGoal && (<AddGoalModal onClose={() => setIsAddGoalModalOpen(false)} onSubmit={onAddGoal} formatCurrency={formatCurrency} />)}
            {editingGoal && onUpdateGoal && (<AddGoalModal initialGoal={editingGoal} onClose={() => setEditingGoal(null)} onSubmit={onUpdateGoal} formatCurrency={formatCurrency} />)}
            {isAddBudgetModalOpen && onAddBudget && (<AddBudgetModal onClose={() => setIsAddBudgetModalOpen(false)} onSubmit={onAddBudget} />)}
            {selectedGoal && onUpdateGoal && (<DepositModal goal={selectedGoal} amount={depositAmount} setAmount={setDepositAmount} onClose={() => setSelectedGoal(null)} onSubmit={handleDeposit} />)}
        </div>
    );
};

const CompactBudgetRow: React.FC<{ budget: Budget, transactions: Transaction[], onDelete?: (id: string) => void, formatCurrency: (amount: number) => string | React.ReactNode }> = ({ budget, transactions, onDelete, formatCurrency }) => {
    const { spent, daysLeft } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dLeft = daysInMonth - now.getDate();

        const totalSpent = transactions
            .filter(t => 
                t.category === budget.category && 
                t.type === TransactionType.EXPENSE && 
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((acc, t) => acc + t.amount, 0);

        return { spent: totalSpent, daysLeft: Math.max(1, dLeft) }; 
    }, [budget.category, transactions]);

    const percentage = Math.min((spent / budget.limit) * 100, 100);
    const isOver = spent > budget.limit;

    let barColor = isOver ? 'bg-rose-500' : 'bg-indigo-500';

    return (
        <div className="bg-slate-900/50 hover:bg-slate-800/50 border border-white/5 hover:border-white/10 rounded-2xl p-3 transition-all group shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-200 text-xs truncate uppercase tracking-tight">{budget.category}</span>
                <div className="text-[10px] font-bold">
                    <span className={isOver ? 'text-rose-400' : 'text-slate-200'}>{formatCurrency(spent)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-slate-500">{formatCurrency(budget.limit)}</span>
                </div>
            </div>
            
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 mb-1">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold ${isOver ? 'text-rose-500' : 'text-indigo-400'}`}>{percentage.toFixed(0)}%</span>
                {onDelete && (
                     <button 
                         onClick={() => onDelete(budget.id)} 
                         className="text-slate-600 hover:text-rose-400 p-0.5"
                     >
                         <Trash2 className="w-3 h-3" />
                     </button>
                )}
            </div>
        </div>
    );
};

const CompactGoalRow: React.FC<{ goal: Goal, formatCurrency: (amount: number) => string | React.ReactNode, onDeposit: () => void, onEdit: () => void }> = ({ goal, formatCurrency, onDeposit, onEdit }) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isCompleted = progress >= 100;

    return (
        <div className="relative group overflow-hidden rounded-[2rem] aspect-square flex flex-col justify-between p-5 transition-all duration-300 border border-white/5 hover:border-white/15 hover:scale-[1.02] shadow-2xl bg-slate-900/60 backdrop-blur-md">
            {/* Atmosphere Background Image */}
            {goal.backgroundImage ? (
                <>
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={goal.backgroundImage} 
                            alt={goal.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    {/* Multi-layered atmospheric overlay to ensure readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/75 to-slate-950 z-0"></div>
                </>
            ) : (
                <>
                    {/* Default abstract colored gradient placeholder */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-20 z-0`}></div>
                    <div className="absolute inset-0 bg-slate-950/70 z-0"></div>
                </>
            )}

            {/* Content Top */}
            <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${goal.color} text-white shadow-lg`}>
                        {goal.icon === 'plane' && <Plane className="w-4 h-4" />}
                        {goal.icon === 'shield' && <Target className="w-4 h-4" />}
                        {goal.icon === 'laptop' && <Laptop className="w-4 h-4" />}
                        {goal.icon === 'home' && <Home className="w-4 h-4" />}
                        {!['plane','shield','laptop','home'].includes(goal.icon) && <Star className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-black text-white truncate uppercase tracking-wider drop-shadow-md">
                            {goal.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                            Savings Target
                        </span>
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950/50 backdrop-blur-md hover:bg-slate-800/50 border border-white/5 transition-colors z-20"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content Bottom */}
            <div className="relative z-10 space-y-4">
                {/* Financial Values Container */}
                <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Saved So Far</div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-2xl font-black text-white leading-none tracking-tight">
                            {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            of {formatCurrency(goal.targetAmount)} target
                        </span>
                    </div>
                </div>

                {/* Progress Bar with glass container */}
                <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/5 relative z-10 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : `bg-gradient-to-r ${goal.color}`}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider">
                        <span className={isCompleted ? 'text-emerald-400' : 'text-indigo-300'}>
                            {progress.toFixed(0)}% Saved
                        </span>
                        {goal.deadline && (
                            <span className="text-slate-400">
                                Target: {goal.deadline}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick actions row */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeposit(); }}
                    className="w-full py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-md hover:shadow-emerald-950/20 flex items-center justify-center gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Money To Goal
                </button>
            </div>
        </div>
    );
};

const AddGoalModal: React.FC<{ initialGoal?: Goal, onClose: () => void, onSubmit: (g: Goal) => void, formatCurrency: (amount: number) => string | React.ReactNode }> = ({ initialGoal, onClose, onSubmit, formatCurrency }) => {
    const [name, setName] = useState(initialGoal?.name || '');
    const [target, setTarget] = useState(initialGoal?.targetAmount.toString() || '');
    const [date, setDate] = useState(() => {
        if (initialGoal?.deadline) return initialGoal.deadline;
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        return futureDate.toISOString().split('T')[0];
    });
    const [backgroundImage, setBackgroundImage] = useState(initialGoal?.backgroundImage || '');
    const [monthlyContribution, setMonthlyContribution] = useState('500');
    const [error, setError] = useState('');
    const [isDragActive, setIsDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                if (uploadEvent.target?.result && typeof uploadEvent.target.result === 'string') {
                    setBackgroundImage(uploadEvent.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                if (uploadEvent.target?.result && typeof uploadEvent.target.result === 'string') {
                    setBackgroundImage(uploadEvent.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(date);
        
        if (isNaN(inputDate.getTime())) {
            setError("Please enter a valid date.");
            return;
        }

        const newGoal: Goal = { 
            id: initialGoal?.id || Date.now().toString(), 
            name, 
            targetAmount: parseFloat(target), 
            currentAmount: initialGoal?.currentAmount || 0, 
            deadline: date, 
            icon: initialGoal?.icon || 'star', 
            color: initialGoal?.color || 'from-pink-500 to-rose-500',
            backgroundImage
        };
        onSubmit(newGoal);
        onClose();
    };

    const calculation = useMemo(() => {
        const targetVal = parseFloat(target) || 0;
        const monthlyVal = parseFloat(monthlyContribution) || 1;
        const currentVal = initialGoal?.currentAmount || 0;
        const monthsNeeded = Math.ceil((targetVal - currentVal) / monthlyVal);
        
        const estDate = new Date();
        estDate.setMonth(estDate.getMonth() + (monthsNeeded > 0 ? monthsNeeded : 1));
        
        return { monthsNeeded: Math.max(0, monthsNeeded), estDate: estDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
    }, [target, monthlyContribution, initialGoal]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
             <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[95vh] animate-slide-up relative ring-1 ring-white/5 my-auto">
                 <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10 bg-black/20 rounded-full backdrop-blur-md"><XCircle className="w-6 h-6" /></button>
                 
                 <div className="p-10 border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-transparent relative overflow-hidden">
                     {backgroundImage && (
                         <div className="absolute inset-0 opacity-20 pointer-events-none">
                             <img src={backgroundImage} alt="" className="w-full h-full object-cover" />
                         </div>
                     )}
                     <div className="relative z-10">
                        <h3 className="text-3xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
                            {initialGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Save up for your dream</p>
                     </div>
                 </div>

                 <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What are you saving for? (Goal Title)</label>
                            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white mt-2 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-700 font-bold" placeholder="e.g. Porsche 911" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How much money do you need in total?</label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                    <input required type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 pl-8 text-white focus:border-indigo-500 focus:outline-none transition-all font-bold" placeholder="50000" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How much can you save each month? (Optional)</label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                    <input type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 pl-8 text-white focus:border-indigo-500 focus:outline-none transition-all font-bold" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Deadline</label>
                            <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white mt-2 focus:border-indigo-500 focus:outline-none transition-all font-bold" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspiration Poster (Upload image)</label>
                            <div 
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className={`mt-2 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all min-h-[140px] relative ${
                                    isDragActive 
                                        ? 'border-indigo-500 bg-indigo-500/10' 
                                        : backgroundImage 
                                          ? 'border-emerald-500/45 bg-emerald-500/5' 
                                          : 'border-white/10 hover:border-slate-700 bg-slate-950/40'
                                }`}
                            >
                                {backgroundImage ? (
                                    <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
                                         <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shadow-md mb-2">
                                             <img src={backgroundImage} alt="Preview" className="w-full h-full object-cover" />
                                         </div>
                                         <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">✓ Custom Image Loaded</p>
                                         <div className="flex gap-2.5 mt-2">
                                             <button 
                                                 type="button" 
                                                 onClick={() => {
                                                     const fileInput = document.getElementById('goal-image-upload') as HTMLInputElement;
                                                     if (fileInput) fileInput.click();
                                                 }}
                                                 className="text-[9px] uppercase font-black px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
                                             >
                                                 Replace
                                             </button>
                                             <button 
                                                 type="button" 
                                                 onClick={() => setBackgroundImage('')}
                                                 className="text-[9px] uppercase font-black px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/15 rounded-md text-rose-400 hover:text-rose-300"
                                             >
                                                 Remove
                                             </button>
                                         </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                         <Laptop className="w-7 h-7 text-slate-500 mb-1" />
                                         <p className="text-[11px] font-bold text-slate-300">Drag & drop your file or <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => document.getElementById('goal-image-upload')?.click()}>browse</span></p>
                                         <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">PNG, JPG, JPEG up to 5MB</p>
                                    </div>
                                )}
                                <input 
                                     type="file" 
                                     id="goal-image-upload" 
                                     accept="image/*" 
                                     onChange={handleFileChange} 
                                     className="hidden" 
                                />
                            </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Our Estimated Savings Timeline</span>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-2 py-1 rounded">Estimated</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-4xl font-black text-white">{calculation.monthsNeeded} <span className="text-base text-indigo-400">Months</span></div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">To reach target</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white mb-1">{calculation.estDate}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Estimated Finish</div>
                                    </div>
                                </div>
                                <div className="w-full h-32 bg-slate-950/30 rounded-xl border border-white/5 p-4 flex flex-col">
                                     {/* Visualization: Horizontal axis=Month, Vertical=Contribution */}
                                     <ResponsiveContainer width="100%" height="100%">
                                         <LineChart data={
                                             Array.from({ length: Math.min(24, calculation.monthsNeeded || 1) + 1 }).map((_, i) => ({
                                                 month: `M${i}`,
                                                 amount: Math.min((initialGoal?.currentAmount || 0) + (parseFloat(monthlyContribution) || 0) * i, parseFloat(target) || 0)
                                             }))
                                         } margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                             <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                             <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                             <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} width={45} />
                                             <Tooltip 
                                                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '10px' }}
                                                 itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                                 formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected']}
                                             />
                                             <Line type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 4, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 2 }} />
                                         </LineChart>
                                     </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                     </div>

                     <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t border-white/5">
                        <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            <span className="relative">{initialGoal ? 'Save My Changes' : 'Create My Savings Goal'}</span>
                        </button>
                     </div>
                 </form>
             </div>
        </div>
    );
};

const AddBudgetModal: React.FC<{ onClose: () => void, onSubmit: (b: Budget) => void }> = ({ onClose, onSubmit }) => {
    const [category, setCategory] = useState<Category | ''>('');
    const [limit, setLimit] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !limit) return;
        const newBudget: Budget = { 
            id: Date.now().toString(), 
            category: category as Category, 
            limit: parseFloat(limit),
            startDate: new Date().toISOString() 
        };
        onSubmit(newBudget);
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
             <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up relative ring-1 ring-white/5">
                 <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10"><XCircle className="w-6 h-6" /></button>
                 <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-transparent"><h3 className="text-2xl font-bold text-white flex items-center gap-2"><PieChart className="w-6 h-6 text-indigo-400" />Set Budget Limit</h3><p className="text-slate-400 text-sm mt-1">Cap your spending for a specific category.</p></div>
                 <form onSubmit={handleSubmit} className="p-8 space-y-5">
                     <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label><select required value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-white mt-2 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"><option value="" disabled>Select category</option>{Object.values(Category).map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
                     <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Limit</label><div className="relative mt-2"><DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input required type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 pl-9 text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600" placeholder="500" /></div></div>
                     <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 mt-4 active:scale-95 transition-all">Save Limit</button>
                 </form>
             </div>
        </div>
    );
};

const DepositModal: React.FC<{ goal: Goal, amount: string, setAmount: (v: string) => void, onClose: () => void, onSubmit: (e: React.FormEvent) => void }> = ({ goal, amount, setAmount, onClose, onSubmit }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
             <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up relative ring-1 ring-white/5">
                 <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10"><XCircle className="w-6 h-6" /></button>
                 <div className={`p-8 border-b border-white/5 bg-gradient-to-br ${goal.color} relative overflow-hidden`}><div className="absolute inset-0 bg-black/40"></div><div className="relative z-10"><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">Add Funds</h3><p className="text-sm text-white/80 font-medium">To: {goal.name}</p></div></div>
                 <form onSubmit={onSubmit} className="p-8 space-y-6">
                     <div><label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Amount to Deposit</label><div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span><input autoFocus required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-5 pl-10 text-3xl font-bold text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-700" placeholder="0" /></div></div>
                     <div className="flex gap-2 text-xs">{[50, 100, 500].map(val => (<button key={val} type="button" onClick={() => setAmount(val.toString())} className="flex-1 py-3 rounded-xl bg-slate-800 border border-white/5 hover:bg-slate-700 text-slate-300 font-bold transition-colors hover:border-white/20 active:scale-95">+${val}</button>))}</div>
                     <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all border border-white/10">Confirm Deposit</button>
                 </form>
             </div>
        </div>
    );
};

export default Goals;
