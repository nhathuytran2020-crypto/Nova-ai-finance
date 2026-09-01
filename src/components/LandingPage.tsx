
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Shield, Zap, TrendingUp, Handshake, Wallet, CreditCard, ArrowRight, Activity, Check, Users, Cpu, ShieldCheck, Gauge, Star, StarHalf, Volume2, Search, Palette, Layers, Radio, Globe, Heart, ShieldAlert, BarChart3, Database, Lock } from 'lucide-react';
import { FoxLogo } from './FoxLogo';
import AuthPage from './AuthPage';

interface LandingPageProps {
  onLoginSuccess: (name: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [activeSwitcherTab, setActiveSwitcherTab] = useState('budget_matrix');
  const [miniBudgetHousing, setMiniBudgetHousing] = useState(1200);
  const [miniBudgetGroceries, setMiniBudgetGroceries] = useState(450);
  const [miniBudgetChill, setMiniBudgetChill] = useState(150);
  const [miniSandboxSavings, setMiniSandboxSavings] = useState(800);
  const [miniSandboxReturn, setMiniSandboxReturn] = useState(8);
  const [selectedBill, setSelectedBill] = useState<'Netflix' | 'Comcast' | 'AT&T'>('Netflix');
  const [negotiatingState, setNegotiatingState] = useState<'idle' | 'running' | 'done'>('idle');
  const [negotiatorLogs, setNegotiatorLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const startNegotiation = (bill: 'Netflix' | 'Comcast' | 'AT&T') => {
    if (negotiatingState === 'running') return;
    setNegotiatingState('running');
    setNegotiatorLogs([]);
    
    const bills = {
      Netflix: { original: 15.49, target: 9.99, provider: 'Netflix Retention AI' },
      Comcast: { original: 89.99, target: 54.99, provider: 'Comcast Billing Desk' },
      'AT&T': { original: 75.00, target: 50.00, provider: 'AT&T Support API' }
    };
    const info = bills[bill];
    
    const steps = [
      `[09:30:15] Connecting to secure retention API...`,
      `[09:30:16] Retrieving user contract for ${bill}...`,
      `[09:30:18] Cross-referencing competitor offers in regional market...`,
      `[09:30:20] Initiating negotiation sequence with ${info.provider}...`,
      `[09:30:22] Presenting competitor plan & billing metrics...`,
      `[09:30:23] Counter-offer analyzed: -$5.00/mo. Counter-proposing contract renewal...`,
      `[09:30:25] SUCCESS! Loyalty discount active. New price: $${info.target.toFixed(2)}/mo.`,
      `[09:30:26] SAVINGS SECURED: Saved $${(info.original - info.target).toFixed(2)}/mo permanently! 🎉`
    ];

    let i = 0;
    const interval = setInterval(() => {
      setNegotiatorLogs(prev => [...prev, steps[i]]);
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        setNegotiatingState('done');
      }
    }, 800);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerRef.current.style.setProperty('--mouse-x', `${x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };



  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      <style>{`
        @keyframes fade-in-slow {
            from { opacity: 0; filter: blur(10px); }
            to { opacity: 1; filter: blur(0px); }
        }
        @keyframes float-gentle {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        @keyframes float-slower {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-14px) rotate(-0.5deg); }
        }
        @keyframes pulse-soft {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
        }
        .liminal-noise {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 50;
            opacity: 0.03;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .liminal-bg {
            background: radial-gradient(circle at 50% 120%, rgba(20, 25, 40, 1) 0%, rgba(2, 6, 23, 1) 100%);
        }
        .liminal-text-reveal { 
            animation: fade-in-slow 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .interactive-glow-orb {
            background: radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.12), transparent 45%);
        }
      `}</style>

      {/* Liminal Noise Overlay */}
      <div className="liminal-noise"></div>

      {/* Infinite Horizon Background */}
      <div className="fixed inset-0 z-0 pointer-events-none liminal-bg transition-opacity duration-1000">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-50"></div>
          {/* Subtle responsive ambient glowing grid pattern */}
          <div className="absolute inset-0 interactive-glow-orb"></div>
          <div className="absolute bottom-[20%] left-0 right-0 h-[120px] bg-gradient-to-t from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl mix-blend-screen opacity-60"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 py-6 animate-fade-in mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
            <div className="cursor-default select-none">
                <span className="text-xl font-medium text-white tracking-[0.25em] uppercase">Nova</span>
            </div>
            <div className="flex items-center gap-10">
                <div className="hidden md:flex items-center gap-10 text-xs font-medium text-white/50 tracking-[0.1em] uppercase">
                    <button onClick={() => scrollToSection('ecosystem')} className="hover:text-white transition-opacity duration-500">Architecture</button>
                    <button onClick={() => scrollToSection('protocol')} className="hover:text-white transition-opacity duration-500">Principles</button>
                </div>
                <button 
                    onClick={() => setShowAuth(true)}
                    className="text-white/80 hover:text-white text-xs font-medium tracking-[0.1em] uppercase border-b border-white/20 hover:border-white transition-all pb-1"
                >
                    Enter
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-32 pb-20">
          {/* Background Interactive Constellation System Behind */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {/* Lazy loaded concentric system behind */}
              <div 
                className="relative w-[320px] sm:w-[580px] h-[320px] sm:h-[580px] rounded-full border border-white/5 flex items-center justify-center transition-all duration-1000 ease-out"
                style={{
                  transform: `scale(${1 + scrollY * 0.001}) rotate(${scrollY * 0.05}deg)`,
                  opacity: Math.max(0.1, 1 - scrollY * 0.0018),
                }}
              >
                  {/* Outer Pulsing Ring */}
                  <div className="absolute inset-4 rounded-full border border-dashed border-indigo-500/10 animate-[spin_80s_scroll_infinite]"></div>
                  
                  {/* Inner Orbiting particles representing finance streams */}
                  <div className="absolute inset-16 rounded-full border border-indigo-500/15 flex items-center justify-center animate-[spin_40s_linear_infinite]">
                      <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-indigo-500/30 shadow-[0_0_12px_#6366f1]"></div>
                      <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-pink-500/20 shadow-[0_0_10px_#ec4899]"></div>
                  </div>

                  <div className="absolute inset-32 rounded-full border border-white/5 flex items-center justify-center animate-[spin_24s_linear_infinite_reverse]">
                      <div className="absolute -left-1 w-2 h-2 rounded-full bg-teal-400/30 shadow-[0_0_8px_#2dd4bf]"></div>
                  </div>

                  {/* Central Glowing Core */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500/10 to-transparent blur-2xl"></div>
              </div>
          </div>

          <div 
            className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${scrollY * -0.4}px)`,
              opacity: Math.max(0, 1 - scrollY * 0.0025)
            }}
          >
              
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-light text-white/95 tracking-tight leading-[1.05] mb-8 select-none">
                  <span className="block liminal-text-reveal opacity-0" style={{ animationDelay: '0.2s' }}>The Quiet Space</span>
                  <span className="block liminal-text-reveal opacity-0 italic text-white/50 tracking-wide mt-2" style={{ animationDelay: '0.7s' }}>
                      for your money.
                  </span>
              </h1>
              
