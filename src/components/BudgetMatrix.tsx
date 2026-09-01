import React, { useMemo, useState } from 'react';
import { Transaction, Budget, Category, TransactionType } from '../types';
import { Target, Activity, DollarSign, Wallet, MoreHorizontal } from 'lucide-react';
import EditCategoryModal from './EditCategoryModal';

interface BudgetMatrixProps {
  transactions: Transaction[];
  budgets: Budget[];
  formatCurrency: (amount: number) => string | React.ReactNode;
}

const GROUP_DEFINITIONS = [
  {
    name: 'Fixed Costs',
    categories: [Category.HOUSING, Category.UTILITIES, Category.SUBSCRIPTION],
  },
  {
    name: 'Variable Spending',
    categories: [
      Category.FOOD,
      Category.TRANSPORT,
      Category.ENTERTAINMENT,
      Category.SHOPPING,
      Category.HEALTH,
      Category.TRAVEL,
      Category.PETS,
      Category.KIDS,
      Category.GIFTS,
      Category.SERVICES,
      Category.OTHER,
    ],
  },
  {
    name: 'Savings & Investments',
    categories: [Category.INVESTMENT],
  },
];

const BudgetMatrix: React.FC<BudgetMatrixProps> = ({ transactions, budgets, formatCurrency }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const percentageElapsed = (now.getDate() / daysInMonth) * 100;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{name: string, group: string} | null>(null);

  const handleEditClick = (category: string, group: string) => {
    setEditingCategory({ name: category, group });
    setEditModalOpen(true);
  };

  // Filter this month's transactions
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  // Provide a default budget matrix if user has none
  const activeBudgets = useMemo(() => {
    if (budgets && budgets.length > 0) return budgets;
    
    // Default mock setup if zero budgets
    return [
      { id: '1', category: Category.HOUSING, limit: 1500 },
      { id: '2', category: Category.UTILITIES, limit: 200 },
      { id: '3', category: Category.SUBSCRIPTION, limit: 100 },
      { id: '4', category: Category.FOOD, limit: 600 },
      { id: '5', category: Category.TRANSPORT, limit: 200 },
      { id: '6', category: Category.SHOPPING, limit: 300 },
      { id: '7', category: Category.ENTERTAINMENT, limit: 150 },
    ] as Budget[];
  }, [budgets]);

  // Aggregate category spend
  const categorySpend = useMemo(() => {
    const spend = new Map<Category, number>();
    monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      spend.set(t.category, (spend.get(t.category) || 0) + t.amount);
    });
    return spend;
  }, [monthlyTransactions]);

  const totalIncome = useMemo(() => {
      return monthlyTransactions
          .filter(t => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const groups = useMemo(() => {
    return GROUP_DEFINITIONS.map(groupDef => {
      const items = groupDef.categories.map(cat => {
        const budgetItem = activeBudgets.find(b => b.category === cat);
        const budgetedAmount = budgetItem ? budgetItem.limit : 0;
        const actualSpent = categorySpend.get(cat) || 0;
        const remainingBalance = budgetedAmount - actualSpent;
        const percentUsed = budgetedAmount > 0 ? (actualSpent / budgetedAmount) * 100 : (actualSpent > 0 ? 100 : 0);
        
        return {
          category: cat,
          budgetedAmount,
          actualSpent,
          remainingBalance,
          percentUsed
        };
      }).filter(item => item.budgetedAmount > 0 || item.actualSpent > 0);

      const groupBudgeted = items.reduce((sum, item) => sum + item.budgetedAmount, 0);
      const groupActual = items.reduce((sum, item) => sum + item.actualSpent, 0);
      const groupRemaining = groupBudgeted - groupActual;

      return {
        name: groupDef.name,
        items,
        groupBudgeted,
        groupActual,
        groupRemaining
      };
    }).filter(g => g.items.length > 0);
  }, [activeBudgets, categorySpend]);

  const totalBudgetedExpenses = groups.reduce((sum, g) => sum + (g.name !== 'Savings & Investments' ? g.groupBudgeted : 0), 0);
  const totalActualExpenses = groups.reduce((sum, g) => sum + (g.name !== 'Savings & Investments' ? g.groupActual : 0), 0);
  const totalRemainingSafeToSpend = totalBudgetedExpenses - totalActualExpenses;

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-6">
      {/* Main Ledger Column */}
      <div className="flex-1 space-y-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Budget Matrix</h2>
        
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden">
            {/* Group Header - The Roll-up */}
            <div className="bg-slate-800/50 p-5 flex items-center justify-between border-b border-white/5">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">{group.name}</h3>
              <div className="flex gap-8 text-right text-xs">
                <div>
                  <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Budget</div>
                  <div className="text-slate-300 font-bold tracking-tight">{formatCurrency(group.groupBudgeted)}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Actual</div>
                  <div className="text-white font-bold tracking-tight">{formatCurrency(group.groupActual)}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold uppercase tracking-wider mb-1">Remaining</div>
                  <div className={`font-bold tracking-tight ${group.groupRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {group.groupRemaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(group.groupRemaining))}
                  </div>
                </div>
              </div>
            </div>

            {/* Nested Line Items */}
            <div className="p-2 space-y-1">
              {group.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group/item relative">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                       <div className="text-[13px] font-bold text-slate-300">{item.category}</div>
                       <button 
                         onClick={() => handleEditClick(item.category, group.name)}
                         className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 text-slate-500 hover:text-white"
                       >
                         <MoreHorizontal size={14} />
                       </button>
                    </div>
                  </div>
                  
                  {/* Inline Micro-progress Pacing */}
                  <div className="hidden md:flex items-center flex-1 pr-6 justify-center">
                    <div className="relative h-2.5 w-[150px] bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      {/* Budget Fill */}
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${item.percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(item.percentUsed, 100)}%`, boxShadow: item.percentUsed > 100 ? '0 0 10px rgba(244, 63, 94, 0.5)' : 'none' }}
                      />
                      {/* Timeline Notch */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                        style={{ left: `${percentageElapsed}%` }}
                        title={`Month elapsed: ${Math.round(percentageElapsed)}%`}
                      />
                    </div>
                  </div>

                  {/* 3-Column Numeric Ledger */}
                  <div className="flex gap-6 md:gap-8 text-right text-xs">
                    <div className="w-16 flex justify-end">
                      <div className="text-slate-400 font-bold tracking-tight">{formatCurrency(item.budgetedAmount)}</div>
                    </div>
                    <div className="w-16 flex justify-end">
                      <div className="text-white font-bold tracking-tight">{formatCurrency(item.actualSpent)}</div>
                    </div>
                    <div className="w-16 flex justify-end">
                      <div className={`font-bold tracking-tight ${item.remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.remainingBalance >= 0 ? '' : '-'}{formatCurrency(Math.abs(item.remainingBalance))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Calculations Widget */}
      <div className="w-full xl:w-80 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Macro Health</h3>
            </div>

            <div className="space-y-6">
              {/* Income vs Earnings */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inflows (MTD)</div>
                  <div className="text-sm font-bold tracking-tight text-white">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Expense Trajectory */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outlays / Target</div>
                  <div className="text-sm text-white font-bold tracking-tight">
                    <span>{formatCurrency(totalActualExpenses)}</span>
                    <span className="text-slate-500 font-medium"> / {formatCurrency(totalBudgetedExpenses)}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${totalActualExpenses > totalBudgetedExpenses ? 'bg-rose-500' : 'bg-slate-400'}`} 
                    style={{ width: `${Math.min((totalActualExpenses / (totalBudgetedExpenses || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Left to Budget / Safe to spend */}
              <div className="pt-4 border-t border-white/5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Safe-to-Spend Margin</div>
                <div className={`text-3xl font-black tracking-tight ${totalRemainingSafeToSpend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalRemainingSafeToSpend >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalRemainingSafeToSpend))}
                </div>
                {totalRemainingSafeToSpend < 0 && (
                  <div className="text-[10px] text-rose-500/80 uppercase font-bold mt-2">Deficit Warning Active</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/20 text-indigo-300">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Pacing Guide</div>
            </div>
            <p className="text-[11px] leading-relaxed">
              The white tick mark on each progress bar indicates where you should be today ({Math.round(percentageElapsed)}% through the month).
            </p>
          </div>
        </div>
      </div>
      
      {editingCategory && (
        <EditCategoryModal 
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          categoryName={editingCategory.name}
          initialGroup={editingCategory.group}
          onSave={({ group, isRollover, isExcluded }) => {
            console.log("Saving category settings:", { group, isRollover, isExcluded });
            // Here you would normally update the backend/state with these preferences
          }}
        />
      )}
    </div>
  );
};

export default BudgetMatrix;
