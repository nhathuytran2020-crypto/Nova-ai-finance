
import React, { useState, useMemo } from 'react';
import { generateNegotiationScript } from '../services/geminiService';
import { Handshake, Loader2, DollarSign, Copy, Check, FileText, Zap, ShieldAlert, ArrowRight, Plus, X, Search, TrendingDown, ExternalLink, AlertTriangle, Info, CheckCircle, Calculator, Calendar, AlertOctagon, TrendingUp, Clock, PauseCircle, Star, Crown, ChevronRight, Lock } from 'lucide-react';
import { UserPlan, Transaction, TransactionType, Category } from '../types';

interface BillNegotiatorProps {
  userPlan: UserPlan;
  onIncrementUsage: () => void;
  negotiationUsage: number;
  transactions?: Transaction[];
  onUpgradeClick: () => void;
}

interface SubscriptionItem {
    id: string;
    name: string;
    amount: number;
    lastDate: string;
    status: 'Safe' | 'Medium' | 'Danger';
}

const BillNegotiator: React.FC<BillNegotiatorProps> = ({ userPlan, onIncrementUsage, negotiationUsage, transactions = [], onUpgradeClick }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [negotiationType, setNegotiationType] = useState<'discount' | 'cancel' | 'downgrade'>('discount');

  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const isElite = userPlan === 'ultra';
  const isPro = userPlan === 'pro';
  
  // Usage Limits
  const usageLimit = isElite ? 9999 : isPro ? 100 : 1;
  const remainingCredits = Math.max(0, usageLimit - negotiationUsage);
  const isLimitReached = !isElite && remainingCredits === 0;

  const parsedSections = useMemo(() => {
      if (!generatedScript) return null;
      
      const parts = generatedScript.split('### 🧠 STRATEGIC FEASIBILITY ANALYSIS');
      let scriptText = parts[0]
        .replace('### 📋 COPY-PASTE SCRIPT', '')
        .trim();
      let analysisText = parts[1] || '';
      
      // Clean up triple backticks if any
      scriptText = scriptText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
      
      const analysisData = {
          successRate: '',
          riskFactor: '',
          counterObjection: ''
      };
      
      const lines = analysisText.split('\n');
      for (const line of lines) {
          const lower = line.toLowerCase();
          if (lower.includes('success rate') || lower.includes('feasibility score')) {
              analysisData.successRate = line.replace(/^[\s\-\*]*((Success Rate)|(Feasibility Score))\*\*?:? /i, '').trim();
          } else if (lower.includes('risk factor') || lower.includes('threat rating')) {
              analysisData.riskFactor = line.replace(/^[\s\-\*]*((Risk Factor)|(Downgrade\/Cancellation Threat Rating))\*\*?:? /i, '').trim();
          } else if (lower.includes('counter objection plan') || lower.includes('retention counter-objection')) {
              analysisData.counterObjection = line.replace(/^[\s\-\*]*((Counter Objection Plan)|(Retention Counter-Objection))\*\*?:? /i, '').trim();
          }
      }

      return {
          scriptText,
          analysisText: analysisText.trim(),
          analysisData
      };
  }, [generatedScript]);

  const subscriptions = useMemo(() => {
      try {
          const merchantMap = new Map<string, Transaction>();
          const safeTx = Array.isArray(transactions) ? transactions : [];
          
          safeTx.forEach(t => {
              if (t.type === TransactionType.EXPENSE) {
                  const isSubCategory = t.category === Category.SUBSCRIPTION || t.category === Category.UTILITIES || t.category === Category.ENTERTAINMENT;
                  if (isSubCategory) {
                      const key = t.merchant.toLowerCase().trim();
                      const existing = merchantMap.get(key);
                      if (!existing || new Date(t.date) > new Date(existing.date)) {
                          merchantMap.set(key, t);
                      }
                  }
              }
          });

          const detected: SubscriptionItem[] = [];
          merchantMap.forEach(t => {
              let status: 'Safe' | 'Medium' | 'Danger' = 'Safe';
              if (t.amount > 100) status = 'Danger';
              else if (t.amount > 40) status = 'Medium';

              detected.push({
                  id: t.id,
                  name: t.merchant,
                  amount: t.amount,
                  lastDate: t.date,
                  status
              });
          });

          return detected.sort((a, b) => b.amount - a.amount);
      } catch (err) {
          return [];
      }
  }, [transactions]);

  const activeItem = subscriptions.find(s => s.id === selectedId) || null;

  const handleGenerate = async () => {
      if (!activeItem || isLimitReached) return;
      setIsGenerating(true);
      setGeneratedScript(null);
      onIncrementUsage();

      setTimeout(async () => {
          const script = await generateNegotiationScript(activeItem.name, activeItem.amount, negotiationType, userPlan);
          setGeneratedScript(script);
          setIsGenerating(false);
      }, 800);
  };

  const handleCopy = () => {
      if (generatedScript) {
          navigator.clipboard.writeText(generatedScript);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Handshake className="w-8 h-8 text-white" />
          </div>
          <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bill Negotiator</h2>
              <p className="text-slate-400 font-medium">Select a recurring bill to generate an optimization script.</p>
          </div>
          <div className="ml-auto px-4 py-2 bg-slate-900 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
              {isElite ? 'Unlimited Access' : `${remainingCredits} Credits Left`}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-14rem)] min-h-[500px]">
            {/* LEFT: CALENDAR VIEW */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                  <div className="flex bg-slate-800 p-1 rounded-xl">
                      <button 
                          onClick={() => setViewMode('timeline')} 
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          Timeline
                      </button>
                      <button 
                          onClick={() => setViewMode('list')} 
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                          All Subscriptions
                      </button>
                  </div>
                  {viewMode === 'timeline' && <div className="text-xs font-bold text-slate-500">May 2026</div>}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  {subscriptions.length === 0 ? (
                      <div className="text-center py-10 opacity-50">
                          <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                          <p className="text-sm text-slate-400 font-bold">Nothing detected yet.</p>
                      </div>
                  ) : viewMode === 'timeline' ? (
                      <div className="grid grid-cols-7 gap-1">
                          {['S','M','T','W','T','F','S'].map((d, index) => (
                              <div key={`${d}-${index}`} className="text-[10px] font-black text-slate-600 text-center py-2">{d}</div>
                          ))}
                          {Array.from({ length: 31 }).map((_, i) => {
                              const day = i + 1;
                              const dailyItems = subscriptions.filter(s => new Date(s.lastDate).getDate() === day);
                              return (
                                  <div key={i} className="min-h-[100px] bg-slate-900/40 rounded-xl border border-white/5 p-1 relative flex flex-col overflow-hidden">
                                      <div className="text-[10px] font-bold text-slate-500 mb-1 px-1">{day}</div>
                                      <div className="flex flex-col gap-1 z-10 overflow-y-auto no-scrollbar flex-1">
                                          {dailyItems.map(item => (
                                              <div 
                                                key={item.id}
                                                onClick={() => { setSelectedId(item.id); setGeneratedScript(null); }}
                                                className={`text-[9px] p-1.5 rounded font-bold flex flex-col md:flex-row md:justify-between items-start md:items-center cursor-pointer transition-all gap-1 ${selectedId === item.id ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'}`}
                                                title={`${item.name} - $${item.amount.toFixed(2)}`}
                                              >
                                                  <span className="truncate w-full md:w-auto md:max-w-[60%]">{item.name}</span>
                                                  <span className="shrink-0 opacity-80 md:ml-auto">${item.amount.toFixed(0)}</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {subscriptions.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => { setSelectedId(item.id); setGeneratedScript(null); }}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border group ${selectedId === item.id ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800'}`}
                              >
                                  <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white ${selectedId === item.id ? 'bg-indigo-500 shadow-lg' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                                              {item.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                              <h4 className={`font-bold text-base ${selectedId === item.id ? 'text-white' : 'text-slate-300'}`}>{item.name}</h4>
                                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                                  <Calendar className="w-3 h-3" />
                                                  {new Date(item.lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                  <span className="opacity-50">•</span>
                                                  {item.status === 'Danger' ? <span className="text-rose-400">High Cost</span> : 'Recurring'}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className={`text-lg font-black ${selectedId === item.id ? 'text-indigo-300' : 'text-white'}`}>${item.amount.toFixed(0)}</div>
                                          <ChevronRight className={`w-4 h-4 ml-auto mt-1 transition-transform ${selectedId === item.id ? 'text-indigo-500 rotate-90' : 'text-slate-600'}`} />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* RIGHT: WORKBENCH */}
          <div className="lg:col-span-5 bg-slate-950 border border-white/10 rounded-[2.5rem] flex flex-col relative overflow-hidden shadow-2xl">
              {activeItem ? (
                  <div className="flex-1 flex flex-col">
                      <div className="p-5 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-950 flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-black text-white">{activeItem.name}</h2>
                              <p className="text-slate-400 text-sm mt-1">Current Cost: <span className="text-white font-bold">${activeItem.amount}/mo</span></p>
                          </div>
                          <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10">
                              {['discount', 'downgrade', 'cancel'].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => { setNegotiationType(type as any); setGeneratedScript(null); }}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${negotiationType === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex-1 p-5 bg-slate-900/20 overflow-y-auto custom-scrollbar relative">
                          {!generatedScript ? (
                              <div className="space-y-6 text-left w-full h-full">
                                  {isGenerating ? (
                                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                                          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                                          <p className="text-sm font-bold text-white animate-pulse">Analyzing Bill Details...</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-6">
                                          {/* Banner Card */}
                                          <div className="p-6 bg-slate-950 rounded-[2rem] border border-white/5 space-y-4 text-center">
                                              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-white/5 shadow-xl">
                                                  <Zap className="w-7 h-7 text-indigo-500 animate-pulse" />
                                              </div>
                                              <div>
                                                  <h3 className="text-lg font-bold text-white mb-1">Ready to Optimize</h3>
                                                  <p className="text-slate-500 text-xs">Generate custom scripts and strategies specifically for {activeItem.name}.</p>
                                              </div>
                                              
                                              {isLimitReached ? (
                                                  <div 
                                                    onClick={onUpgradeClick}
                                                    className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 hover:from-indigo-500/20 hover:to-purple-600/20 border border-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all rounded-2xl text-center shadow-xl space-y-3 group"
                                                  >
                                                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto border border-indigo-500/20 text-indigo-400 group-hover:rotate-12 transition-transform duration-300">
                                                          <Lock className="w-5 h-5" />
                                                      </div>
                                                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Credits Depleted</h4>
                                                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Upgrade to unlock dynamic negotiation optimization scripts.</p>
                                                  </div>
                                              ) : (
                                                  <button 
                                                    onClick={handleGenerate}
                                                    className="w-full py-3.5 bg-white text-indigo-950 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:scale-[1.02] max-w-sm mx-auto active:scale-95 transition-all flex items-center justify-center gap-2"
                                                  >
                                                      Generate Gemini-Powered Script
                                                  </button>
                                              )}
                                          </div>

                                          {/* Mockup Example Container */}
                                          <div className="border-t border-white/5 pt-6 space-y-5">
                                              <div className="flex items-center gap-2 px-1">
                                                  <FileText className="w-4 h-4 text-indigo-400" />
                                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">EXPECTED OUTPUT MODEL ({negotiationType.toUpperCase()})</span>
                                              </div>

                                              {/* Mock Copypaste Script Content */}
                                              <div className="space-y-4">
                                                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block ml-1">📋 Expected Script Pattern</span>
                                                  <div className="bg-[#0f172a] border border-slate-800/60 p-4 rounded-lg relative">
                                                      <p className="text-slate-300 text-sm leading-relaxed italic select-none pr-12 font-sans font-normal">
                                                          {negotiationType === 'discount' && (
                                                              `Hi there, I’ve been reviewing my monthly expenses and noticed my ${activeItem.name} subscription is currently costing me $${activeItem.amount} per month. I’ve been a loyal customer for over a year and really appreciate the service. However, my current budget is extremely tight, and competitor services are offering similar coverage for roughly 20% less. I would prefer to remain a customer rather than cancel. Are there any retention discounts, loyalty promotions, or active account credits we could apply to lower my monthly rate? Thank you.`
                                                          )}
                                                          {negotiationType === 'downgrade' && (
                                                              `Hello, I am writing to request a downgrade of my ${activeItem.name} account to a more cost-effective tier. My current plan bills at $${activeItem.amount} per month, but I find that I no longer utilize all the premium features frequently enough to justify this level of spend. I want to keep using your service but on a more fundamental, lower-priced plan. Please let me know what basic tiers are available for my account and help me transition to a more affordable rate immediately. Thank you.`
                                                          )}
                                                          {negotiationType === 'cancel' && (
                                                              `Please initiate the immediate cancellation of my ${activeItem.name} subscription. My account is currently billing at $${activeItem.amount} per month. I have decided to migrate my usage to alternate services that align better with my current budgetary restrictions. I require written confirmation that my service will terminate at the end of the current billing cycle, that no auto-renewals will occur, and that no additional fees will be charged. Thank you for your assistance.`
                                                          )}
                                                      </p>
                                                      <div className="absolute top-4 right-4 flex gap-2">
                                                          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded text-indigo-400 font-black">MOCK</span>
                                                          <div className="p-1.5 bg-transparent text-slate-600 rounded-md">
                                                              <Copy className="w-[14px] h-[14px]" />
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>

                                              <hr className="border-t border-slate-800/60 my-6" />

                                              {/* Mock Strategic Feasibility Analysis */}
                                              <div className="space-y-3.5">
                                                  <span className="text-[9px] font-black uppercase text-pink-400 tracking-wider block ml-1">🧠 Expected Strategic Analysis</span>
                                                  <div className="flex flex-col gap-4 text-xs bg-indigo-950/20 rounded-2xl border border-indigo-500/10 p-6 shadow-sm">
                                                      {negotiationType === 'discount' && (
                                                          <>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Success Rate</span>
                                                                  <span className="text-slate-300">High (85%) - Most subscription providers like {activeItem.name} have instant retention credits ($5 - $15/mo) available immediately to loyalty representatives.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Risk Factor</span>
                                                                  <span className="text-slate-300">Very Low - Politeness combined with mention of cost-cutting and long tenure maximizes representative flexibility.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Counter Objection Plan</span>
                                                                  <span className="text-slate-300">If the representative states no promotions are available, ask: "Could you please search if there are any loyalty waivers, or transfer me to a supervisor in the cancellation team to review my options before I turn off auto-renew?"</span>
                                                              </div>
                                                          </>
                                                      )}
                                                      {negotiationType === 'downgrade' && (
                                                          <>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Success Rate</span>
                                                                  <span className="text-slate-300">Exceptional (95%) - Downgrades are standardized options and processed immediately to prevent churn.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Risk Factor</span>
                                                                  <span className="text-slate-300">Zero - Excellent way to maintain service history on a cheaper layout.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Counter Objection Plan</span>
                                                                  <span className="text-slate-300">If they say downgrades only take effect next cycle, confirm and say: "Please register the downgrade transition to take effect on the first day of next cycle, and please email me dynamic confirmation that no premium rate will recur."</span>
                                                              </div>
                                                          </>
                                                      )}
                                                      {negotiationType === 'cancel' && (
                                                          <>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Success Rate</span>
                                                                  <span className="text-slate-300">Medium (75%) - Threatening immediate cancellation will trigger retention system escalation, with a 30-50% discount offer to stay.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Risk Factor</span>
                                                                  <span className="text-slate-300">High - If they don't have active promos, they will process the termination. Ensure you actually want to quit if negotiation fails.</span>
                                                              </div>
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Counter Objection Plan</span>
                                                                  <span className="text-slate-300">If they claim you have an active contract fee, say: "Please review my tenure and waive any contract fees as a loyalty gesture, or transfer me to retention exceptions desk."</span>
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <div className="space-y-6 animate-slide-up text-left">
                                  {/* Copy-Paste Script Card */}
                                  <div className="space-y-2">
                                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">📋 COPY-PASTE SCRIPT</span>
                                      <div className="bg-[#0f172a] border border-slate-800/60 p-4 rounded-lg relative group/script">
                                          <button 
                                            onClick={() => {
                                                if (parsedSections?.scriptText) {
                                                    navigator.clipboard.writeText(parsedSections.scriptText);
                                                    setIsCopied(true);
                                                    setTimeout(() => setIsCopied(false), 2000);
                                                }
                                            }}
                                            className="absolute top-4 right-4 p-1.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
                                            title="Copy to Clipboard"
                                          >
                                              {isCopied ? <Check className="w-[14px] h-[14px] text-emerald-400" /> : <Copy className="w-[14px] h-[14px]" />}
                                          </button>
                                          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap italic select-all pr-10">
                                              {parsedSections?.scriptText}
                                          </p>
                                      </div>
                                  </div>

                                  <hr className="border-t border-slate-800/60 my-6" />

                                  {/* Strategic Feasibility Analysis Card */}
                                  {parsedSections?.analysisData && (parsedSections.analysisData.successRate || parsedSections.analysisData.riskFactor || parsedSections.analysisData.counterObjection) ? (
                                      <div className="space-y-3.5">
                                          <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider block">🧠 STRATEGIC COUNTER-PLAN (Gemini Feasibility Review)</span>
                                          <div className="flex flex-col gap-4 text-xs bg-indigo-950/20 rounded-2xl border border-indigo-500/10 p-6 shadow-sm">
                                              {parsedSections.analysisData.successRate && (
                                                  <div className="flex flex-col gap-1">
                                                      <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Success Rate</span>
                                                      <span className="text-slate-300">{parsedSections.analysisData.successRate}</span>
                                                  </div>
                                              )}
                                              {parsedSections.analysisData.riskFactor && (
                                                  <div className="flex flex-col gap-1">
                                                      <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Risk Factor</span>
                                                      <span className="text-slate-300">{parsedSections.analysisData.riskFactor}</span>
                                                  </div>
                                              )}
                                              {parsedSections.analysisData.counterObjection && (
                                                  <div className="flex flex-col gap-1">
                                                      <span className="font-extrabold text-pink-400 uppercase tracking-wider text-[9px]">Counter Objection Plan</span>
                                                      <span className="text-slate-300">{parsedSections.analysisData.counterObjection}</span>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  ) : parsedSections?.analysisText ? (
                                      <div className="space-y-2">
                                          <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider block">🧠 STRATEGIC COUNTER-PLAN (Gemini Feasibility Review)</span>
                                          <div className="p-6 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 shadow-sm text-xs space-y-4">
                                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                  {parsedSections.analysisText}
                                              </p>
                                          </div>
                                      </div>
                                  ) : null}

                                  <div className="flex gap-4">
                                      <button 
                                        onClick={() => {
                                            if (parsedSections?.scriptText) {
                                                navigator.clipboard.writeText(parsedSections.scriptText);
                                                setIsCopied(true);
                                                setTimeout(() => setIsCopied(false), 2000);
                                            }
                                        }}
                                        className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'}`}
                                      >
                                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                          {isCopied ? 'Copied' : 'Copy Negotiation Script'}
                                      </button>
                                      {!isLimitReached && (
                                          <button onClick={handleGenerate} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/5 transition-all">
                                              Regenerate
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                      <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6">
                          <Calculator className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Workbench Idle</h3>
                      <p className="text-slate-500 text-sm font-medium">Select a subscription from the inbox.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default BillNegotiator;