              <div 
                className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full sm:w-auto mb-16 liminal-text-reveal opacity-0 transition-opacity duration-300 ease-out" 
                style={{ 
                    animationDelay: '1.2s',
                    opacity: Math.max(0, 1 - scrollY * 0.0035) 
                }}
              >
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-4 border border-white/10 backdrop-blur-md rounded-full shadow-lg shadow-black/40 hover:border-white/20"
                  >
                      Get Started
                      <ArrowRight className="w-4 h-4 text-white/70" />
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('ecosystem')}
                    className="px-8 py-4 bg-transparent hover:bg-white/[0.02] text-white/60 hover:text-white font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 border border-transparent rounded-full"
                  >
                      Explore Features
                  </button>
              </div>

              {/* 3 distinct elements visually separated in a horizontal 3-column layout */}
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 w-full liminal-text-reveal opacity-0 transition-opacity duration-300 ease-out flex-col items-center justify-center text-center" 
                style={{ 
                    animationDelay: '1.8s',
                    opacity: Math.max(0, 1 - scrollY * 0.004)
                }}
              >
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-sans font-bold text-indigo-400 uppercase tracking-widest mb-2 block">12-Month Plan</span>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                          See how your money grows over the next year.
                      </p>
                  </div>
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-sans font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Secure & Private</span>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                          All your financial details stay safe and under your control.
                      </p>
                  </div>
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-sans font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Simple & Easy</span>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                          No complicated dashboards or noisy ads.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* 1. The Clarity Block (Right under your main intro) */}
      <section id="ecosystem" className="py-24 px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight">Your home base for money clarity.</h2>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-light max-w-2xl mx-auto mb-16">
                  Simplify your capital flow by bringing your accounts, transactions, and future projections into one clean, responsive space. Always stay on top of your financial baseline.
              </p>

              {/* HIGH FIDELITY LIVE DASHBOARD PREVIEW STYLE */}
              <div className="w-full bg-[#050811] border border-white/10 rounded-[2rem] p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans relative group animate-fade-in">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                  
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 mb-6">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block mb-1">WORKSPACE PREVIEW</span>
                      <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">GOOD SATURDAY, BRONNY</h3>
                    </div>
                    <button className="bg-slate-900 border border-slate-700/50 text-[10px] uppercase font-extrabold text-white tracking-widest px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      MAKE NEW TRANSACTION
                    </button>
                  </div>

                  {/* Grid Layout of Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left & Middle Column (Core Metrics) */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Net Worth */}
                        <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-5 hover:bg-[#101625] transition-all duration-300">
                          <div className="flex justify-between items-start text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            <span>NET WORTH</span>
                            <Wallet className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="text-2xl font-black text-white">$2,109.00</div>
                          <div className="text-[10px] font-black text-emerald-400 mt-2 flex items-center gap-1">
                            <span>(+0.0%)</span> Since last week
                          </div>
                        </div>

                        {/* Spend */}
                        <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-5 hover:bg-[#101625] transition-all duration-300">
                          <div className="flex justify-between items-start text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            <span>SPEND</span>
                            <CreditCard className="w-4 h-4 text-purple-500" />
                          </div>
                          <div className="text-2xl font-black text-white">$223.00</div>
                          <div className="text-[10px] font-black text-red-400 mt-2 flex items-center gap-1">
                            <span>(-0%)</span> Inside monthly budget
                          </div>
                        </div>
                      </div>

                      {/* In My Pocket Card (Live Simulation with mini slider) */}
                      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">IN MY POCKET</span>
                            <div className="text-3xl font-black text-white">$1,227.00</div>
                            <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-[0.15em]">SAFE TO SPEND TODAY</span>
                          </div>
                          <div className="flex gap-4 text-left">
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase block">INCOME</span>
                              <span className="text-xs font-bold text-emerald-400">+$4,500.00</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase block">BILLS</span>
                              <span className="text-xs font-bold text-rose-400">-$2,100.00</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase block">GOALS</span>
                              <span className="text-xs font-bold text-amber-400">-$950.00</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>Interactive Pocket Baseline Simulator</span>
                            <span className="font-bold text-white">$4,500.00</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full relative">
                            <div className="absolute left-[56.25%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-[#0b0f19] shadow-lg"></div>
                            <div className="w-[56.25%] h-full bg-cyan-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Spending Categories (Donut Chart representation) */}
                      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-5">SPENDING CATEGORIES</span>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            {/* SVG Donut */}
                            <div className="relative w-20 h-20 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="4" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="100 0" />
                              </svg>
                              <div className="absolute text-center">
                                <span className="text-[8px] font-black text-slate-500 uppercase block">FOOD</span>
                                <span className="text-[11px] font-black text-white">100%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-wider block mb-1">TOP EXPENSE</span>
                              <h4 className="text-base font-bold text-white">Food & Dining</h4>
                              <p className="text-xs text-slate-400 mt-1">$223.00 (100.0% of spend)</p>
                            </div>
                          </div>
                          <button className="px-5 py-2.5 bg-slate-900 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition-colors">
                            View in Detail
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Overview, Goal, Health) */}
                    <div className="space-y-6">
                      {/* Monthly Budget Overview */}
                      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">MONTHLY BUDGET OVERVIEW</span>
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">BUDGET</span>
                            <span className="font-bold text-white">$0.00</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">ACTUAL</span>
                            <span className="font-bold text-white">$223.00</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                            <span className="text-slate-400">REMAINING</span>
                            <span className="font-extrabold text-rose-400">-$223.00</span>
                          </div>
                        </div>
                        {/* Red budget overspend indicator bar */}
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-rose-500"></div>
                        </div>
                      </div>

                      {/* Goal Tracker */}
                      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">GOAL TRACKER</span>
                            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider block">ACTIVE PROGRESS</span>
                          </div>
                          <button className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">+ ADD GOAL</button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>EXPENDITURE LIMITS (22%)</span>
                              <span className="font-bold text-white">$223.00 / $1,000.00</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                              <div className="w-[22%] h-full bg-indigo-500"></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>SAVINGS TARGETS (0%)</span>
                              <span className="font-bold text-white">$0.00 / $0.00</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                              <div className="w-0 h-full bg-indigo-500"></div>
                            </div>
                          </div>
                        </div>

                        <button className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all">
                          SIMULATE GROWTH
                        </button>
                      </div>

                      {/* Financial Health */}
                      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">FINANCIAL HEALTH</span>
                        <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider block mb-4">OVERALL SCORE: 36/100</span>
                        
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-3xl font-black text-white">36<span className="text-sm text-slate-500 font-bold"> / 100</span></div>
                            <div className="w-8 h-1 bg-rose-500 mt-2"></div>
                          </div>
                          {/* Radial rating indicator */}
                          <div className="w-14 h-14 opacity-80">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500/60">
                              <polygon points="50,10 90,40 75,90 25,90 10,40" fill="none" stroke="currentColor" strokeWidth="2" />
                              <polygon points="50,45 65,55 58,70 40,65 30,50" fill="rgba(99, 102, 241, 0.4)" stroke="#6366f1" strokeWidth="2" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 2. The Simple Switcher (Interactive Smart Money Preview) */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-5xl mx-auto">
               <div className="text-center mb-12">
                   <span className="text-[10px] font-sans font-semibold text-indigo-400 uppercase tracking-[0.25em] mb-3 block">APP INTERIOR PREVIEWS</span>
                   <h2 className="text-2xl md:text-4xl font-light text-white tracking-tight">The Simple Switcher</h2>
                   <p className="text-slate-400 text-sm font-light mt-2 max-w-lg mx-auto">
                       Click through the 6 views below to preview exactly how nova.os acts and looks inside your dashboard.
                   </p>
               </div>

               {/* 6 Tabs as shown in second image.png */}
               <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto">
                   {[
                       { id: 'budget_matrix', label: 'Dynamic Budget', color: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/5', activeColor: 'bg-cyan-600 text-white shadow-cyan-500/20 border-cyan-500' },
                       { id: 'burn_vector', label: 'Cash Flow', color: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/5', activeColor: 'bg-rose-600 text-white shadow-rose-500/20 border-rose-500' },
                       { id: 'detailed_charts', label: 'Bar & Pie chart', color: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/5', activeColor: 'bg-purple-600 text-white shadow-purple-500/20 border-purple-500' },
                       { id: 'sankey', label: 'Money Flows', color: 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/5', activeColor: 'bg-indigo-600 text-white shadow-indigo-600/20 border-indigo-500' },
                       { id: 'sandbox', label: 'Predictive Sandbox', color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/5', activeColor: 'bg-amber-600 text-white shadow-amber-500/25 border-amber-500' },
                       { id: 'negotiator', label: 'Bill Negotiator', color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5', activeColor: 'bg-emerald-600 text-white shadow-emerald-500/20 border-emerald-500' }
                   ].map(tab => (
                       <button
                           key={tab.id}
                           onClick={() => setActiveSwitcherTab(tab.id)}
                           className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                               activeSwitcherTab === tab.id
                                   ? tab.activeColor + ' shadow-lg border-2'
                                   : 'bg-white/[0.02] ' + tab.color
                           }`}
                       >
                           {tab.label}
                       </button>
                   ))}
               </div>

               {/* Active Content Block representing each smart money feature */}
               <div className="bg-[#080d16] border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden min-h-[380px] flex flex-col justify-center transition-all duration-500">
                   
                   {/* DYNAMIC BUDGET PREVIEW */}
                   {activeSwitcherTab === 'budget_matrix' && (
                       <div className="animate-fade-in space-y-6">
                           <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <div>
                                   <h4 className="text-lg font-light text-white">Simple Monthly Budget</h4>
                                   <p className="text-slate-400 text-xs mt-1">A clear way to set spending goals for rent, groceries, and fun.</p>
                               </div>
                               <div className="text-right">
                                   <div className="text-xs text-slate-500 uppercase">Total Spend</div>
                                   <div className="text-base font-black text-cyan-400">$1,800.00</div>
                               </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                   <div className="flex justify-between text-xs font-bold text-slate-400">
                                       <span>Housing</span>
                                       <span>$1,200</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono block mt-1">Status: Under budget</span>
                                    <div className="hidden">
                                   </div>
                                   <input 
                                       type="range" min="800" max="2500" step="50"
                                       value={miniBudgetHousing} onChange={(e) => setMiniBudgetHousing(Number(e.target.value))} style={{ display: 'none' }}
                                       className="w-full accent-cyan-500 bg-slate-950 h-1 rounded cursor-pointer"
                                   />
                               </div>
                               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                   <div className="flex justify-between text-xs font-bold text-slate-400">
                                       <span>Groceries</span>
                                       <span>$450</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono block mt-1">Status: Safe to spend</span>
                                    <div className="hidden">
                                   </div>
                                   <input 
                                       type="range" min="200" max="1000" step="50"
                                       value={miniBudgetGroceries} onChange={(e) => setMiniBudgetGroceries(Number(e.target.value))} style={{ display: 'none' }}
                                       className="w-full accent-cyan-500 bg-slate-950 h-1 rounded cursor-pointer"
                                   />
                               </div>
                               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                   <div className="flex justify-between text-xs font-bold text-slate-400">
                                       <span>Leisure</span>
                                       <span>$150</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono block mt-1">Status: Safe zone</span>
                                    <div className="hidden">
                                   </div>
                                   <input 
                                       type="range" min="50" max="600" step="25"
                                       value={miniBudgetChill} onChange={(e) => setMiniBudgetChill(Number(e.target.value))} style={{ display: 'none' }}
                                       className="w-full accent-cyan-500 bg-slate-950 h-1 rounded cursor-pointer"
                                   />
                               </div>
                           </div>
                           <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs p-4 rounded-xl flex items-center gap-2">
                               <Sparkles className="w-4 h-4 shrink-0" />
                               <span>This tool turns red to warn you if your spending goes over 80% of your regular salary.</span>
                           </div>
                       </div>
                   )}

                   {/* CASH FLOW TAB */}
                   {activeSwitcherTab === 'burn_vector' && (
                       <div className="animate-fade-in space-y-6">
                           <div>
                               <h4 className="text-lg font-light text-white">Income and Expenses</h4>
                               <p className="text-slate-400 text-xs mt-1">Keep track of your monthly pay and regular costs.</p>
                           </div>
                           <div className="space-y-3 max-w-2xl">
                               {[
                                   { title: 'Job Salary', details: 'Monthly pay direct deposit', amount: '+$4,500.00', type: 'in', date: 'June 10' },
                                   { title: 'Rent or house payment', details: 'Regular living cost', amount: '-$2,100.00', type: 'out', date: 'June 12' },
                                   { title: 'Phone and Internet Bill', details: 'Monthly utility bill', amount: '-$89.99', type: 'out', date: 'June 15' },
                                   { title: 'Emergency Savings', details: 'Savings put away for emergency costs', amount: '-$950.00', type: 'out', date: 'June 20' }
                               ].map((flow, i) => (
                                   <div key={i} className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-3 rounded-lg hover:bg-slate-850 transition-colors">
                                       <div className="flex items-center gap-3">
                                           <div className={`w-2 h-2 rounded-full ${flow.type === 'in' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                           <div>
                                               <div className="text-xs font-bold text-white">{flow.title}</div>
                                               <div className="text-[10px] text-slate-500">{flow.details}</div>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <div className={`text-xs font-bold ${flow.type === 'in' ? 'text-emerald-400' : 'text-slate-300'}`}>{flow.amount}</div>
                                           <div className="text-[9px] text-slate-500">{flow.date}</div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* BAR & PIE CHART TAB */}
                   {activeSwitcherTab === 'detailed_charts' && (
                       <div className="animate-fade-in space-y-6">
                           <div>
                               <h4 className="text-lg font-light text-white">Expense Breakdown</h4>
                               <p className="text-slate-400 text-xs mt-1">See your expenses compared using simple progress bars.</p>
                           </div>
                           <div className="flex flex-col md:flex-row items-center gap-8">
                               <div className="w-full md:w-1/2 space-y-3">
                                   {[
                                       { label: 'Living Costs', value: '72%', color: 'bg-indigo-500' },
                                       { label: 'Savings', value: '20%', color: 'bg-purple-500' },
                                       { label: 'Fun Spending', value: '8%', color: 'bg-pink-500' }
                                   ].map((bar, i) => (
                                       <div key={i} className="space-y-1.5">
                                           <div className="flex justify-between text-xs text-slate-400">
                                               <span>{bar.label}</span>
                                               <span className="font-bold text-white">{bar.value}</span>
                                           </div>
                                           <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                               <div className={`h-full ${bar.color}`} style={{ width: bar.value }}></div>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                               <div className="flex-1 bg-slate-900/50 border border-white/5 p-4 rounded-xl text-center space-y-2">
                                   <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly Review</div>
                                   <p className="text-xs text-slate-400 leading-relaxed font-light">
                                       Your housing and food costs are steady, and you have no credit card debt this month.
                                   </p>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* MONEY FLOWS TAB */}
                   {activeSwitcherTab === 'sankey' && (
                       <div className="animate-fade-in space-y-6">
                           <div>
                               <h4 className="text-lg font-light text-white">Where Your Money Goes</h4>
                               <p className="text-slate-400 text-xs mt-1">Track how your monthly pay is split between bills and savings.</p>
                           </div>
                           
                           {/* Animated flowing pipelines */}
                           <div className="grid grid-cols-3 gap-4 text-center text-[10px] relative font-mono pt-4">
                               <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl flex flex-col justify-center items-center">
                                   <span className="text-white font-bold block mb-1">INCOME</span>
                                   <span className="text-indigo-400 font-bold">$4,500.00</span>
                                   <div className="mt-3 text-[8px] text-slate-500 uppercase">Monthly Pay</div>
                               </div>

                               <div className="flex flex-col justify-center items-center relative py-4">
                                   {/* Glowing flow dots */}
                                   <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                                       <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                                       <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping delay-300"></span>
                                       <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping delay-700"></span>
                                   </div>
                                   <div className="h-0.5 bg-indigo-500/30 w-full mb-3"></div>
                                   <span className="text-[8px] text-indigo-300 uppercase tracking-widest font-sans animate-pulse">Sending...</span>
                               </div>

                               <div className="space-y-2 text-left">
                                   <div className="bg-[#0b0f19] border border-white/5 p-2.5 rounded-lg flex justify-between items-center">
                                       <span className="text-slate-400">Rent Fund</span>
                                       <span className="text-white font-bold">$2,100</span>
                                   </div>
                                   <div className="bg-[#0b0f19] border border-white/5 p-2.5 rounded-lg flex justify-between items-center">
                                       <span className="text-slate-400">Daily Spend</span>
                                       <span className="text-white font-bold">$1,450</span>
                                   </div>
                                   <div className="bg-[#0b0f19] border border-white/5 p-2.5 rounded-lg flex justify-between items-center border-emerald-500/20 bg-emerald-500/5">
                                       <span className="text-emerald-400">Savings Goal</span>
                                       <span className="text-emerald-400 font-bold">$950</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* PREDICTIVE SANDBOX TAB */}
                   {activeSwitcherTab === 'sandbox' && (
                       <div className="animate-fade-in space-y-6">
                           <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <div>
                                   <h4 className="text-lg font-light text-white">Savings Growth Plan</h4>
                                   <p className="text-slate-400 text-xs mt-1">See how your savings can grow over time with interest.</p>
                               </div>
                               <div className="text-right">
                                   <span className="text-xs text-slate-500 uppercase block">Estimated Savings in 10 Years</span>
                                   <span className="text-base font-black text-amber-500">
                                       $184,800.00
                                   </span>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                   <div className="flex justify-between text-xs font-bold text-slate-400">
                                       <span>Monthly Savings</span>
                                       <span>$800 / mo</span>
                                   </div>
                                   <input 
                                       type="range" min="100" max="3000" step="50"
                                       value={miniSandboxSavings} onChange={(e) => setMiniSandboxSavings(Number(e.target.value))} style={{ display: 'none' }}
                                       className="w-full accent-amber-500 bg-slate-950 h-1 rounded cursor-pointer"
                                   />
                               </div>
                               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                   <div className="flex justify-between text-xs font-bold text-slate-400">
                                       <span>Annual Interest Rate</span>
                                       <span>8.5% annual</span>
                                   </div>
                                   <input 
                                       type="range" min="2" max="15" step="1"
                                       value={miniSandboxReturn} onChange={(e) => setMiniSandboxReturn(Number(e.target.value))} style={{ display: 'none' }}
                                       className="w-full accent-amber-500 bg-slate-950 h-1 rounded cursor-pointer"
                                   />
                               </div>
                           </div>

                           <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-4 rounded-xl flex items-center justify-between">
                               <span>Estimated Savings in 5 Years: <span className="font-bold text-white">$62,400.00</span></span>
                               <span className="text-[10px] uppercase font-bold text-amber-400">Growth simulator active</span>
                           </div>
                       </div>
                   )}

                   {/* BILL NEGOTIATOR TAB (The exact Image 2 simulation!) */}
                   {activeSwitcherTab === 'negotiator' && (
                       <div className="animate-fade-in space-y-6">
                           <div className="border-b border-white/5 pb-4">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                       <Handshake className="w-5 h-5 text-emerald-400" />
                                   </div>
                                   <div>
                                       <h4 className="text-md font-bold text-white uppercase tracking-wider">Bill Assistant</h4>
                                       <p className="text-slate-400 text-xs">We automatically track monthly services and help you find deals.</p>
                                   </div>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                               
                               {/* Left Column: Subscriptions list */}
                               <div className="md:col-span-5 bg-slate-900/50 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden bg-emerald-500/[0.02]" style={{ contentVisibility: 'auto' }}><div className="mb-4"><div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">TOTAL MONTHLY SAVINGS SECURED</div><div className="text-3xl font-black text-white">$45.50<span className="text-xs text-slate-500 font-normal"> / month</span></div><p className="text-xs text-slate-400 mt-2">Monthly service savings successfully found for you.</p><div className="mt-4 space-y-3"><div className="flex justify-between items-center text-xs"><span className="text-slate-400">Netflix Premium</span><span className="font-mono text-emerald-400">-$5.50/mo saved</span></div><div className="flex justify-between items-center text-xs"><span className="text-slate-400">Comcast Broadband</span><span className="font-mono text-emerald-400">-$25.00/mo saved</span></div><div className="flex justify-between items-center text-xs"><span className="text-slate-400">AT&T Wireless</span><span className="font-mono text-emerald-400">-$15.00/mo saved</span></div></div></div><div className="hidden">
                                   <div>
                                        <div className="flex gap-2 mb-4 border-b border-white/5 pb-2">
                                            <span className="text-[9px] font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 uppercase rounded">Timeline</span>
                                            <span className="text-[9px] font-bold px-2 py-1 bg-white/5 text-slate-400 uppercase rounded">All Subscriptions</span>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'Netflix', label: 'Netflix Premium', price: '$15.49/mo' },
                                                { id: 'Comcast', label: 'Comcast Broadband', price: '$89.99/mo' },
                                                { id: 'AT&T', label: 'AT&T Mobile Plan', price: '$75.00/mo' }
                                            ].map(bill => (
                                                <div 
                                                    key={bill.id}
                                                    onClick={() => {
                                                        if (negotiatingState !== 'running') {
                                                            setSelectedBill(bill.id as 'Netflix' | 'Comcast' | 'AT&T');
                                                            setNegotiatorLogs([]);
                                                            setNegotiatingState('idle');
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${
                                                        selectedBill === bill.id 
                                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                                                            : 'bg-slate-950/30 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold">{bill.label}</span>
                                                    <span className="text-xs font-mono font-bold">{bill.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                   </div>
                                   <button 
                                       onClick={() => startNegotiation(selectedBill)}
                                       disabled={negotiatingState === 'running'}
                                       className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors mt-4 disabled:opacity-40"
                                   >
                                       {negotiatingState === 'running' ? 'Negotiation Running...' : `Optimize ${selectedBill}`}
                                   </button>
                               </div>

                               </div>{/* Right Column: AI terminal negotiation terminal */}
                               <div className="md:col-span-7 bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">
                                   <div>
                                       <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                                           <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Status Logs</span>
                                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                       </div>
                                       
                                       {false ? (
                                           <div className="text-center py-12 text-slate-600 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                               <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center font-bold">i</div>
                                               <span>Workbench Idle.<br/>Select a subscription from the inbox.</span>
                                           </div>
                                       ) : (
                                           <div className="space-y-1.5 font-mono text-[10px] text-slate-300 max-h-[170px] overflow-y-auto custom-scrollbar leading-relaxed">
                                               {[
                                                    '[09:30:15] Monitoring regional competitor plans...',
                                                    '[09:30:18] Checking Comcast loyalty credits...',
                                                    '[09:30:20] Securing -$15.00 contract discount...',
                                                    '[SUCCESS] All subscription discounts secured! 🎉'
                                                ].map((log, i) => (
                                                   <div key={i} className={log.includes('SUCCESS') || log.includes('SAVINGS') ? 'text-emerald-400 font-bold' : ''}>
                                                       {log}
                                                   </div>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                                   
                                   <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 border-t border-white/5 pt-2 mt-4">
                                       <span>STATUS: ONLINE</span>
                                       <span>UNLIMITED SCANS INCLUDED</span>
                                   </div>
                               </div>

                           </div>
                       </div>
                   )}

               </div>
          </div>
      </section>

      {/* 3. The Feature Walkdown (One by One) */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-950/10">
          <div className="max-w-4xl mx-auto space-y-16">
              <div className="text-center mb-16">
                  <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-[0.22em] mb-3 block">Walkthrough</span>
                  <h2 className="text-2xl md:text-4xl font-light text-white tracking-tight">One by One</h2>
                  <p className="text-slate-400 text-sm font-light mt-2">See exactly how nova.os works on your own terms.</p>
              </div>

              {/* Walkdown Items */}
              <div className="border-l border-white/10 hover:border-indigo-500/50 pl-8 md:pl-12 py-4 transition-colors duration-300 group">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.25em] mb-3 block">FILES</span>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                      <div className="flex-1">
                          <h3 className="text-2xl font-light text-white mb-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                              All your storage, in one place
                          </h3>
                          <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed max-w-2xl">
                              Connect your cloud drives and local files to see everything in one clean list. No more jumping between different apps or websites just to find a photo or pdf.
                          </p>
                      </div>
                      <div className="flex-1 max-w-md w-full relative group/img overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent z-10 pointer-events-none"></div>
                          <img 
                              src="/src/assets/images/human_laptop_files_1780890608306.png" 
                              alt="All your storage in one place" 
                              className="w-full object-cover aspect-[4/3] group-hover/img:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 left-4 z-20">
                              <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest block font-bold">WORKSPACE STORAGE</span>
                              <span className="text-xs font-bold text-white tracking-wide">Consolidated Cloud & Offline Assets</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="border-l border-white/10 hover:border-purple-500/50 pl-8 md:pl-12 py-4 transition-colors duration-300 group">
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-[0.25em] mb-3 block">TASKS</span>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                      <div className="flex-1">
                          <h3 className="text-2xl font-light text-white mb-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                              Every to-do in a single view
                          </h3>
                          <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed max-w-2xl">
                              nova.os brings your calendar, reminders, and daily goals into a clean timeline. You can check off items as you go to stay on top of your day.
                          </p>
                      </div>
                      <div className="flex-1 max-w-md w-full relative group/img overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent z-10 pointer-events-none"></div>
                          <img 
                              src="/src/assets/images/man_phone_todo_1780921183954.png" 
                              alt="Every to-do in a single view" 
                              className="w-full object-cover aspect-[4/3] group-hover/img:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 left-4 z-20">
                              <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest block font-bold font-bold">DAILY AGENDA</span>
                              <span className="text-xs font-bold text-white tracking-wide">Integrated Unified Planner Workflow</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="border-l border-white/10 hover:border-emerald-500/50 pl-8 md:pl-12 py-4 transition-colors duration-300 group">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-[0.25em] mb-3 block">DEVICES</span>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                      <div className="flex-1">
                          <h3 className="text-2xl font-light text-white mb-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                              On every screen, always ready
                          </h3>
                          <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed max-w-2xl">
                              nova.os works smoothly across your laptop, tablet, and phone. Whether you are typing at your desk or checking something on the go, your workspace is always updated and ready.
                          </p>
                      </div>
                      <div className="flex-1 max-w-md w-full relative group/img overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent z-10 pointer-events-none"></div>
                          <img 
                              src="/src/assets/images/synced_devices_hq_1780921199459.png" 
                              alt="On every screen, always ready" 
                              className="w-full object-cover aspect-[4/3] group-hover/img:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 left-4 z-20">
                              <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest block font-bold">SECURE SYNC</span>
                              <span className="text-xs font-bold text-white tracking-wide">Sync Completed Across Devices</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 4. The Review Wall (Social Proof) */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                  <span className="text-[10px] font-sans font-semibold text-indigo-400 uppercase tracking-[0.20em] mb-3 block">USER REVIEWS</span>
                  <h2 className="text-2xl md:text-4xl font-light text-white tracking-tight">The Review Wall</h2>
                  <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 bg-emerald-500/10 rounded-full">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                              <span className="text-emerald-500">★</span> Trustpilot 4.8 Excellent
                          </span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors duration-300 flex flex-col justify-between min-h-[180px]">
                      <div>
                          <div className="flex items-center gap-[2px] mb-3">
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400/60 fill-emerald-400/60" />
                          </div>
                          <p className="text-sm text-slate-300 font-light leading-relaxed italic mb-4">
                              "nova.os is a <strong className="font-semibold text-white">game-changer for how I organize my life</strong>."
                          </p>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Sarah Jenkins</span>
                          <span className="text-emerald-400 font-bold">✓ Verified User</span>
                      </div>
                  </div>

                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors duration-300 flex flex-col justify-between min-h-[180px]">
                      <div>
                          <div className="flex items-center gap-[2px] mb-3">
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                          </div>
                          <p className="text-sm text-slate-300 font-light leading-relaxed italic mb-4">
                              "I feel <strong className="font-semibold text-white">way less overwhelmed now</strong> that everything is in one app."
                          </p>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Marcus Kovac</span>
                          <span className="text-emerald-400 font-bold">✓ Verified User</span>
                      </div>
                  </div>

                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors duration-300 flex flex-col justify-between min-h-[180px]">
                      <div>
                          <div className="flex items-center gap-[2px] mb-3">
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                              <Star className="w-3.5 h-3.5 text-emerald-400/60 fill-emerald-400/60" />
                          </div>
                          <p className="text-sm text-slate-300 font-light leading-relaxed italic mb-4">
                              "Finally, a desktop <strong className="font-semibold text-white">that just makes sense</strong>."
                          </p>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Elena Rostova</span>
                          <span className="text-emerald-400 font-bold">✓ Verified User</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 5. The Risk-Free Bottom Button */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-slate-950/40">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-light text-white mb-4 tracking-tight">Try nova.os free today</h2>
              <p className="text-sm md:text-base text-slate-400 mb-10 leading-relaxed font-light max-w-lg">
                  See and manage your digital life all in one place. No annoying ads, no hidden fees, and no complicated setup required.
              </p>
              <button 
                onClick={() => setShowAuth(true)}
                className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 rounded-full shadow-lg hover:shadow-white/5 hover:scale-[1.02]"
              >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 relative z-10 bg-[#020617]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg"><FoxLogo className="w-5 h-5 text-white" /></div>
                  <span className="text-lg font-bold text-white tracking-tight">Nova Finance</span>
              </div>
              <div className="flex gap-12 text-sm text-slate-500 font-bold uppercase tracking-widest">
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
          </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
             <div className="relative w-full max-w-md">
                 <button 
                    onClick={() => setShowAuth(false)}
                    className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
                 >
                     DISCONNECT <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform hover:rotate-90">✕</div>
                 </button>
                 <AuthPage onLogin={(name) => { setShowAuth(false); onLoginSuccess(name); }} onClose={() => setShowAuth(false)} />
             </div>
          </div>
      )}

    </div>
  );
};

const RoadmapCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, status: string, color: string, delay: string }> = ({ icon, title, desc, status, delay }) => {
    return (
        <div className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 group relative overflow-hidden animate-slide-up" style={{ animationDelay: delay }}>
            <div className="flex justify-between items-start mb-10">
                <div className="text-white/40 group-hover:text-white/80 transition-colors opacity-80">{icon}</div>
                <span className="text-[9px] font-light px-2 py-1 border border-white/10 text-white/50 uppercase tracking-[0.2em]">{status}</span>
            </div>
            <h4 className="text-lg font-light text-white/90 mb-3 tracking-wide">{title}</h4>
            <p className="text-white/40 text-xs leading-relaxed font-light tracking-wide">{desc}</p>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: string, idx: number }> = ({ icon, title, description, idx }) => {
    return (
        <div className="group h-full animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="relative h-full p-8 border border-white/5 backdrop-blur-sm transition-all duration-500 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col justify-between">
                <div>
                     <div className="text-white/40 group-hover:text-white/80 transition-colors mb-12 opacity-80">
                         {icon}
                     </div>
                     <h3 className="text-xl font-light text-white/90 mb-4 tracking-wide">
                         {title}
                     </h3>
                     <p className="text-white/40 leading-relaxed font-light text-xs tracking-wide">
                         {description}
                     </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
