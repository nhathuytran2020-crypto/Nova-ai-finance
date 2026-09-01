
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, AIAnalysisResponse, ChatMessage, UserPlan, TransactionType, Budget, BotMode, Category, Goal, FinancialSnapshot, SuggestedAction, GoalProposal, DailyReport, MonthlyReport, ReportType } from '../types';
import { analyzeFinancialData, chatWithFinancialCoach, generateDailyInsight, generateMonthlyInsight } from '../services/geminiService';
import { generateMonthlyReport } from '../services/reportEngine';
import { RefreshCcw, CheckCircle, AlertTriangle, ShieldAlert, Info, TrendingUp, Bot, BrainCircuit, Send, Lock, Sparkles, RefreshCw, Zap, Crown, Target, Calendar, Check, Activity, MessageSquare, ArrowUpRight, Flame, Utensils, ShoppingCart, Lightbulb, MoreHorizontal, Wallet, ShieldCheck, Brain, ChevronRight, X, ArrowRight, Printer } from 'lucide-react';
import PrintableMonthlyReport from './PrintableMonthlyReport';
import { FoxLogo } from './FoxLogo';
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid } from 'recharts';

interface InsightsProps {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  userPlan: UserPlan;
  onUpgradeClick: () => void;
  formatCurrency: (amount: number) => string | React.ReactNode;
  initialPrompt?: string | null; 
  onPromptHandled?: () => void; 
  onApplyBudgets?: (budgets: Budget[]) => void; 
  insightUsage: number; 
  onIncrementUsage: () => void; 
  botMode: BotMode;
  onNavigate: (tab: string) => void;
  onAddGoal?: (goal: Goal) => void;
  autoScanTriggered?: boolean;
  activeReport?: ReportType;
  spendingLimit?: number;
  onUpdateTransaction?: (t: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "Show a breakdown chart of my spending",
  "Am I spending too much on food?",
  "How can I save more this month?",
  "Analyze my recent transactions."
];

const DEFAULT_MOCK_DAILY: DailyReport = {
    date: new Date().toISOString(),
    status: 'Action Needed' as const,
    summary: 'A 242% transaction spike in Dining Out has ruptured your daily baseline capacity.',
    details: 'A critical $154.20 spend at Sushi Royal represents 15.4% of your total monthly discretionary reserve. To restore your baseline budget curve, you must strictly implement a Restoration Cap of $12.50 per day for the remaining 14 days of this month.',
    cashFlow: {
        spentToday: 154.20,
        dailyBudget: 45.00,
        remainingDailyBudget: 0.00
    },
    projections: {
        spentThisMonth: 820.00,
        projectedMonthEnd: 1420.00,
        monthlyBudget: 1000.00
    },
    topCategories: [
        { name: 'Food & Dining', amount: 154.20, percentageOfSpend: 100 },
        { name: 'Shopping', amount: 0.00, percentageOfSpend: 0 },
        { name: 'Transportation', amount: 0.00, percentageOfSpend: 0 }
    ],
    advice: [
        'Strictly freeze all discretionary Dining Out targets for the next 72 hours.',
        'Implement a hard $12.50 daily Restoration Cap to smooth the deficit trajectory.',
        'Consider preparing meals at home to reduce the weekly Food burn rate.'
    ]
};

const DEFAULT_MOCK_MONTHLY: MonthlyReport = {
    month: 'May 2026',
    healthScore: 68,
    healthLevel: 'Stable',
    riskScore: 72,
    metrics: {
        savingsPowerIndex: 0.12,
        expenseLoadRatio: 0.88,
        subscriptionBurdenScore: 0.15,
        lifestyleInflationRate: 0.05,
        dependencyIndex: 0.8
    },
    totals: {
        income: 5000,
        expenses: 4400,
        savings: 600,
        prevExpenses: 4000
    },
    strategicPlan: {
        objective: 'Stabilize discretionary categories and reduce fixed subscription overhead.',
        actions: [
            'Audit the active $120/mo subscription stack and prune unused items.',
            'Maintain a $25/day daily limit on general shopping to hit savings target.',
            'Direct a minimum of 15% of all incoming paychecks to high-yield reserve account.'
        ],
        outcome: 'Achieve a 20% savings rate by Q3.'
    },
    problems: [
        { title: 'Suboptimal Savings Rate (12% vs 25% target)', severity: 'high' as const },
        { title: 'Detected 18 micro-transactions totaling $184', severity: 'medium' as const }
    ],
    markdownReport: `# Monthly Money Checkup

## 1. The Big Picture
Your money growth is a bit slow right now. While you are making enough money, spending too much on extra things has made it hard to save.

* **Savings Goal:** 25.0%
* **Actually Saved:** 12.0%
* **Missed by:** 13.0%

---

## 2. Spending Habits
Your highest spending day was **Wednesday the 14th**, when you spent $240 during a shopping trip. During that week, you spent about **$85.00** every day, which is much higher than your normal limits.

* **What might happen next:** If you keep spending like this, you will be short by **$140** at the end of the month.
* **How to fix it:** Try to spend only **$18.50** a day on extra things to get back on track.

---

## 3. Hidden Leaks
* **Extra Subscriptions:** You are paying for Netflix, Disney+, and YouTube Premium at the same time. This is costing you **$54.00** every month.
* **Small Habits:** Buying coffee and snacks ($5-$12 each time) added up to **$124.00** this month.
`
};

const Insights: React.FC<InsightsProps> = ({ 
    transactions, 
    goals, 
    budgets, 
    userPlan, 
    onUpgradeClick, 
    formatCurrency, 
    initialPrompt, 
    onPromptHandled, 
    onApplyBudgets, 
    insightUsage, 
    onIncrementUsage, 
    botMode, 
    onNavigate, 
    onAddGoal,
    autoScanTriggered = false,
    activeReport,
    spendingLimit = 1000,
    onUpdateTransaction,
    onDeleteTransaction
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
        id: '1', 
        role: 'assistant', 
        content: botMode === 'ruthless' 
            ? 'Coach system ready. Ask me a question or request an audit report.' 
            : 'Hello! I\'m here to help you understand your money. Ask me anything or request an audit report!', 
        timestamp: new Date(),
        sentiment: 'info'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Dedicated Report State
  const [activeView, setActiveView] = useState<'idle' | 'daily' | 'monthly' | 'ai'>('idle');
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showPrintableReport, setShowPrintableReport] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const isUltra = userPlan === 'ultra';
  const isPro = userPlan === 'pro';
  const currentLimit = isUltra ? 500 : isPro ? 50 : 3;
  const isLocked = insightUsage >= currentLimit;

  // Focus Mode Logic: Full screen for Daily and Monthly reports
  const isFocusMode = activeView === 'daily' || activeView === 'monthly';

  // Handle activeReport trigger from external nav
  useEffect(() => {
      if (activeReport === 'daily') {
          handleGenerateDaily();
      } else if (activeReport === 'monthly') {
          handleGenerateMonthly();
      }
  }, [activeReport, transactions, spendingLimit]);

  // Initial Prompt Handler
  useEffect(() => {
      if (initialPrompt && onPromptHandled) {
          handleSendMessage(null, initialPrompt);
          onPromptHandled();
      }
  }, [initialPrompt]);

  const handleGenerateDaily = async () => {
      if (reportLoading) return;
      setActiveView('daily');
      setReportLoading(true);
      if (isMockMode) {
          setTimeout(() => {
              if (!dailyReport) {
                  setDailyReport(DEFAULT_MOCK_DAILY);
              }
              setReportLoading(false);
          }, 1000);
          return;
      }
      setError(null);
      try {
          const report = await generateDailyInsight(transactions, spendingLimit || 1000, userPlan);
          setDailyReport(report);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
          setReportLoading(false);
      }
  };

  const handleGenerateMonthly = async () => {
      if (reportLoading) return;
      setActiveView('monthly');
      setReportLoading(true);
      if (isMockMode) {
          setTimeout(() => {
              if (!monthlyReport) {
                  setMonthlyReport(DEFAULT_MOCK_MONTHLY as any);
              }
              setReportLoading(false);
          }, 1100);
          return;
      }
      try {
          // Use reportEngine for static data first
          const staticReport = generateMonthlyReport(transactions, spendingLimit || 1000);
          setMonthlyReport(staticReport);

          // Enrich with AI Insight
          const aiInsight = await generateMonthlyInsight(transactions, spendingLimit || 1000, userPlan);
          if (aiInsight) {
              setMonthlyReport(prev => prev ? { 
                  ...prev, 
                  healthScore: aiInsight.healthScore || prev.healthScore,
                  markdownReport: aiInsight.markdownReport,
                  strategicPlan: prev.strategicPlan
              } : null);
          }
      } catch (err) {
          console.error("Monthly Insight failed", err);
      } finally {
          setReportLoading(false);
      }
  };

  const closeReport = () => {
      setActiveView('idle');
  };

  const runAnalysis = async () => {
    if (isLocked || loading) return;
    setLoading(true);
    setError(null);
    onIncrementUsage();
    setActiveView('ai'); // Switch view immediately to show loading there
    
    try {
      const result = await analyzeFinancialData(transactions, userPlan);
      if (result) setAnalysis(result);
      else setError("Coach is analyzing other portfolios. Try again.");
    } catch (e) {
      setError("Unable to connect to financial brain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoScanTriggered && !analysis && !loading && !isLocked) {
        runAnalysis();
    }
  }, [autoScanTriggered, analysis, loading, isLocked]);

  const handleAcceptProposal = (proposal: GoalProposal) => {
      if (proposal.type === 'goal' && onAddGoal) {
          onAddGoal({
              id: new Date().getTime().toString(),
              name: proposal.title,
              targetAmount: proposal.target_amount,
              currentAmount: 0,
              deadline: proposal.deadline || new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              icon: 'star',
              color: 'from-emerald-500 to-teal-500'
          });
      } else if (proposal.type === 'budget' && onApplyBudgets) {
          onApplyBudgets([{
              id: `ai_${new Date().getTime()}`,
              category: (proposal.category as Category) || Category.OTHER,
              limit: proposal.target_amount,
              startDate: new Date().toISOString()
          }]);
      }
      if (analysis) setAnalysis({ ...analysis, goal_proposals: analysis.goal_proposals.filter(p => p.id !== proposal.id) });
  };

  const handleSendMessage = async (e: React.FormEvent | null, promptOverride?: string) => {
    if (e) e.preventDefault();
    const content = promptOverride || chatInput;
    if (!content.trim() || isLocked) return;

    onIncrementUsage();
    // Using Date.now() for consistency and reliability
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: content, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const now = new Date();
    const currentMonthTxs = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth());
    const income = currentMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    const catMap: Record<string, number> = {};
    currentMonthTxs.filter(t => t.type === TransactionType.EXPENSE).forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const topCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0];

