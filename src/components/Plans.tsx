
import React, { useMemo } from 'react';
import { UserPlan } from '../types';
import { Check, Star, Zap, Shield, Sparkles, CreditCard, Lock, X, Loader2, Smartphone, BrainCircuit, Target, BarChart3, PartyPopper, AlertTriangle, Crown, Infinity, ShieldCheck, ArrowRight, ShieldX, Fingerprint, PieChart, Activity, Layers, Eye, Gauge, MessageSquare, History, Rocket, Palette, TrendingUp, Globe, FileText, Cpu, Search } from 'lucide-react';
;

interface PlansProps {
  currentPlan: UserPlan;
  onUpgrade: (plan: UserPlan) => void;
  onDowngrade: () => void;
  onNavigateDashboard?: () => void;
}

const Plans: React.FC<PlansProps> = ({ currentPlan, onUpgrade, onDowngrade, onNavigateDashboard }) => {
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
    if (plan === 'pro') {
      window.location.href = 'https://buy.stripe.com/test_8x2bJ34ZJdmS3VG4oP24000';
    } else if (plan === 'ultra') {
      window.location.href = 'https://buy.stripe.com/test_5kQaEZ4ZJbeKeAkcVl24001';
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

export default Plans;
