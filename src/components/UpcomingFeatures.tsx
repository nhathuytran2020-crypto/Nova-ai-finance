
import React from 'react';
import { Rocket, Volume2, Search, Palette, Layers, Radio, Cpu, Globe, Zap, ShieldCheck, ShieldAlert, Fingerprint, SearchCheck, Ghost, Activity, Waves } from 'lucide-react';

const UpcomingFeatures: React.FC = () => {
  return (
    <div className="animate-slide-up pb-20 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
               <Rocket className="w-8 h-8 text-indigo-400" />
               Feature Roadmap
            </h2>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">UPCOMING</span>
          </div>
          <p className="text-slate-400 font-medium">New tools and updates currently being built for your financial future.</p>
        </div>
        <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lab Status</span>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-white">Active Development</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FeatureDetailCard 
          icon={<Waves className="w-8 h-8" />}
          title="Money Flow Visuals"
          desc="See exactly where your money goes. Track the journey of every dollar from your paycheck to your bills with easy-to-read flow charts."
          status="Polishing"
          release="Next Release"
          technical="Interactive Charts"
          color="indigo"
        />
        <FeatureDetailCard 
          icon={<ShieldAlert className="w-8 h-8" />}
          title="Financial Health Score"
          desc="A real-time score of your overall financial well-being. Get a clear picture of how you're doing based on your goals and monthly spending."
          status="Experimental"
          release="TBD"
          technical="Smart Metrics"
          color="rose"
        />
        <FeatureDetailCard 
          icon={<SearchCheck className="w-8 h-8" />}
          title="Automated Rate Savings"
          desc="Automatically scan for the best bank interest rates and investment opportunities from across the web to grow your money faster."
          status="Research"
          release="Coming Soon"
          technical="Smart Research"
          color="indigo"
        />
        <FeatureDetailCard 
          icon={<Ghost className="w-8 h-8" />}
          title="Spending Forecaster"
          desc="See your financial future. Predict how much a purchase today would be worth in 10 years if you invested it instead."
          status="Modeling"
          release="Planned"
          technical="Future Logic"
          color="amber"
        />
        <FeatureDetailCard 
          icon={<Volume2 className="w-8 h-8" />}
          title="Personal Voice Assistant"
          desc="Log your expenses and check your balance by speaking naturally. No more typing or searching through menus."
          status="In Prototyping"
          release="Near Future"
          technical="Voice Technology"
          color="rose"
        />
        <FeatureDetailCard 
          icon={<Activity className="w-8 h-8" />}
          title="Overspending Alerts"
          desc="Get notified of unusual spending before it becomes a problem. Our system flags spikes so you can stay on track."
          status="Tuning"
          release="Planned"
          technical="Alert Engine"
          color="amber"
        />
        <FeatureDetailCard 
          icon={<Palette className="w-8 h-8" />}
          title="Enhanced Experience 2.0"
          desc="A smoother, more interactive interface with visual effects that respond to your movement for a truly premium feel."
          status="Design Phase"
          release="Planned"
          technical="Modern UI"
          color="emerald"
        />
        <FeatureDetailCard 
          icon={<Layers className="w-8 h-8" />}
          title="Total Account Bridge"
          desc="Connect all your banks, investment accounts, and physical assets for a complete financial overview in one unified dashboard."
          status="Planning"
          release="Future Update"
          technical="Secure Sync"
          color="indigo"
        />
      </div>

      <div className="glass-card p-10 rounded-[3rem] border border-indigo-500/20 bg-indigo-950/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] -mr-20 -mt-20"></div>
          <h3 className="text-2xl font-black text-white mb-6">Internal Lab Targets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LabTarget 
                title="Tax Harvesting AI" 
                desc="Automated detection of tax-loss opportunities in connected portfolios." 
                icon={<Zap className="w-5 h-5 text-amber-400" />}
              />
              <LabTarget 
                title="Biometric Ledger" 
                desc="Authorize large transactions via system-level fingerprint/face-ID uplink." 
                icon={<Fingerprint className="w-5 h-5 text-indigo-400" />}
              />
              <LabTarget 
                title="Macro Sync" 
                desc="Sync global economic data (inflation, interest rates) to adjust your trajectory." 
                icon={<Globe className="w-5 h-5 text-blue-400" />}
              />
          </div>
      </div>
    </div>
  );
};

const FeatureDetailCard: React.FC<{ 
  icon: React.ReactNode, 
  title: string, 
  desc: string, 
  status: string, 
  release: string, 
  technical: string,
  color: 'rose' | 'indigo' | 'emerald' | 'amber' 
}> = ({ icon, title, desc, status, release, technical, color }) => {
    const colors = {
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    };

    return (
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-white/15 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity bg-current ${colors[color].split(' ')[0]}`}></div>
            <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl border shadow-xl ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
                <div className="text-right">
                    <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/5 text-slate-400 uppercase tracking-widest block mb-1 border border-white/5">{status}</span>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{release}</span>
                </div>
            </div>
            <h4 className="text-2xl font-black text-white mb-4 tracking-tight">{title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed font-medium mb-8">{desc}</p>
            <div className="pt-6 border-t border-white/5 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Protocol: {technical}</span>
            </div>
        </div>
    );
};

const LabTarget: React.FC<{ title: string, desc: string, icon: React.ReactNode }> = ({ title, desc, icon }) => (
    <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 hover:bg-slate-800/50 transition-colors">
        <div className="mb-4">{icon}</div>
        <h5 className="text-white font-bold text-sm mb-1">{title}</h5>
        <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

export default UpcomingFeatures;
