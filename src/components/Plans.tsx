
import React, { useState, useMemo, useEffect } from 'react';
import { UserPlan } from '../types';
import { Check, Star, Zap, Shield, Sparkles, CreditCard, Lock, X, Loader2, Smartphone, BrainCircuit, Target, BarChart3, PartyPopper, AlertTriangle, Crown, Infinity, ShieldCheck, ArrowRight, ShieldX, Fingerprint, PieChart, Activity, Layers, Eye, Gauge, MessageSquare, History, Rocket, Palette, TrendingUp, Globe, FileText, Cpu, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlansProps {
  currentPlan: UserPlan;
  onUpgrade: (plan: UserPlan) => void;
  onDowngrade: () => void;
  onNavigateDashboard?: () => void;
}

const Plans: React.FC<PlansProps> = ({ currentPlan, onUpgrade, onDowngrade, onNavigateDashboard }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const eliteStars = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() < 0.2 ? '3px' : Math.random() < 0.5 ? '2px' : '1px', 
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random() * 0.5 + 0.3
    }));
  }, []);

  const handleUpgradeClick = (plan: UserPlan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
        onUpgrade(selectedPlan);
        setIsCheckoutOpen(false);
        setShowCelebration(true);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: selectedPlan === 'ultra' ? ['#6366f1', '#ec4899', '#8b5cf6'] : ['#f59e0b', '#fbbf24', '#ffffff']
        });
    }
  };

  const isPaid = currentPlan === 'pro' || currentPlan === 'ultra';
  const isElite = currentPlan === 'ultra';

  return (
    <div className="h-auto min-h-0 flex flex-col max-w-7xl mx-auto w-full animate-slide-up pb-20">
      <div className="text-center max-w-2xl mx-auto mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">Subscription Plans</h2>
        <p className="text-slate-400 text-lg font-medium leading-relaxed">
          {isElite ? "Your system is operating at the absolute Elite level." : "Unlock advanced financial insights to accelerate your path to financial freedom."}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isElite ? 'max-w-xl' : isPaid ? 'md:grid-cols-2 max-w-5xl' : 'lg:grid-cols-3 max-w-7xl'} gap-8 mx-auto items-stretch px-4`}>
        
        {/* Starter Tier */}
        {!isPaid && (
            <div className="glass-card p-8 rounded-[3rem] relative flex flex-col border border-white/5 hover:border-white/10 transition-all bg-slate-900/20">
                <div className="mb-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Starter</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">$0</span>
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-2">Lifetime Access</span>
                    </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem text="Unlimited Manual Ledger Entries" />
                    <FeatureItem text="Basic Real-time Net Worth Sync" />
                    <FeatureItem text="3 Receipt Scans per month" />
                    <FeatureItem text="3 AI Coaching Sessions per month" />
                    <FeatureItem text="Basic Goal Architecture" />
                    <FeatureItem text="Secure Local Data Encryption" />
                    <FeatureItem text="Standard PDF Data Export" />
                </div>

                <button disabled className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-white/5 border border-white/5 text-slate-500 cursor-default">
                    Plan Active
                </button>
            </div>
        )}

        {/* Pro Tier */}
        {!isElite && (
            <div className={`glass-card p-8 rounded-[3.5rem] relative flex flex-col border-2 transition-all duration-500 ${currentPlan === 'pro' ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.15)] scale-[1.02]' : 'border-amber-500/20 hover:border-amber-500/40'}`}>
                <div className="absolute top-6 right-8">
                    <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                        <Zap className="w-3 h-3 fill-white" /> Professional
                    </span>
                </div>
                
                <div className="mb-8 relative z-10">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-4">Pro Plan</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">$2.99</span>
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-2">Monthly Subscription</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-5 leading-relaxed font-medium">
                        Expand your financial management with persistent AI guidance and automated tracking tools.
                    </p>
                </div>

                <div className="space-y-4 mb-10 flex-1 relative z-10">
                    <div className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-2 px-1">Professional Features:</div>
                    <FeatureItem text="50 AI Analyses (Advanced)" icon={<BrainCircuit className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="100 Receipt Scans per month" icon={<Smartphone className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="Supportive & Ruthless AI Advice" icon={<MessageSquare className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="Predictive Simulator (Basic)" icon={<History className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="Smart Auto-Categorization" icon={<Layers className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="Custom Dashboard Themes" icon={<Palette className="w-4 h-4 text-amber-500" />} />
                    <FeatureItem text="Transaction Search & Global Filters" icon={<Search className="w-4 h-4 text-amber-500" />} />
                </div>

                <button 
                    onClick={() => handleUpgradeClick('pro')} 
                    disabled={currentPlan === 'pro'} 
                    className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_15px_30px_-10px_rgba(245,158,11,0.5)] active:scale-95 transition-all relative overflow-hidden group/btn disabled:opacity-80 disabled:grayscale"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {currentPlan === 'pro' ? 'System Active' : 'Upgrade to Pro'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer-fast"></div>
                </button>
            </div>
        )}

        {/* Elite Tier */}
        <div className={`relative p-10 rounded-[4rem] flex flex-col overflow-hidden group transition-all duration-700 shadow-[0_0_80px_-10px_rgba(99,102,241,0.4)] border-2 border-indigo-500/50 bg-[#020617] mx-auto w-full ${isElite ? 'scale-[1.03] ring-4 ring-indigo-500/20' : 'hover:scale-[1.02]'}`}>
          <style>{`@keyframes simple-twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }`}</style>
          
          <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_70%)]"></div>
              <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.15),transparent_70%)]"></div>
              {eliteStars.map((star) => (
                  <div key={star.id} className="absolute bg-white rounded-full" style={{top: star.top, left: star.left, width: star.size, height: star.size, opacity: star.opacity, animation: `simple-twinkle ${star.duration}s ease-in-out infinite`, animationDelay: star.delay }}></div>
              ))}
          </div>

          <div className="absolute top-8 right-10 z-20">
            <div className="bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center gap-2 border border-indigo-400/50">
                <Crown className="w-3.5 h-3.5 fill-white" /> ELITE LEVEL
            </div>
          </div>

          <div className="mb-10 relative z-10 mt-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Elite Plan</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">$9.99</span>
              <span className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em] ml-3">Monthly</span>
            </div>
            <p className="text-indigo-100/70 text-sm mt-6 leading-relaxed font-medium max-w-sm">
              The definitive command center for high earners requiring advanced AI features and deep investment projections.
            </p>
          </div>

          <div className="space-y-4 mb-12 flex-1 relative z-10">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 opacity-80 px-1">Elite Features:</div>
            
            <FeatureItem 
                text="Advanced Privacy Protection" 
                icon={<Shield className="w-5 h-5 text-white" />} 
                className="text-white font-bold" 
                customIconBg="bg-indigo-600 shadow-md" 
            />
            <FeatureItem 
                text="500 AI Analyses per month" 
                icon={<BrainCircuit className="w-5 h-5 text-white" />} 
                className="text-white font-bold" 
                customIconBg="bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
            />
            <FeatureItem 
                text="500 Receipt Scans (Bulk Scanning)" 
                icon={<Smartphone className="w-5 h-5 text-white" />} 
                className="text-white font-bold" 
                customIconBg="bg-indigo-600 shadow-md" 
            />
            <FeatureItem 
                text="Batch Upload: 10 Receipts at once" 
                icon={<Layers className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Simulator 'Investment Potentials'" 
                icon={<Eye className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Adjustable Interest Projections (4% - 10%)" 
                icon={<TrendingUp className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Prestige Interface Themes" 
                icon={<Palette className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Financial Health Score" 
                icon={<Gauge className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Priority Processing" 
                icon={<Zap className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
            <FeatureItem 
                text="Early Access to Beta Features" 
                icon={<Rocket className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
             <FeatureItem 
                text="24/7 Dedicated Support" 
                icon={<ShieldCheck className="w-5 h-5 text-indigo-300" />} 
                className="text-indigo-100" 
                customIconBg="bg-indigo-950/80 border border-indigo-500/30" 
            />
          </div>

          <button 
            onClick={() => isElite ? onNavigateDashboard?.() : handleUpgradeClick('ultra')} 
            className="w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] text-indigo-950 bg-white hover:bg-indigo-50 shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] active:scale-95 transition-all relative z-10 overflow-hidden group/btn"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
                {isElite ? 'Open Dashboard' : 'Become Elite'}
                {!isElite && <Sparkles className="w-5 h-5 text-indigo-600 animate-[pulse_1.5s_ease-in-out_infinite]" />}
            </span>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer-fast"></div>
          </button>
        </div>
      </div>
      
      <div className="mt-20 text-center pb-24">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] max-w-sm mx-auto">
            Manage your budget with absolute transparency. Secure payment processed through Stripe.
        </p>
      </div>

      {isCheckoutOpen && selectedPlan && (
        <CheckoutModal plan={selectedPlan} onClose={() => setIsCheckoutOpen(false)} onConfirm={handleConfirmUpgrade} />
      )}

      {showCelebration && (
        <CelebrationModal onClose={() => { setShowCelebration(false); onNavigateDashboard?.(); }} />
      )}
    </div>
  );
};

const FeatureItem: React.FC<{ text: string; icon?: React.ReactNode; className?: string; customIconBg?: string }> = ({ text, icon, className, customIconBg }) => (
  <div className="flex items-start gap-4 animate-fade-in">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${customIconBg ? customIconBg : 'bg-slate-800 text-slate-400'}`}>
      {icon || <Check className="w-3.5 h-3.5" />}
    </div>
    <span className={`text-xs font-semibold leading-relaxed ${className || 'text-slate-300'}`}>{text}</span>
  </div>
);

const CelebrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div className="glass-card max-w-md w-full p-12 rounded-[4rem] border-2 border-indigo-500/50 text-center animate-slide-up relative overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.3)]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10 rotate-6 ring-4 ring-white/10">
          <PartyPopper className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Elite Status Active</h2>
        <p className="text-slate-400 mb-10 font-medium leading-relaxed">Your account has been successfully upgraded to Elite status! All dashboard tools and professional projections are now fully unlocked.</p>
        <button onClick={onClose} className="w-full py-5 bg-white text-indigo-950 font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">Open Dashboard</button>
      </div>
    </div>
  );
};

const CheckoutModal: React.FC<{ plan: UserPlan, onClose: () => void; onConfirm: () => void }> = ({ plan, onClose, onConfirm }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [card, setCard] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [error, setError] = useState('');
    const [isShake, setIsShake] = useState(false);
    const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');

    const price = plan === 'ultra' ? '$9.99' : '$2.99';

    useEffect(() => {
        const clean = card.replace(/\s/g, '');
        if (clean.startsWith('4')) setCardBrand('visa');
        else if (clean.startsWith('5') || clean.startsWith('2')) setCardBrand('mastercard');
        else if (clean.startsWith('3')) setCardBrand('amex');
        else setCardBrand('unknown');
    }, [card]);

    const formatCardNumber = (val: string) => {
        const clean = val.replace(/[^\d]/g, '').substring(0, 16);
        return clean.replace(/(.{4})/g, '$1 ').trim();
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (card.length < 10) {
            setError("Invalid card details.");
            setIsShake(true);
            setTimeout(() => setIsShake(false), 500);
            return;
        }
        setError('');
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onConfirm();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in">
             <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
                @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
                .scan-bar {
                    height: 2px;
                    background: linear-gradient(to right, transparent, #6366f1, transparent);
                    position: absolute;
                    width: 100%;
                    z-index: 20;
                    animation: scan 2s linear infinite;
                    box-shadow: 0 0 15px #6366f1;
                }
             `}</style>
             
             <div className={`bg-[#020617] w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up flex flex-col md:flex-row relative ${isShake ? 'animate-shake' : ''}`}>
                 <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors z-40 bg-slate-900/50 rounded-full"><X className="w-5 h-5" /></button>
                 
                 <div className="w-full md:w-1/2 p-10 bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-950/40 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_60%)]"></div>
                    
                    <div className={`w-full max-w-[340px] aspect-[1.58/1] rounded-2xl relative p-7 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 transform ${isProcessing ? 'scale-90 brightness-110 shadow-[0_0_40px_rgba(99,102,241,0.4)]' : 'hover:scale-[1.02]'} ${cardBrand === 'amex' ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : cardBrand === 'visa' ? 'bg-gradient-to-br from-indigo-600 to-blue-800' : cardBrand === 'mastercard' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10'}`}>
                        {isProcessing && <div className="scan-bar"></div>}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-9 bg-gradient-to-br from-amber-400 via-amber-200 to-amber-400 rounded-md shadow-inner"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-white/40 tracking-[0.3em] uppercase mb-1">Payment Card</span>
                                {cardBrand === 'visa' && <span className="text-white italic font-black text-2xl tracking-tighter">VISA</span>}
                                {cardBrand === 'mastercard' && <div className="flex -space-x-2"><div className="w-7 h-7 rounded-full bg-rose-500/90 shadow-lg"></div><div className="w-7 h-7 rounded-full bg-amber-500/90 shadow-lg"></div></div>}
                                {cardBrand === 'amex' && <span className="text-white font-black text-base border-2 border-white/40 px-2 italic rounded">AMEX</span>}
                                {cardBrand === 'unknown' && <CreditCard className="w-7 h-7 text-white/20" />}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className={`text-2xl font-mono text-white tracking-[0.2em] mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all ${isProcessing ? 'blur-[1px]' : ''}`}>{card || '•••• •••• •••• ••••'}</div>
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col"><span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Cardholder Name</span><span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[140px]">SECURE PAYMENT</span></div>
                                <div className="flex flex-col items-end"><span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Expires</span><span className="text-xs font-black text-white font-mono">{expiry || 'MM/YY'}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 text-center space-y-5 relative z-10">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black tracking-widest uppercase transition-all duration-500 ${isProcessing ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'}`}>
                            {isProcessing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</> : <><ShieldCheck className="w-3.5 h-3.5" /> Secure Connection Active</>}
                        </div>
                    </div>
                 </div>
 
                 <div className="flex-1 p-10 flex flex-col">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-1"><ShieldCheck className="w-6 h-6 text-indigo-500" /><h2 className="text-2xl font-black text-white tracking-tight uppercase">Checkout</h2></div>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase opacity-70">Safe and secure billing check.</p>
                    </div>
                    <form onSubmit={handlePay} className="space-y-6 flex-1">
                        <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group transition-all">
                            <div className="space-y-1"><div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selected Plan</div><div className="text-lg font-black text-white">{plan.toUpperCase()}</div></div>
                            <div className="text-right space-y-1"><div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Price</div><div className="text-2xl font-black text-white tracking-tighter">{price}</div></div>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Card Number</label>
                                <div className="relative group">
                                    <input required value={card} onChange={e => setCard(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-mono transition-all placeholder:text-slate-900 text-lg shadow-inner" />
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Expiration Date (MM/YY)</label><input required value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none font-mono text-center" /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">CVC Security Code</label><input required value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVC" className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none font-mono text-center" /></div>
                            </div>
                        </div>
                        {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest rounded-xl animate-fade-in flex items-center gap-3"><AlertTriangle className="w-4 h-4" /> {error}</div>}
                        <button disabled={isProcessing} className="w-full py-5 bg-white text-slate-950 font-black uppercase text-sm tracking-[0.3em] rounded-2xl shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:grayscale">
                            {isProcessing ? 'Processing Payment...' : 'Confirm Subscription'}
                        </button>
                        <div className="flex justify-center items-center gap-2 mt-6 opacity-60">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Payments Secured via Stripe</span>
                        </div>
                    </form>
                 </div>
             </div>
         </div>
    );
};

export default Plans;
