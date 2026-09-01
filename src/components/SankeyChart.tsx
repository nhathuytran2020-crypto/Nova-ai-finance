
import React, { useMemo, useState } from "react";
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Layer } from "recharts";
import { Transaction, TransactionType, Category } from "../types";

interface SankeyChartProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string | React.ReactNode;
}

// Vibrant palette for dark mode contrast
const COLORS = {
    income: '#10b981',   // Emerald
    budget: '#6366f1',   // Indigo
    expenses: [
        '#f43f5e', // Rose
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
    ],
    savings: '#22c55e', // Green
    reserves: '#94a3b8' // Slate
};

const SankeyChart: React.FC<SankeyChartProps> = ({ transactions, formatCurrency }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    // 1. Calculate Inflows
    const incomeTxs = transactions.filter(t => t.type === TransactionType.INCOME);
    const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    
    // 2. Calculate Outflows by Category
    const expenseTxs = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const expenseMap: Record<string, number> = {};
    let totalExpense = 0;

    expenseTxs.forEach(t => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
        totalExpense += t.amount;
    });

    // 3. Construct Nodes & Links
    // We strictly enforce: Index 0,1 are Sources. Index 2 is Hub. Index 3+ are Destinations.
    
    const nodes: { name: string; color: string }[] = [
        { name: "Income", color: COLORS.income },       // Index 0
        { name: "Reserves", color: COLORS.reserves },   // Index 1 (Filler if spending > income)
        { name: "Budget Pool", color: COLORS.budget },  // Index 2 (Hub)
    ];

    const links: { source: number; target: number; value: number }[] = [];

    // Link: Income -> Budget
    if (totalIncome > 0) {
        links.push({ source: 0, target: 2, value: totalIncome });
    }

    // Link: Reserves -> Budget (Balance the flow if Expenses > Income)
    const flowVolume = Math.max(totalIncome, totalExpense);
    const deficit = Math.max(0, totalExpense - totalIncome);
    
    if (deficit > 0) {
        links.push({ source: 1, target: 2, value: deficit });
    } else if (totalIncome === 0 && totalExpense > 0) {
        // Edge case: Spending from previous savings entirely
        links.push({ source: 1, target: 2, value: totalExpense });
    }

    // Link: Budget -> Expenses & Savings
    const savings = Math.max(0, totalIncome - totalExpense);
    
    const sortedExpenses = Object.entries(expenseMap).sort((a,b) => b[1] - a[1]);

    sortedExpenses.forEach(([category, amount], index) => {
        if (amount > 0) {
            nodes.push({ 
                name: category, 
                color: COLORS.expenses[index % COLORS.expenses.length] 
            });
            links.push({ source: 2, target: nodes.length - 1, value: amount });
        }
    });

    // Link: Budget -> Savings
    if (savings > 0) {
        nodes.push({ name: "Savings", color: COLORS.savings });
        links.push({ source: 2, target: nodes.length - 1, value: savings });
    }

    // Ensure we have at least one link to render, otherwise Recharts crashes or shows blank
    if (links.length === 0) {
        return { nodes: [], links: [] };
    }

    return { nodes, links };
  }, [transactions]);

  if (data.nodes.length === 0 || data.links.length === 0) {
      return (
          <div className="w-full h-[500px] flex flex-col items-center justify-center bg-slate-900/40 rounded-[2rem] border border-white/5 animate-slide-up">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-2 border-slate-600 rounded-full"></div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Flow Map Inactive</h3>
              <p className="text-slate-500 text-sm">Record income and expenses to visualize the flow.</p>
          </div>
      );
  }

  // Custom Node Renderer to ensure text is White and positioned correctly
  const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
      const isSource = payload.name === "Income" || payload.name === "Reserves";
      const isHub = payload.name === "Budget Pool";
      const isDestination = !isSource && !isHub;

      // Logic for text positioning
      let textX = x + width + 6; // Default to right
      let textAnchor: "start" | "end" | "middle" | "inherit" = "start";

      if (isSource) {
         // Left nodes: Text to the left? Or inside if wide enough? 
         // Standard Sankey: Text usually inside or to the right. 
         // Let's put text inside if thick, otherwise right.
         textX = x + width + 6; 
      } else if (isDestination) {
         // Right nodes: Text to the left of the node to avoid cutting off? 
         // Actually usually strictly right for dests if space permits, or left.
         // Let's keep it simple: Text to the right for visibility, but ensure margins.
         textX = x - 6;
         textAnchor = "end";
      } else {
         // Hub
         textX = x + width / 2;
         textAnchor = "middle";
      }

      return (
        <Layer key={`node-${index}`}>
          <Rectangle
            x={x}
            y={y}
            width={width}
            height={height}
            fill={payload.color}
            fillOpacity={0.9}
            rx={4} // Rounded corners
            ry={4}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
            opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
          />
          {/* Label */}
          {height > 10 && (
              <text
                x={textX}
                y={y + height / 2}
                dy="0.35em"
                textAnchor={textAnchor}
                fontSize={12}
                fontWeight="bold"
                fill="#fff" // Force White Text
                style={{ 
                    pointerEvents: 'none', 
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)', // Shadow for contrast against lines
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.4
                }}
              >
                {payload.name}
              </text>
          )}
          {/* Value Label (only if tall enough) */}
          {height > 30 && (
              <text
                x={textX}
                y={y + height / 2 + 14}
                dy="0.35em"
                textAnchor={textAnchor}
                fontSize={10}
                fill="rgba(255,255,255,0.7)"
                style={{ pointerEvents: 'none' }}
              >
                {formatCurrency(payload.value)}
              </text>
          )}
        </Layer>
      );
  };

  return (
    <div className="w-full h-[500px] bg-[#020617] shadow-2xl rounded-[2.5rem] p-5 border border-white/5 flex flex-col animate-slide-up relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="mb-6 relative z-10 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Money Flow Map</h2>
            <p className="text-sm text-slate-400 font-medium">Income distribution mapping.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Total Funds</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expenses</span>
          </div>
      </div>
 
       <div className="flex-1 min-h-0 relative z-10">
         <ResponsiveContainer width="100%" height="100%">
             <Sankey
                 data={data}
                 nodePadding={24}
                 nodeWidth={12}
                 link={{ stroke: '#334155', strokeOpacity: 0.2 }} // Subtle link color
                 margin={{ left: 20, right: 120, top: 20, bottom: 20 }} // Right margin for labels
                 node={CustomNode}
             >
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: '16px', 
                        color: '#f8fafc', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                        padding: '12px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: number, name: string, props: any) => {
                        // Custom formatter to show clearer tooltips
                        if (props.payload.source && props.payload.target) {
                            return [formatCurrency(value), `${props.payload.source.name} → ${props.payload.target.name}`];
                        }
                        return [formatCurrency(value), name];
                    }}
                />
            </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SankeyChart;