    const snapshot: FinancialSnapshot = {
        currentMonthMetrics: {
            income,
            expense,
            savingsRate: income > 0 ? (income - expense) / income : 0,
            topExpenseCategory: topCat ? topCat[0] : 'None'
        },
        recentTransactions: transactions.slice(0, 10),
        activeGoals: goals,
        budgets: budgets
    };

    try {
        const response = await chatWithFinancialCoach(userMsg.content, chatHistory, snapshot, botMode, userPlan);
        setChatHistory(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: response.message, 
            timestamp: new Date(),
            sentiment: response.sentiment as any,
            suggestedActions: response.suggestedActions,
            chartContext: response.chartContext
        }]);
    } catch (err) {
        setChatHistory(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm having trouble connecting to the analysis core right now. Please try again in a moment.",
            timestamp: new Date(),
            sentiment: 'critical'
        }]);
    } finally {
        setChatLoading(false);
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.actionId.startsWith('navigate_')) {
        const tab = action.actionId.replace('navigate_', '');
        onNavigate(tab);
    } else if (action.actionId === 'chat_prompt' && action.payload) {
        handleSendMessage(null, action.payload);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, chatLoading]);

  // --- SUB-COMPONENTS ---

  const RiskGauge = ({ score }: { score: number }) => {
      const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
      const color = safeScore >= 60 ? '#f43f5e' : safeScore >= 30 ? '#f59e0b' : '#10b981';
      const offset = 201 - (safeScore / 100) * 201;
      
      return (
          <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke={color} strokeWidth="6" fill="transparent" strokeDasharray={201} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-white">{Math.round(safeScore)}</span>
                  <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Risk</span>
              </div>
          </div>
      );
  };

  const HealthGauge = ({ score }: { score: number }) => {
      const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
      const color = safeScore >= 80 ? '#10b981' : safeScore >= 50 ? '#f59e0b' : '#f43f5e';
      const offset = 201 - (safeScore / 100) * 201;

      return (
          <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke={color} strokeWidth="6" fill="transparent" strokeDasharray={201} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-white">{Math.round(safeScore)}</span>
                  <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500">Health</span>
              </div>
          </div>
      );
  };

  const renderDailyReport = () => {
      if (error) {
          return (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
                  <p className="text-slate-300 font-bold max-w-sm">{error}</p>
              </div>
          );
      }
      if (reportLoading) {
          return (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
          );
      }
      if (!dailyReport) return null;

      const statusColor = dailyReport.status === 'On Track' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : dailyReport.status === 'Caution' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10';
      const statusIcon = dailyReport.status === 'On Track' ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : dailyReport.status === 'Caution' ? <AlertTriangle className="w-6 h-6 text-amber-400" /> : <ShieldAlert className="w-6 h-6 text-rose-400" />;
      const dailyScore = dailyReport.status === 'On Track' ? 95 : dailyReport.status === 'Caution' ? 65 : 35;

      return (
          <div className="font-sans text-slate-200 space-y-6 animate-slide-up pb-10 max-w-5xl mx-auto">
              
              {/* DATE HEADER */}
              <div className="flex justify-between items-end">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Daily Brief</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(dailyReport.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>

              {/* Daily Pre-Transaction Pending Verification Widget */}
              {transactions.filter(t => t.isVirtual).length > 0 && (
                  <div className="p-6 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/[0.02] shadow-[0_0_40px_rgba(245,158,11,0.02)] flex flex-col gap-4 animate-fade-in">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Sparkles className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider">Daily Pre-Transactions Pending</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Nova factored these planned transactions into your Daily Analysis. Confirm if they were made:</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {transactions.filter(t => t.isVirtual).map(t => (
                              <div key={t.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                      <span className="block text-xs font-bold text-slate-200 truncate capitalize">{t.merchant}</span>
                                      <span className="block text-[9px] text-slate-500 font-mono mt-0.5">{t.category} • {formatCurrency(t.amount)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                      {onUpdateTransaction && (
                                          <button 
                                              onClick={() => onUpdateTransaction({ ...t, isVirtual: false })}
                                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg transition-all border border-emerald-500/20"
                                              title="Confirm purchase"
                                          >
                                              <Check className="w-3.5 h-3.5" />
                                          </button>
                                      )}
                                      {onDeleteTransaction && (
                                          <button 
                                              onClick={() => onDeleteTransaction(t.id)}
                                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 rounded-lg transition-all border border-rose-500/20"
                                              title="Dismiss planned"
                                          >
                                              <X className="w-3.5 h-3.5" />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                      {/* STATUS CARD */}
                      <section className={`p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl`}>
                          <div className="flex items-center gap-3 mb-4">
                               <span className="shrink-0">{statusIcon}</span>
                              <h2 className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                                  Your money management is: <span className={`${dailyReport.status === 'Action Needed' ? 'text-rose-400' : dailyReport.status === 'Caution' ? 'text-amber-400' : 'text-emerald-400'}`}>{dailyReport.status === 'Action Needed' ? 'ACTION NEEDED' : dailyReport.status.toUpperCase()}</span>
                              </h2>
                          </div>
                          <div className="text-3xl font-light text-white mb-6 tracking-tight">
                              Spent Today: <span className="font-bold">{formatCurrency(dailyReport.cashFlow.spentToday)}</span>
                          </div>
                          <div className="space-y-3 pb-6 border-b border-white/5">
                              <div className="text-sm font-medium text-slate-400">
                                  Month-to-Date Baseline: <span className="text-slate-200">{formatCurrency(dailyReport.projections.spentThisMonth)}</span> spent against a <span className="text-slate-200">{formatCurrency(dailyReport.projections.monthlyBudget)}</span> target.
                              </div>
                              <div className="text-sm font-bold text-white">
                                  Current Month Projection: {formatCurrency(dailyReport.projections.projectedMonthEnd)}{' '}
                                  <span className={`${dailyReport.projections.projectedMonthEnd > dailyReport.projections.monthlyBudget ? 'text-rose-400' : 'text-emerald-400'} font-medium`}>
                                      (Variance: {dailyReport.projections.projectedMonthEnd > dailyReport.projections.monthlyBudget ? '+' : ''}{formatCurrency(dailyReport.projections.projectedMonthEnd - dailyReport.projections.monthlyBudget)})
                                  </span>
                              </div>
                          </div>
                          
                          {/* Daily Score Rating */}
                          <div className="pt-5 space-y-3">
                              <p className="text-xs text-slate-400 font-medium">
                                  if I have to rate your financial action today, your score will be:
                              </p>
                              <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                                  <div className={`w-14 h-14 rounded-full border-2 ${dailyScore >= 80 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : dailyScore >= 50 ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-rose-500/30 text-rose-400 bg-rose-500/5'} flex items-center justify-center font-black text-xl font-mono shrink-0`}>
                                      {dailyScore}
                                  </div>
                                  <div>
                                      <div className={`text-xs font-black uppercase tracking-widest ${dailyScore >= 80 ? 'text-emerald-400' : dailyScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                          {dailyScore >= 80 ? 'Excellent Action' : dailyScore >= 50 ? 'Correction Required' : 'Critical Outflow'}
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-0.5">Calculated based on actual daily burn velocity vs predefined monthly budget limit.</p>
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* CATEGORY BREAKDOWN */}
                      {dailyReport.topCategories && dailyReport.topCategories.length > 0 && (
                          <section className="p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Top Spending Areas</h3>
                              <div className="space-y-3">
                                  {dailyReport.topCategories.map((cat, idx) => (
                                      <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                          <div className="flex items-center gap-3">
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                              <span className="text-sm font-medium text-slate-300">{cat.name}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                              <span className="text-sm font-bold text-white">{formatCurrency(cat.amount)}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </section>
                      )}
                  </div>

                  <div className="space-y-6">
                      {/* DETAILS & WHY */}
                      <section className="p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                          <div className="flex items-center gap-2 mb-4">
                              <BrainCircuit className="w-5 h-5 text-indigo-400" />
                              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Operational Insight</h3>
                          </div>
                          <div className="space-y-6">
                              <p className="text-sm font-medium text-white leading-relaxed">
                                  {dailyReport.summary}
                              </p>
                              <div className="space-y-5">
                                  {dailyReport.details.split('.').filter(d => d.trim().length > 0).map((detail, idx) => (
                                      <div key={idx} className="space-y-2">
                                          <div className="flex items-start gap-3">
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                                              <p className="text-sm text-slate-300 leading-relaxed font-light">{detail.trim()}.</p>
                                          </div>
                                          {dailyReport.advice && dailyReport.advice[idx] && (
                                              <div className="ml-4 pl-4 border-l border-emerald-500/30 flex items-start gap-3">
                                                  <Target className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                  <p className="text-[13px] text-emerald-100 font-medium leading-relaxed">{dailyReport.advice[idx]}</p>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </section>

                      {/* REMAINING ACTIONABLE ADVICE */}
                      {dailyReport.advice && dailyReport.details.split('.').filter(d => d.trim().length > 0).length < dailyReport.advice.length && (
                          <section className="p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                              <div className="flex items-center gap-2 mb-4">
                                  <Target className="w-5 h-5 text-emerald-400" />
                                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Additional Priority Actions</h3>
                              </div>
                              <ul className="space-y-4">
                                  {dailyReport.advice.slice(dailyReport.details.split('.').filter(d => d.trim().length > 0).length).map((adv, idx) => (
                                      <li key={idx} className="flex items-start gap-4 text-sm text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-4 py-1">
                                          <span>{adv}</span>
                                      </li>
                                  ))}
                              </ul>
                          </section>
                      )}
                      
                      {/* FINISHED BUTTON */}
                      <div className="pt-2">
                          <button 
                              onClick={closeReport}
                              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                          >
                              <Check className="w-4 h-4" /> Finished Review
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderMonthlyReport = () => {
      if (reportLoading) {
          return (
              <div className="flex flex-col items-center justify-center h-full min-h-[450px] space-y-6 text-center max-w-sm mx-auto animate-fade-in mt-12">
                  <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-tr from-amber-650 to-amber-450 rounded-2xl animate-spin shadow-lg shadow-amber-500/10"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Activity className="w-8 h-8 text-white animate-pulse" />
                      </div>
                  </div>
                  <div>
                      <h3 className="text-sm font-black text-white tracking-tight uppercase">Compiling Monthly Financial Audit</h3>
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em] mt-1.5 animate-pulse text-stretch">Executing Multi-Vector Ledger Analysis</p>
                  </div>
                  <div className="w-full bg-slate-950/60 rounded-full h-1 border border-white/5 overflow-hidden">
                      <div className="bg-amber-450 h-full animate-pulse" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest space-y-1 text-left w-full max-w-xs pl-8">
                      <div>// Parsing database categories... [OK]</div>
                      <div>// Correlating subscription friction... [OK]</div>
                      <div>// Rendering strategic PDF template... [PENDING]</div>
                  </div>
              </div>
          );
      }
      if (!monthlyReport) return null;
      return (
          <div className="font-sans text-slate-200 space-y-10 animate-fade-in pb-10 max-w-2xl mx-auto px-4 mt-8">
              
              {/* HEADER */}
              <div className="flex items-end justify-between border-b border-white/10 pb-6">
                  <div>
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Monthly Audit</h3>
                      <h2 className="text-3xl font-light text-white tracking-tight">{monthlyReport.month}</h2>
                  </div>
                  <div className="text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Health Score</div>
                      <div className={`text-4xl font-light tracking-tight flex items-center justify-end gap-3 ${monthlyReport.healthScore >= 70 ? 'text-emerald-400' : monthlyReport.healthScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {monthlyReport.healthScore}
                      </div>
                  </div>
              </div>

              {/* CORE METRICS OR MARKDOWN CONTENT */}
              {monthlyReport.markdownReport ? (
                  <div className="markdown-body font-light text-slate-300 leading-relaxed text-sm format-markdown">
                      <ReactMarkdown>{monthlyReport.markdownReport}</ReactMarkdown>
                  </div>
              ) : (
                  <>
                      {/* CORE METRICS */}
                      <div className="grid grid-cols-3 gap-6">
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Savings Rate</p>
                              <p className={`text-2xl font-light tracking-tight ${monthlyReport.metrics.savingsPowerIndex > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{(monthlyReport.metrics.savingsPowerIndex * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Fixed Load</p>
                              <p className="text-2xl font-light tracking-tight text-white">{(monthlyReport.metrics.expenseLoadRatio * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Risk Factor</p>
                              <p className={`text-2xl font-light tracking-tight ${monthlyReport.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{monthlyReport.riskScore.toFixed(0)}</p>
                          </div>
                      </div>

                      {/* STRATEGY */}
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.1em] flex items-center gap-2 mb-3"><Sparkles className="w-3.5 h-3.5" /> Assessment</h4>
                              <p className="text-lg font-light text-slate-200 leading-relaxed border-l-2 border-indigo-500/30 pl-4 py-1">{monthlyReport.strategicPlan.objective}</p>
                          </div>
                          
                          {monthlyReport.macroForecast && (
                              <div className="pt-2">
                                  <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-2">Hidden Trend</p>
                                  <p className="text-sm font-light text-slate-300 leading-relaxed">{monthlyReport.macroForecast}</p>
                              </div>
                          )}

                          <div className="pt-2">
                              <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-3">Next Month's Focus</p>
                              <ul className="space-y-3">
                                  {monthlyReport.strategicPlan.actions.map((act, i) => (
                                      <li key={i} className="flex items-start gap-4 text-sm font-light text-slate-200 leading-relaxed">
                                          <div className="text-xs text-emerald-500/50 font-mono mt-0.5" style={{fontFeatureSettings: '"tnum"'}}>{(i+1).toString().padStart(2, '0')}</div>
                                          <span>{act}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>

                      {/* ISSUES */}
                      {monthlyReport.problems && monthlyReport.problems.length > 0 && (
                          <div className="pt-6 border-t border-white/5 space-y-4">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detected Threats</h4>
                              <div className="space-y-3">
                                  {monthlyReport.problems.map((prob, idx) => (
                                      <div key={idx} className="flex items-start gap-3">
                                          <div className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${prob.severity === 'high' ? 'bg-rose-500' : prob.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                          <div>
                                              <p className="text-sm text-slate-200 font-medium mb-0.5">{prob.title}</p>
                                              { (prob as any).description && <p className="text-xs text-slate-400 font-light leading-relaxed">{ (prob as any).description }</p> }
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </>
              )}
              
              {/* FINISHED BUTTON */}
              <div className="pt-8 grid grid-cols-2 gap-4 border-t border-white/5">
                  <button 
                      onClick={closeReport}
                      className="w-full py-3.5 bg-transparent hover:bg-white/5 text-white text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                      <Check className="w-4 h-4" /> Finished Review
                  </button>
                  <button 
                      onClick={() => setShowPrintableReport(true)}
                      className="w-full py-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                  >
                      <Printer className="w-4 h-4" /> Print Report
                  </button>
              </div>
              
              {showPrintableReport && (
                  <PrintableMonthlyReport 
                      report={monthlyReport} 
                      userName="Bronny"
                      onClose={() => setShowPrintableReport(false)} 
                  />
              )}
          </div>
      );
  };

  const renderAiAnalysis = () => {
      if (loading) {
          return (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                  <div className="relative mb-6">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl animate-spin shadow-lg shadow-indigo-600/30"></div>
                      <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit className="w-8 h-8 text-white drop-shadow-md" /></div>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight">Reviewing Finances...</h3>
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Looking for insights</p>
              </div>
          );
      }
      if (!analysis) return null;

      return (
          <div className="font-sans text-slate-200 space-y-6 animate-slide-up pb-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-between items-end mb-2">
                  <div>
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Holistic Analysis</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI-Powered Overview</p>
                  </div>
                  <RiskGauge score={analysis.risk_score} />
              </div>

              <div className="p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Predicted Spend (30d)</p>
                      <p className="text-3xl font-black text-white drop-shadow-sm">{formatCurrency(analysis.predicted_spend_next_month)}</p>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <TrendingUp className="w-8 h-8 text-indigo-400 drop-shadow-md" />
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-1">Insights</h4>
                  {analysis.insights.map((insight, idx) => (
                      <div key={idx} className="p-5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                              {insight.type === 'success' && <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400"><CheckCircle className="w-4 h-4" /></div>}
                              {insight.type === 'warning' && <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400"><AlertTriangle className="w-4 h-4" /></div>}
                              {insight.type === 'critical' && <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400"><ShieldAlert className="w-4 h-4" /></div>}
                              {insight.type === 'info' && <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400"><Info className="w-4 h-4" /></div>}
                              <span className="text-sm font-bold text-white">{insight.title}</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed pl-10">{insight.description}</p>
                      </div>
                  ))}
              </div>

              {analysis.goal_proposals && analysis.goal_proposals.length > 0 && (
                  <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-xl mt-6">
                      <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Opportunities Detected</h4>
                      <div className="space-y-4">
                          {analysis.goal_proposals.map((proposal) => (
                              <div key={proposal.id} className="p-5 bg-slate-950/50 rounded-xl border border-emerald-500/10 space-y-4 transition-all hover:border-emerald-500/30">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="text-base font-bold text-white mb-2">{proposal.title}</p>
                                          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{proposal.reason_simple}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xl font-black text-emerald-400 drop-shadow-sm">{formatCurrency(proposal.target_amount)}</p>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Target</p>
                                      </div>
                                  </div>
                                  <button onClick={() => handleAcceptProposal(proposal)} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                      <Check className="w-4 h-4" /> Implement Routine
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              
              {/* FINISHED BUTTON */}
              <div className="pt-2">
                  <button 
                      onClick={closeReport}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  >
                      <Check className="w-4 h-4" /> Finished Review
                  </button>
              </div>
          </div>
      );
  };

  const Loader2 = () => (
      <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Running Analysis...</p>
      </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 overflow-hidden">
        {isLocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm text-center shadow-2xl">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Usage Limit Reached</h3>
                    <p className="text-slate-400 text-sm mb-6">You've used all {currentLimit} free AI analyses for this cycle. Upgrade to Elite for unlimited access.</p>
                    <button onClick={onUpgradeClick} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:scale-105 transition-all">Upgrade Now</button>
                </div>
            </div>
        )}

        {/* Left Panel: Reports & Actions */}
        <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-500 ease-in-out ${isFocusMode ? 'w-full' : 'w-full md:w-[45%] lg:w-[50%]'}`}>
            
            {/* Header */}
            {!isFocusMode && activeView === 'idle' ? (
                <div className="shrink-0 flex items-center justify-between pt-2 pb-2 px-1">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <Bot className="w-6 h-6 text-indigo-500" /> Financial Coach
                        </h2>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">Select an analysis protocol to begin.</p>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-900 rounded-lg border border-white/5 text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest shadow-inner">
                        {insightUsage} / {currentLimit} OPS
                    </div>
                </div>
            ) : !isFocusMode ? (
                <div className="shrink-0 flex items-center justify-between mb-2">
                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-500" /> Financial Coach
                    </h2>
                    <div className="px-2 py-0.5 bg-slate-800 rounded border border-white/5 text-[9px] font-bold text-slate-400">
                        {insightUsage} / {currentLimit} OPS
                    </div>
                </div>
            ) : (
                <div className="shrink-0 flex items-center justify-between mb-2 p-3 bg-slate-900/80 rounded-2xl border border-white/5 backdrop-blur-md animate-fade-in shadow-xl">
                    <div className="flex items-center gap-4 px-2">
                        <div className={`p-2.5 rounded-xl ${activeView === 'daily' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {activeView === 'daily' ? <Zap className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {activeView === 'daily' ? 'Daily Analysis' : 'Monthly Audit'}
                        </h2>
                    </div>
                    <button 
                        onClick={closeReport}
                        className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className={`flex-1 ${activeView === 'idle' ? '' : 'bg-slate-950/30 rounded-3xl border border-white/5 p-5'} overflow-y-auto custom-scrollbar relative ${isFocusMode ? 'shadow-2xl bg-slate-900/20' : ''}`}>
                {activeView === 'idle' && (
                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={handleGenerateDaily}
                            className="bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/80 transition-all rounded-3xl p-6 text-left group flex items-start gap-5 shadow-lg"
                        >
                            <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shrink-0">
                                <Zap className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Daily Snapshot</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">Review your spending for today against your budget limits and get actionable tips.</p>
                            </div>
                        </button>
                        
                        <button 
                            onClick={handleGenerateMonthly}
                            className="bg-slate-900/50 border border-white/5 hover:border-amber-500/30 hover:bg-slate-800/80 transition-all rounded-3xl p-6 text-left group flex items-start gap-5 shadow-lg"
                        >
                            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all shrink-0">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">Monthly Audit</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">A complete check of how much you are saving and how you are spending your money.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => onNavigate('smart_money')}
                            className="bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all rounded-3xl p-6 text-left group flex items-start gap-5 shadow-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                <BrainCircuit className="w-32 h-32 text-emerald-400" />
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shrink-0 relative z-10">
                                <BrainCircuit className="w-8 h-8" />
                            </div>
                            <div className="relative z-10 pr-12">
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">"What If" Scenario</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">Ask a "what if" question about a big purchase to see how it affects your savings goals.</p>
                            </div>
                        </button>
                    </div>
                )}
                {activeView === 'daily' && renderDailyReport()}
                {activeView === 'monthly' && renderMonthlyReport()}
                {activeView === 'ai' && renderAiAnalysis()}
            </div>
        </div>

        {/* Right Panel: Chat Interface */}
        {!isFocusMode && (
            <div className="flex-1 bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in group/chat">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover/chat:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center z-10 shrink-0 shadow-sm relative">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600/30 rounded-2xl flex items-center justify-center border border-indigo-500/40 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-indigo-400/30" />
                            <FoxLogo className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-white text-base tracking-tight">Nova AI</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Financial Intelligence</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setChatHistory([])}
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all hover:-rotate-180 duration-500"
                        title="Clear Chat"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
                    {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in opacity-95 pt-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 mb-5 shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
                                <FoxLogo className="w-8 h-8 text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <h3 className="text-lg font-black text-white mb-2 tracking-tight">How can I assist you?</h3>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">Ask me anything about your current budget limits, savings milestones, category burns, or transaction audits.</p>
                            
                            <div className="w-full space-y-2 text-left">
                                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-2">Suggested Quick Queries</div>
                                {SUGGESTED_QUESTIONS.map((q, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendMessage(null, q)}
                                        className="w-full text-left p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/30 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-between group shadow-sm"
                                    >
                                        <span>{q}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group/message`}>
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40 shrink-0 mr-3 mt-1 shadow-sm">
                                    <FoxLogo className="w-4 h-4 text-indigo-300" />
                                </div>
                            )}
                            <div className="flex flex-col max-w-[85%]">
                                <div className={`py-3 px-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm relative ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                                        : 'bg-slate-900/80 backdrop-blur-md text-slate-200 rounded-bl-sm border border-white/5 shadow-xl'
                                }`}>
                                    <div className="markdown-body text-xs leading-relaxed font-normal">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            
                            {/* Rich Graphical Context Renderer */}
                            {msg.chartContext && msg.chartContext.data && msg.chartContext.data.length > 0 && (
                                <div className="mt-4 p-5 bg-slate-950/80 border border-white/10 rounded-3xl w-full shadow-inner max-w-lg mb-2 relative overflow-hidden group/graph animate-fade-in ring-1 ring-white/5">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="flex justify-between items-center mb-3.5 relative z-10">
                                        <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5" />
                                            {msg.chartContext.title || "Interactive Graph"}
                                        </div>
                                        <div className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md">Live Analysis</div>
                                    </div>
                                    
                                    <div className="h-44 w-full relative z-10 my-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {msg.chartContext.type === 'pie' ? (
                                                <PieChart>
                                                    <Pie 
                                                        data={msg.chartContext.data} 
                                                        dataKey="value" 
                                                        nameKey="name" 
                                                        cx="50%" 
                                                        cy="50%" 
                                                        outerRadius={56} 
                                                        innerRadius={24}
                                                        fill="#6366f1"
                                                        paddingAngle={3}
                                                    >
                                                        {msg.chartContext.data.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 6]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '10px', color: '#fff' }} />
                                                    <Legend formatter={(value) => <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{value}</span>} iconSize={6} iconType="circle" />
                                                </PieChart>
                                            ) : msg.chartContext.type === 'line' ? (
                                                <LineChart data={msg.chartContext.data} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                                                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '10px', color: '#fff' }} />
                                                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', stroke: '#090d16', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
                                                </LineChart>
                                            ) : (msg.chartContext.type as string) === 'area' ? (
                                                <AreaChart data={msg.chartContext.data} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="areaGlowChat" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                                                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '10px', color: '#fff' }} />
                                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#areaGlowChat)" />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={msg.chartContext.data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                                                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '10px', color: '#fff' }} />
                                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                                        {msg.chartContext.data.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Data value breakdown spreadsheet - highly detailed */}
                                    <div className="mt-4 pt-3.5 border-t border-white/5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider relative z-10 bg-slate-900/20 p-2.5 rounded-2xl border border-white/5">
                                        {msg.chartContext.data.map((entry: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center py-0.5 border-b border-white/5 pb-1">
                                                <span className="truncate max-w-[140px] text-slate-400">{entry.name}</span>
                                                <span className="text-white font-mono font-black">${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {msg.suggestedActions && (
                                <div className="flex flex-wrap gap-2 mt-3 justify-start max-w-[90%]">
                                    {msg.suggestedActions.map((action, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleActionClick(action)} 
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm group border border-indigo-500/10"
                                        >
                                            {action.label} <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <span className={`text-[9px] text-slate-600 font-bold mt-1.5 px-2 opacity-0 group-hover/message:opacity-100 transition-opacity ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40 shrink-0 mr-3 mt-1 shadow-sm">
                                <FoxLogo className="w-4 h-4 text-indigo-300" />
                            </div>
                            <div className="flex items-center gap-1.5 py-4 px-5 bg-slate-900/80 backdrop-blur-md rounded-2xl rounded-bl-sm border border-white/5 shadow-xl">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 relative z-20 shrink-0">
                    {/* Suggested Queries Pill Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 justify-start no-scrollbar max-w-full">
                        {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSendMessage(null, q)}
                                className="shrink-0 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 hover:border-indigo-500/30 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="relative flex items-center group/input">
                        <input 
                            type="text" 
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            placeholder="Type a command or query..." 
                            className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 shadow-inner transition-all placeholder:text-slate-500"
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || chatLoading} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all opacity-80 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed group-hover/input:scale-105 active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Insights;
