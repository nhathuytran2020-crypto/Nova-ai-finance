
import React, { useState } from 'react';
import { Language, SpendingPeriod } from '../types';
import { Check, ArrowRight, Shield, User, Globe, Calendar, DollarSign, Wallet, Activity } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (name: string, lang: Language, period: SpendingPeriod, limit: number) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [period, setPeriod] = useState<SpendingPeriod>('monthly');
  const [limit, setLimit] = useState<string>('1000');

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      if (step === 1 && !name.trim()) return; // Validate name
      setStep(step + 1);
    } else {
      const numLimit = parseFloat(limit);
      if (numLimit > 0) {
        onComplete(name, language, period, numLimit);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-3xl animate-fade-in">
        <div className="w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row min-h-[550px] relative animate-slide-up">
            
            {/* Left Side: Visual Progress */}
            <div className="w-full md:w-5/12 bg-slate-950 p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                
                <div className="relative z-10" key={`text-${step}`}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 animate-slide-up">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight mb-2 animate-fade-in">
                        {step === 1 ? 'Profile' : step === 2 ? 'Language' : step === 3 ? 'Schedule' : 'Limits'}
                    </h2>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs animate-fade-in">
                        {step === 1 ? 'Tell us who you are so we can personalize your experience.' : 
                         step === 2 ? 'Pick the language you want the app to use.' :
                         step === 3 ? 'Do you want to track your money by the week or by the month?' :
                         'What is the maximum amount you want to spend in this cycle?'}
                    </p>
                </div>

                <div className="relative z-10 mt-8 md:mt-0">
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Step {step} of {totalSteps}</span>
                        <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Interactive Form */}
            <div className="flex-1 p-8 md:p-12 flex flex-col relative bg-slate-900/20">
                <div className="flex-1 flex flex-col justify-center">
                    {/* KEY CHANGE: Using a wrapper div with a key prop forces React to re-render the animation when 'step' changes. */}
                    <div key={`step-content-${step}`} className="animate-slide-up">
                        {step === 1 && (
                            <div className="space-y-6">
                                <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide">Your Name</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
                                        placeholder="e.g. Alex"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide">Language</label>
                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => setLanguage('en')}
                                        className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${language === 'en' ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${language === 'en' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className={`font-bold text-lg ${language === 'en' ? 'text-white' : 'text-slate-300'}`}>English</div>
                                                <div className={`text-xs font-medium ${language === 'en' ? 'text-indigo-200' : 'text-slate-500'}`}>Standard</div>
                                            </div>
                                        </div>
                                        {language === 'en' && <Check className="w-6 h-6 text-white" />}
                                    </button>

                                    <button 
                                        onClick={() => setLanguage('vi')}
                                        className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${language === 'vi' ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${language === 'vi' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className={`font-bold text-lg ${language === 'vi' ? 'text-white' : 'text-slate-300'}`}>Tiếng Việt</div>
                                                <div className={`text-xs font-medium ${language === 'vi' ? 'text-indigo-200' : 'text-slate-500'}`}>Vietnamese</div>
                                            </div>
                                        </div>
                                        {language === 'vi' && <Check className="w-6 h-6 text-white" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide">Budget Cycle</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setPeriod('weekly')}
                                        className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-4 h-full relative overflow-hidden group ${period === 'weekly' ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between w-full">
                                            <div className={`p-3 rounded-xl ${period === 'weekly' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Activity className="w-6 h-6" />
                                            </div>
                                            {period === 'weekly' && <Check className="w-6 h-6 text-white" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg ${period === 'weekly' ? 'text-white' : 'text-slate-200'}`}>Weekly</h4>
                                            <p className={`text-xs mt-1 ${period === 'weekly' ? 'text-indigo-200' : 'text-slate-500'}`}>Every 7 Days</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setPeriod('monthly')}
                                        className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-4 h-full relative overflow-hidden group ${period === 'monthly' ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between w-full">
                                            <div className={`p-3 rounded-xl ${period === 'monthly' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            {period === 'monthly' && <Check className="w-6 h-6 text-white" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg ${period === 'monthly' ? 'text-white' : 'text-slate-200'}`}>Monthly</h4>
                                            <p className={`text-xs mt-1 ${period === 'monthly' ? 'text-indigo-200' : 'text-slate-500'}`}>Every 30 Days</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide">Spending Goal</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                    <input 
                                        type="number" 
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-3xl font-black text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700 shadow-inner"
                                        placeholder="1000"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    />
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Wallet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-emerald-200 font-medium leading-relaxed">
                                        We'll warn you if you get close to spending this much.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-end">
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && !name.trim()}
                        className="px-8 py-4 bg-white text-slate-950 font-black uppercase text-sm tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                    >
                        {step === totalSteps ? 'Get Started' : 'Continue'} 
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingModal;
