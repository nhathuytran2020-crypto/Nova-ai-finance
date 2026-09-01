import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieChartIcon, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DetailedChartsProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string | React.ReactNode;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#84cc16'];

const DetailedCharts: React.FC<DetailedChartsProps> = ({ transactions, formatCurrency }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [timeframe, setTimeframe] = useState<'month' | 'week'>('month');
  const [dataType, setDataType] = useState<'income' | 'expense'>('expense');

  const { chartData, totalCurrent, totalPrevious } = useMemo(() => {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const previousPeriodStart = new Date(now);
    const previousPeriodEnd = new Date(now);

    if (timeframe === 'month') {
        currentPeriodStart.setMonth(now.getMonth() - 1);
        previousPeriodEnd.setMonth(now.getMonth() - 1);
        previousPeriodStart.setMonth(now.getMonth() - 2);
    } else {
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodEnd.setDate(now.getDate() - 7);
        previousPeriodStart.setDate(now.getDate() - 14);
    }

    const filteredTransactions = transactions.filter(t => t.type === (dataType === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME));
    
    // Sort transactions into current and previous
    const currentItems = filteredTransactions.filter(t => new Date(t.date) >= currentPeriodStart);
    const previousItems = filteredTransactions.filter(t => new Date(t.date) >= previousPeriodStart && new Date(t.date) < previousPeriodEnd);

    let totalCurrent = 0;
    let totalPrevious = 0;

    const currentMap = currentItems.reduce((acc, tx) => {
        const cat = tx.category;
        acc[cat] = (acc[cat] || 0) + tx.amount;
        totalCurrent += tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const previousMap = previousItems.reduce((acc, tx) => {
        const cat = tx.category;
        acc[cat] = (acc[cat] || 0) + tx.amount;
        totalPrevious += tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(currentMap)
        .map(([name, entryValue]) => {
            const value = Number(entryValue);
            const prevValue = Number(previousMap[name] || 0);
            let percentChange = 0;
            let isNew = false;
            
            if (prevValue === 0 && value > 0) {
                isNew = true;
                percentChange = 100;
            }
            else if (prevValue > 0) {
                percentChange = ((value - prevValue) / prevValue) * 100;
            }

            return { 
                name, 
                value,
                prevValue,
                percentChange,
                isNew
            };
        })
        .sort((a, b) => b.value - a.value);

    return { chartData, totalCurrent, totalPrevious };
  }, [transactions, timeframe, dataType]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="flex flex-col h-full animate-fade-in pb-20 md:pb-0">
      <div className="glass-card flex-1 rounded-[2.5rem] border border-white/5 p-5 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{dataType === 'expense' ? 'Categorical Expenditures' : 'Categorical Income'}</h2>
                  <p className="text-sm font-medium text-slate-400">Detailed breakdown of your {dataType === 'expense' ? 'expenditures' : 'income'}.</p>
              </div>
              <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                      <button 
                          onClick={() => setDataType('expense')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${dataType === 'expense' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          Expense
                      </button>
                      <button 
                          onClick={() => setDataType('income')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${dataType === 'income' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          Income
                      </button>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="flex items-center bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                      <button 
                          onClick={() => setTimeframe('week')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${timeframe === 'week' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          Week
                      </button>
                      <button 
                          onClick={() => setTimeframe('month')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${timeframe === 'month' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          Month
                      </button>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="flex items-center bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                      <button 
                          onClick={() => setChartType('bar')}
                          className={`p-2.5 rounded-xl transition-all ${chartType === 'bar' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          <BarChart2 className="w-4 h-4" />
                      </button>
                      <button 
                          onClick={() => setChartType('pie')}
                          className={`p-2.5 rounded-xl transition-all ${chartType === 'pie' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                          <PieChartIcon className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>

          {/* Premium overview headers */}
          {!isEmpty && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
                  <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 shadow-inner">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Total {dataType === 'expense' ? 'Spent' : 'Earned'}</span>
                      <div className="text-2xl font-black text-white tracking-tight">{formatCurrency(totalCurrent)}</div>
                      <span className="text-[10px] text-slate-500 font-medium mt-1 block">Active period trajectory</span>
                  </div>
                  <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 shadow-inner">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Previous Period</span>
                      <div className="text-2xl font-black text-slate-400 tracking-tight">{formatCurrency(totalPrevious)}</div>
                      <span className="text-[10px] text-slate-500 font-medium mt-1 block">Historical comparison baseline</span>
                  </div>
                  <div className="bg-slate-950/60 border border-indigo-500/15 rounded-3xl p-5 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                      <div>
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Net Shift Margin</span>
                          <div className={`text-2xl font-black tracking-tight ${totalCurrent < totalPrevious ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {totalCurrent >= totalPrevious ? '+' : '-'}{formatCurrency(Math.abs(totalCurrent - totalPrevious))}
                          </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
                          totalCurrent < totalPrevious 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                          {totalPrevious > 0 ? `${(((totalCurrent - totalPrevious) / totalPrevious) * 100).toFixed(1)}%` : 'New'}
                      </span>
                  </div>
              </div>
          )}

          <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-center min-h-[400px] gap-8">
              {isEmpty ? (
                  <div className="text-center w-full flex-1">
                      <p className="text-slate-500 font-medium">No expense data available for this period.</p>
                  </div>
               ) : (
                   <>
                     <div className="w-full lg:w-1/2 h-[350px]">
                         <ResponsiveContainer width="100%" height="100%">
                             {chartType === 'bar' ? (
                                 <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                     <XAxis 
                                         dataKey="name" 
                                         stroke="#64748b" 
                                         fontSize={12} 
                                         tickLine={false} 
                                         axisLine={false} 
                                         angle={-45}
                                         textAnchor="end"
                                         dy={10}
                                     />
                                     <YAxis 
                                         stroke="#64748b" 
                                         fontSize={12} 
                                         tickLine={false} 
                                         axisLine={false} 
                                         tickFormatter={(value) => {
                                             if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                             if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                             return value.toString();
                                         }}
                                     />
                                     <Tooltip 
                                         cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                         contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                         itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                                         formatter={(val: number) => [formatCurrency(val), dataType === 'expense' ? 'Total Spent' : 'Total Income']}
                                     />
                                     <Bar 
                                         dataKey="value" 
                                         radius={[6, 6, 0, 0]}
                                     >
                                         {chartData.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                         ))}
                                     </Bar>
                                 </BarChart>
                             ) : (
                                 <PieChart>
                                     <Pie
                                         data={chartData}
                                         cx="50%"
                                         cy="50%"
                                         innerRadius={80}
                                         outerRadius={120}
                                         paddingAngle={5}
                                         dataKey="value"
                                         stroke="none"
                                     >
                                         {chartData.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                         ))}
                                     </Pie>
                                     <Tooltip 
                                         contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                         itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }} 
                                         formatter={(v: number) => [formatCurrency(v), dataType === 'expense' ? 'Total Spent' : 'Total Income']} 
                                     />
                                 </PieChart>
                             )}
                         </ResponsiveContainer>
                     </div>

                     <div className="w-full lg:w-1/2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                         <div className="space-y-3">
                             {chartData.map((item, index) => {
                                 const color = COLORS[index % COLORS.length];
                                 const isPositive = item.percentChange > 0;
                                 const isNegative = item.percentChange < 0;
                                 
                                 const isGood = dataType === 'expense' ? isNegative : isPositive;
                                 const isBad = dataType === 'expense' ? isPositive : isNegative;
                                 
                                 const relativePercentage = totalCurrent > 0 ? (item.value / totalCurrent) * 100 : 0;

                                 return (
                                     <div key={item.name} className="relative overflow-hidden flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-slate-900/60 transition-colors group">
                                         {/* Embedded Background Fill Bar */}
                                         <div 
                                             className="absolute top-0 bottom-0 left-0 opacity-[0.04] transition-all duration-700 pointer-events-none group-hover:opacity-[0.08]" 
                                             style={{ backgroundColor: color, width: `${relativePercentage}%` }}
                                         />
                                         
                                         <div className="flex items-center gap-3 relative z-10">
                                             <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}></div>
                                             <div>
                                                 <h4 className="text-white font-bold text-sm capitalize">{item.name}</h4>
                                                 <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(item.value)} <span className="text-[10px] text-slate-500 font-bold ml-1">({relativePercentage.toFixed(1)}%)</span></p>
                                             </div>
                                         </div>
                                         
                                         <div className="text-right relative z-10">
                                             {item.isNew ? (
                                                 <div className={`flex items-center justify-end gap-1 text-xs font-bold ${dataType === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                     <TrendingUp className="w-3 h-3" />
                                                     New
                                                 </div>
                                             ) : (
                                                 <div className={`flex items-center justify-end gap-1 text-xs font-bold ${
                                                     isGood ? 'text-emerald-400' : isBad ? 'text-rose-400' : 'text-slate-400'
                                                 }`}>
                                                     {isNegative && <TrendingDown className="w-3 h-3" />}
                                                     {isPositive && <TrendingUp className="w-3 h-3" />}
                                                     {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                                                     {Math.abs(item.percentChange).toFixed(1)}%
                                                 </div>
                                             )}
                                             <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                                                 vs prev {timeframe}
                                             </p>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                   </>
               )}
          </div>
      </div>
    </div>
  );
};

export default DetailedCharts;
