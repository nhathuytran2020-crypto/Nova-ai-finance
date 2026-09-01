
import React from 'react';
import { Wallet, CreditCard, Plus, Sparkles, Settings } from 'lucide-react';
import { Language } from '../types';

interface MobileNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onAddTransaction: () => void;
  language?: Language;
}

const LOCAL_TRANSLATIONS = {
  en: {
    home: 'Home',
    activity: 'Activity',
    smart: 'Smart',
    settings: 'Settings'
  },
  vi: {
    home: 'Trang chủ',
    activity: 'Hoạt động',
    smart: 'AI Trợ Lý',
    settings: 'Cài đặt'
  }
};

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onNavigate, onAddTransaction, language = 'en' }) => {
  const t = LOCAL_TRANSLATIONS[language];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 pb-safe bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[90]">
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 scale-110 drop-shadow-md' : 'text-slate-500 hover:text-white'}`}
      >
        <Wallet className="w-5 h-5" />
        <span className="text-[9px] font-bold tracking-wide">{t.home}</span>
      </button>
      
      <button 
        onClick={() => onNavigate('transactions')}
        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'transactions' ? 'text-indigo-400 scale-110 drop-shadow-md' : 'text-slate-500 hover:text-white'}`}
      >
        <CreditCard className="w-5 h-5" />
        <span className="text-[9px] font-bold tracking-wide">{t.activity}</span>
      </button>

      <div className="flex-1 flex justify-center -mt-6">
        <button 
          onClick={onAddTransaction}
          className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border-4 border-[#020617] active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <button 
        onClick={() => onNavigate('smart_money')}
        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'smart_money' ? 'text-indigo-400 scale-110 drop-shadow-md' : 'text-slate-500 hover:text-white'}`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[9px] font-bold tracking-wide">{t.smart}</span>
      </button>

      <button 
        onClick={() => onNavigate('settings')}
        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'settings' ? 'text-indigo-400 scale-110 drop-shadow-md' : 'text-slate-500 hover:text-white'}`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[9px] font-bold tracking-wide">{t.settings}</span>
      </button>
    </div>
  );
};

export default MobileNav;
