
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Budget, UserPlan, TransactionType, Category, BotMode, ChatMessage, FinancialSnapshot } from '../types';
import { Zap, X, AlertOctagon, CheckSquare, ArrowRight, ShieldAlert, TrendingUp, MessageSquare, Sparkles, Send, Bot, Loader2 } from 'lucide-react';
import { FoxLogo } from './FoxLogo';
import { chatWithFinancialCoach } from '../services/geminiService';
import { ACCOUNTS } from '../constants'; // we might need context
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface FloatingAssistantProps {
  transactions: Transaction[];
  budgets: Budget[];
  userPlan: UserPlan;
  botMode: BotMode;
  onOpenChat: (initialMessage?: string) => void;
  isVisible: boolean;
  insightUsage: number;
}

const SUGGESTED_QUESTIONS = [
  "Show a breakdown chart of my spending",
  "Am I spending too much on food?",
  "How can I save more this month?",
  "Analyze my recent transactions."
];

const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ transactions, budgets, userPlan, botMode, onOpenChat, isVisible, insightUsage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  
  if (!isVisible) return null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    const now = new Date();
    const currentMonthTxs = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth());
    const income = currentMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    const snapshot: FinancialSnapshot = {
        currentMonthMetrics: { income, expense, savingsRate: income > 0 ? (income - expense) / income : 0, topExpenseCategory: 'None' },
        recentTransactions: transactions.slice(0, 10),
        activeGoals: [],
        budgets: budgets
    };

    try {
        const response = await chatWithFinancialCoach(text, messages, snapshot, botMode, userPlan);
        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: response.message, 
            timestamp: new Date(),
            sentiment: response.sentiment as any,
            suggestedActions: response.suggestedActions,
            chartContext: response.chartContext
        }]);
    } catch (err) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm having trouble connecting right now.",
            timestamp: new Date(),
            sentiment: 'critical'
        }]);
    } finally {
        setIsTyping(false);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    return (
      <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-auto rounded-tr-sm' : 'bg-slate-800 text-slate-200 mr-auto rounded-tl-sm border border-white/5'}`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        
        {msg.chartContext && msg.chartContext.data && msg.chartContext.data.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950/70 border border-white/5 rounded-2xl w-full">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider mb-2 text-center">{msg.chartContext.title}</div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {msg.chartContext.type === 'pie' ? (
                  <PieChart cx="50%" cy="50%">
                    <Pie 
                      data={msg.chartContext.data} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={38} 
                      innerRadius={15}
                      fill="#6366f1"
                      paddingAngle={2}
                    >
                      {msg.chartContext.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                ) : msg.chartContext.type === 'line' ? (
                  <LineChart data={msg.chartContext.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                ) : (
                  <BarChart data={msg.chartContext.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {msg.chartContext.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`fixed bottom-24 md:bottom-6 right-6 z-40 flex flex-col items-end gap-3 transition-all animate-fade-in`}
      style={{ transform: 'scale(1.25)', transformOrigin: 'bottom right' }}
    >
        {isOpen && (
            <div className="bg-[#0f172a]/95 border border-white/10 p-5 rounded-3xl shadow-2xl w-80 h-96 mb-2 animate-slide-up backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40">
                            <FoxLogo className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Nova AI</h4>
                            <p className="text-[9px] text-slate-400">Financial Intelligence</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar flex flex-col gap-3 relative z-10 pb-2">
                    {messages.length === 0 ? (
                        <div className="space-y-2 mt-auto">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">Suggested Queries</p>
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSend(q)}
                                    className="w-full text-left p-3 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all group flex items-center justify-between"
                                >
                                    {q}
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <div key={msg.id} className="flex flex-col w-full">
                                    {renderMessageContent(msg)}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="p-3 rounded-2xl text-xs max-w-[85%] bg-slate-800 text-slate-200 mr-auto rounded-tl-sm border border-white/5 flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                    <span className="opacity-70">Nova is typing...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <div className="relative z-10 shrink-0">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(query);
                    }}>
                        <div className="relative flex items-center">
                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask Nova..."
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                disabled={isTyping}
                            />
                            <button type="submit" disabled={!query.trim() || isTyping} className="absolute right-2 p-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors">
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-2xl bg-[#020617] border border-white/10 flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 group overflow-hidden relative`}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <FoxLogo className="w-7 h-7 text-indigo-400 group-hover:text-white transition-colors relative z-10" />
        </button>
    </div>
  );
};

export default FloatingAssistant;

