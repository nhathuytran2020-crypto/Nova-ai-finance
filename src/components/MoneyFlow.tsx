
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, UserPlan, Category } from '../types';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle } from 'recharts';
import { Wallet, ArrowRight } from 'lucide-react';

interface MoneyFlowProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string | React.ReactNode;
  userPlan: UserPlan;
}

// Exact colors inspired by the "SankeyMatic" reference style
const THEME = {
  // Left Side (Sources)
  incomeMain: '#fde047', // Yellow-300
  incomeSide: '#facc15', // Yellow-400
  
  // Center (Hub)
  budget: '#bef264',     // Lime-300
  
  // Right Side (Destinations)
  savings: '#34d399',    // Emerald-400 (Distinct Green for savings)
  
  // Expense Palette (Cool tones -> Warm tones)
  exp_housing: '#818cf8', // Indigo-400
  exp_food: '#60a5fa',    // Blue-400
  exp_shop: '#c084fc',    // Purple-400
  exp_life: '#f472b6',    // Pink-400
  exp_transport: '#fb7185', // Rose-400
  exp_util: '#22d3ee',    // Cyan-400
  exp_other: '#94a3b8',   // Slate-400
};

const getCategoryColor = (cat: string): string => {
  if (cat === 'Savings') return THEME.savings;
  switch (cat) {
    case Category.HOUSING: return THEME.exp_housing;
    case Category.FOOD: return THEME.exp_food;
    case Category.SHOPPING: return THEME.exp_shop;
    case Category.ENTERTAINMENT: return THEME.exp_life;
    case Category.TRANSPORT: return THEME.exp_transport;
    case Category.UTILITIES: return THEME.exp_util;
    case Category.HEALTH: return THEME.exp_transport;
    case Category.SUBSCRIPTION: return THEME.exp_shop;
    default: return THEME.exp_other;
  }
};

const MoneyFlow: React.FC<MoneyFlowProps> = ({ transactions, formatCurrency, userPlan }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. Filter Transactions for Current Month
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const incomeTxs = monthTxs.filter(t => t.type === TransactionType.INCOME);
    const expenseTxs = monthTxs.filter(t => t.type === TransactionType.EXPENSE);

    const totalIncome = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
    
    // Logic: The central node must equal the larger of (Income, Expenses) to balance the Sankey.
    // If Income > Expenses, the remainder is "Savings".
    // If Expenses > Income, the difference is "Deficit" (or pulled from reserves).
    const flowVolume = Math.max(totalIncome, totalExpense);
    
    const savings = Math.max(0, totalIncome - totalExpense);
    const deficit = Math.max(0, totalExpense - totalIncome);

    // --- Nodes Construction ---
    // We need a specific order to force columns: Sources -> Hub -> Destinations
    const nodes: { name: string; value?: number; color?: string }[] = [];
    const links: { source: number; target: number; value: number; color?: string }[] = [];

    // --- Group 1: Income Sources (Column 0) ---
    const incomeMap: Record<string, number> = {};
    incomeTxs.forEach(t => {
        const key = t.merchant || 'Other Income';
        incomeMap[key] = (incomeMap[key] || 0) + t.amount;
    });

    const sortedIncome = Object.entries(incomeMap).sort((a,b) => b[1] - a[1]);
    
    let sourceIndexStart = 0;
    sortedIncome.forEach(([name, val]) => {
        nodes.push({ name, value: val, color: THEME.incomeMain });
    });

    // If deficit, treat it as a source (money coming from savings/credit)
    if (deficit > 0) {
        nodes.push({ name: 'From Reserves', value: deficit, color: '#f87171' });
    }
    
    // If absolutely no data, push a dummy node to prevent crash
    if (nodes.length === 0) {
        nodes.push({ name: 'No Data', value: 1, color: '#334155' });
    }

    // --- Group 2: The Budget Hub (Column 1) ---
    const budgetNodeIndex = nodes.length;
    nodes.push({ name: 'Budget', value: flowVolume, color: THEME.budget });

    // --- Group 3: Expenses & Savings (Column 2) ---
    const expenseMap: Record<string, number> = {};
    expenseTxs.forEach(t => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
    });

    const sortedExpenses = Object.entries(expenseMap).sort((a,b) => b[1] - a[1]);
    const destIndexStart = nodes.length;

    sortedExpenses.forEach(([cat, val]) => {
        nodes.push({ name: cat, value: val, color: getCategoryColor(cat) });
    });

    if (savings > 0) {
        nodes.push({ name: 'Savings', value: savings, color: THEME.savings });
    }

    // --- Build Links ---
    
    // 1. Sources -> Budget Hub
    // These links generally take the color of the Source (Yellowish)
    let currentSourceIdx = 0;
    sortedIncome.forEach(([_, val]) => {
        links.push({ source: currentSourceIdx, target: budgetNodeIndex, value: val, color: THEME.incomeMain });
        currentSourceIdx++;
    });
    if (deficit > 0) {
        links.push({ source: currentSourceIdx, target: budgetNodeIndex, value: deficit, color: '#f87171' });
    }
    // Handle case where graph is empty but we added dummy node
    if (sortedIncome.length === 0 && deficit === 0 && flowVolume > 0) {
         // This handles the "Expenses only, no income recorded yet" edge case
         // We link the 'No Data' or implicit source to budget
         links.push({ source: 0, target: budgetNodeIndex, value: flowVolume, color: '#94a3b8' });
    }


    // 2. Budget Hub -> Destinations
    // These links MUST take the color of the TARGET to create the rainbow fan effect
    let currentDestIdx = destIndexStart;
    sortedExpenses.forEach(([cat, val]) => {
        const targetColor = getCategoryColor(cat);
        links.push({ source: budgetNodeIndex, target: currentDestIdx, value: val, color: targetColor });
        currentDestIdx++;
    });
    if (savings > 0) {
        links.push({ source: budgetNodeIndex, target: currentDestIdx, value: savings, color: THEME.savings });
    }

    return { nodes, links, flowVolume };
  }, [transactions]);

  // If literally no data
  if (data.flowVolume === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-10 bg-slate-900/20 rounded-[3rem] border border-white/5 relative overflow-hidden">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Money Flow Empty</h3>
            <p className="text-slate-400 max-w-md">Record transactions to generate your financial map.</p>
        </div>
      );
  }

  // --- Renderers ---

  const SankeyNode = ({ x, y, width, height, index, payload }: any) => {
      if (!payload) return null;
      
      const isHub = payload.name === 'Budget';
      // Determine if node is on the left (Source) or right (Dest) based on X position relative to container width (approx)
      // Recharts passes X. Let's assume a standard width container.
      // If x is small -> Left. If x is large -> Right. Hub is in middle.
      
      // Simple heuristic: Hub is likely the one with the most connections, but we know its name.
      
      const isLeft = x < 100; 
      const isRight = !isLeft && !isHub;

      const showLabel = height > 15; // Only label if tall enough
      const percent = ((payload.value / data.flowVolume) * 100).toFixed(0) + '%';

      return (
        <g 
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className="cursor-pointer transition-opacity duration-300"
            style={{ opacity: activeIndex === null || activeIndex === index ? 1 : 0.4 }}
        >
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={payload.color || '#888'}
                fillOpacity={0.9}
                radius={2}
            />
            
            {showLabel && (
                <text
                    x={isLeft ? x - 8 : isRight ? x + width + 8 : x + width / 2}
                    y={y + height / 2}
                    dy={-6} // Shift up slightly for name
                    textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                    {payload.name}
                </text>
            )}
            {showLabel && (
                <text
                    x={isLeft ? x - 8 : isRight ? x + width + 8 : x + width / 2}
                    y={y + height / 2}
                    dy={8} // Shift down for value
                    textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                    fill={payload.color}
                    fontSize={10}
                    fontWeight="bold"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                    {formatCurrency(payload.value)} ({percent})
                </text>
            )}
        </g>
      );
  };

  const SankeyLink = (props: any) => {
      const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, source, target, payload } = props;
      
      // Inherit color from payload if explicitly set in data generation (Budget -> Dest links)
      // Otherwise fallback to source color (Source -> Budget links)
      const fillColor = payload.color || source.color;
      
      return (
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
            L${targetX},${targetY + linkWidth}
            C${targetControlX},${targetY + linkWidth} ${sourceControlX},${sourceY + linkWidth} ${sourceX},${sourceY + linkWidth}
            Z
          `}
          fill={fillColor}
          stroke="none"
          fillOpacity={0.5}
          style={{ transition: 'fill-opacity 0.3s ease', mixBlendMode: 'screen' }} // Screen blend mode helps colors pop on dark bg
          className="hover:fill-opacity-80"
        />
      );
  };

  return (
    <div className="animate-slide-up pb-20 space-y-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
               Capital Flow
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black tracking-widest border border-white/5">MONTHLY VIEW</span>
          </div>
          <p className="text-slate-400 font-medium">Visualizing the journey of every dollar from source to destination.</p>
        </div>
      </div>

      <div className="glass-card p-4 md:p-8 rounded-[2rem] border border-white/10 bg-[#020617] relative overflow-hidden min-h-[600px] flex flex-col shadow-2xl">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none"></div>
          
          <div className="flex-1 w-full relative z-10 h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                  <Sankey
                    data={data}
                    nodeWidth={12}
                    nodePadding={20}
                    margin={{ left: 140, right: 160, top: 20, bottom: 20 }}
                    link={SankeyLink}
                    node={SankeyNode}
                  >
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const d = payload[0].payload;
                            // Check if it is a link or a node
                            const isLink = d.source && d.target;
                            
                            if (isLink) {
                                return (
                                    <div className="bg-slate-950/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-300">{d.source.name}</span>
                                            <ArrowRight className="w-3 h-3 text-slate-500" />
                                            <span className="font-bold text-white">{d.target.name}</span>
                                        </div>
                                        <div className="text-lg font-black text-white">{formatCurrency(d.value)}</div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                  </Sankey>
              </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center items-center gap-6 mt-4 opacity-60 flex-wrap">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background: THEME.incomeMain}}></div><span className="text-[10px] uppercase font-bold text-slate-400">Income</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background: THEME.budget}}></div><span className="text-[10px] uppercase font-bold text-slate-400">Budget</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background: THEME.exp_housing}}></div><span className="text-[10px] uppercase font-bold text-slate-400">Expenses</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background: THEME.savings}}></div><span className="text-[10px] uppercase font-bold text-slate-400">Savings</span></div>
          </div>
      </div>
    </div>
  );
};

export default MoneyFlow;
