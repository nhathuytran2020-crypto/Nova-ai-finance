
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Save, Download, Trash2, Camera, RefreshCw, ZoomIn, FileJson, UserCircle, Upload, Move, Sparkles, Lock, AlertTriangle, XCircle, Heart, Terminal, Crown, CreditCard, Zap, Target, Gauge, ShieldCheck, Users, FileText, LogOut } from 'lucide-react';
import { UserPlan, Language, Currency, ToastMessage, BotMode, SpendingPeriod } from '../types';

interface SettingsProps {
  userName: string;
  userEmail: string;
  userAvatar: string;
  userAvatarZoom: number;
  userAvatarPos: { x: number; y: number };
  userBorder: string; 
  userBackground: string; 
  onUpdateBackground: (bg: string) => void;
  userPlan: UserPlan;
  onUpdateProfile: (name: string, email: string, avatar: string, zoom: number, pos: { x: number; y: number }, border: string) => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onClearData: () => void;
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
  currency: Currency;
  onUpdateCurrency: (curr: Currency) => void;
  botMode: BotMode;
  onUpdateBotMode: (mode: BotMode) => void;
  onDowngrade?: () => void;
  spendingLimit: number;
  onUpdateSpendingLimit: (limit: number) => void;
  spendingPeriod: SpendingPeriod;
  onUpdateSpendingPeriod: (period: SpendingPeriod) => void;
}

const AVATAR_PRESETS = [
  'bg-gradient-to-br from-indigo-500 to-purple-500',
  'bg-gradient-to-br from-emerald-400 to-cyan-500',
  'bg-gradient-to-br from-rose-500 to-orange-400',
  'bg-gradient-to-br from-amber-400 to-yellow-600',
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-slate-600 to-slate-800',
];

const BORDER_STYLES = [
  { id: 'default', label: 'Default', class: 'ring-1 ring-white/20' },
  { id: 'gold', label: 'Gold', class: 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' },
  { id: 'rainbow', label: 'Rainbow', class: 'ring-4 ring-transparent bg-gradient-to-tr from-rose-500 via-yellow-500 to-cyan-500 bg-[length:400%_400%] animate-gradient-xy p-[2px]' },
  { id: 'neon', label: 'Neon', class: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' },
  { id: 'plasma', label: 'Plasma', class: 'ring-2 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]' },
];

const Settings: React.FC<SettingsProps> = ({ 
  userName, 
  userEmail, 
  userAvatar, 
  userAvatarZoom, 
  userAvatarPos,
  userBorder,
  userBackground,
  onUpdateBackground,
  userPlan, 
  onUpdateProfile, 
  addToast,
  onExportData, 
  onImportData, 
  onClearData, 
  language, 
  onUpdateLanguage, 
  currency, 
  onUpdateCurrency,
  botMode,
  onUpdateBotMode,
  onDowngrade,
  spendingLimit,
  onUpdateSpendingLimit,
  spendingPeriod,
  onUpdateSpendingPeriod
}) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [avatar, setAvatar] = useState(userAvatar);
  const [zoom, setZoom] = useState(userAvatarZoom);
  const [pos, setPos] = useState(userAvatarPos);
  const [border, setBorder] = useState(userBorder);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<'reset' | 'downgrade' | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<'legal' | 'forum' | null>(null);
  const [activeThread, setActiveThread] = useState<'coach' | 'privacy' | 'crypto' | null>(null);
  
  // Password Confirmation State
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const isPro = userPlan === 'pro' || userPlan === 'ultra';
  const isElite = userPlan === 'ultra';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Data Integrity: Save first, then visual feedback
    onUpdateProfile(name, email, avatar, zoom, pos, border);
    
    setTimeout(() => {
      setIsSaving(false);
      addToast('Profile Saved: Your identity and avatar are updated.', 'success');
    }, 800);
  };

  // Improved Image Compressor with fixed event ordering
  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.7): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  
                  // Scale down if image is too large
                  if (width > maxWidth) {
                      height *= maxWidth / width;
                      width = maxWidth;
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      resolve(canvas.toDataURL('image/jpeg', quality)); 
                  } else {
                      // Fallback if canvas fails (rare)
                      resolve(img.src);
                  }
              };
              img.onerror = reject;
              img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const compressed = await compressImage(file, 300, 0.7); // Avatar: Small
          setAvatar(compressed);
          setZoom(1);
          setPos({ x: 0, y: 0 });
      } catch (err) {
          addToast('Failed to process image. Try a smaller file.', 'error');
      }
    }
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const compressed = await compressImage(file, 1920, 0.6); // Background: Large but compressed
          onUpdateBackground(compressed);
          addToast('Environment projection updated.', 'success');
      } catch (err) {
          addToast('Failed to process wallpaper.', 'error');
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isImageAvatar) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    // Zoom sensitivity should decrease as zoom increases to prevent hyper-fast movement
    const sensitivity = 0.5 / zoom;
    const dx = (e.clientX - dragRef.current.startX) * sensitivity;
    const dy = (e.clientY - dragRef.current.startY) * sensitivity;

    setPos({
      x: Math.max(-100, Math.min(100, dragRef.current.startPosX + dx)),
      y: Math.max(-100, Math.min(100, dragRef.current.startPosY + dy))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImageAvatar = avatar.includes('http') || avatar.startsWith('data:');

  const getBorderClasses = (styleId: string) => {
     const style = BORDER_STYLES.find(s => s.id === styleId);
     return style ? style.class : BORDER_STYLES[0].class;
  };

  const verifyPasswordAndExecute = (action: () => void) => {
      const stored = localStorage.getItem('nova_vault_key');
      const input = confirmPassword.trim();
      
      if (!stored) {
          // Social Login Case: No password needed, ask for simple confirmation text
          if (input === 'CONFIRM') {
              action();
              setShowConfirmModal(null);
              setConfirmPassword('');
              setPasswordError('');
          } else {
              setPasswordError("Type 'CONFIRM' to verify action.");
          }
          return;
      }

      if (input === stored) {
          action();
          setShowConfirmModal(null);
          setConfirmPassword('');
          setPasswordError('');
      } else {
          setPasswordError("Incorrect security passcode.");
      }
  };

  const handleConfirmKeyDown = (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          verifyPasswordAndExecute(action);
      }
  };

  return (
    <div className="h-auto min-h-0 flex flex-col max-w-7xl mx-auto w-full animate-slide-up pb-10" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-slate-400 mt-2 font-medium">Manage your profile and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-8 rounded-[2rem] text-center border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
                
                <div className="relative inline-block mb-6 group select-none">
                    <div 
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${!isImageAvatar ? avatar : ''} overflow-hidden bg-slate-800 ${isImageAvatar ? 'cursor-grab active:cursor-grabbing' : ''} ${getBorderClasses(border)}`}
                    >
                         {isImageAvatar ? (
                             <img 
                                src={avatar} 
                                alt="Profile" 
                                className="w-full h-full object-cover transition-transform duration-100 pointer-events-none" 
                                style={{ 
                                  transform: `scale(${zoom}) translate(${pos.x}px, ${pos.y}px)`,
                                  filter: isDragging ? 'brightness(1.1)' : 'none'
                                }}
                             />
                         ) : (
                             <User className="w-12 h-12 text-white/80" />
                         )}
                         {isImageAvatar && zoom > 1 && (
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Move className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                         )}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white">{name}</h3>
                <p className="text-slate-400 text-sm mb-4">{email}</p>
                
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isElite ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : isPro ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-700/50 text-slate-300 border border-white/5'}`}>
                    {isElite ? 'Elite' : isPro ? 'Nova Pro' : 'Free Plan'}
                </div>
            </div>

            <div className="glass-card p-6 rounded-[2rem] border border-white/5">
                <h4 className="text-sm font-bold text-white mb-4">Identity Style</h4>
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setAvatar(preset); setZoom(1); setPos({x:0, y:0}); }}
                            className={`w-12 h-12 rounded-full ${preset} hover:scale-110 transition-transform ring-2 ring-offset-2 ring-offset-slate-900 ${avatar === preset ? 'ring-white' : 'ring-transparent'}`}
                        />
                    ))}
                </div>

                {/* Pro Border Selection */}
                <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            Elite Aesthetics 
                            {!isElite && <Lock className="w-3 h-3 text-slate-500" />}
                        </h4>
                        {isElite && <Crown className="w-3 h-3 text-purple-400" />}
                    </div>
                    
                    <div className={`grid grid-cols-5 gap-2 ${!isElite ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {BORDER_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setBorder(style.id)}
                                title={style.label}
                                className={`w-8 h-8 rounded-full bg-slate-800 transition-all ${getBorderClasses(style.id)} ${border === style.id ? 'scale-110' : 'hover:scale-105 opacity-80'}`}
                            >
                            </button>
                        ))}
                    </div>
                    {!isElite && <p className="text-[10px] text-slate-500 mt-2 font-medium">Upgrade to Elite to unlock custom borders.</p>}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5 mt-4">
                    {isImageAvatar && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Magnitude</span>
                                    <span className="text-white">{(zoom * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="3" 
                                    step="0.05" 
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                />
                            </div>
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[10px] text-indigo-200 leading-relaxed font-bold uppercase tracking-tight">
                                <Move className="w-3 h-3 inline mr-1 mb-0.5" /> 
                                Drag photo within frame to adjust alignment.
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deploy Identity Plate</p>
                        <div className="relative group">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold border border-white/5 transition-all flex items-center justify-center gap-2 group-hover:text-white">
                                <Upload className="w-4 h-4" /> Upload Custom Photo
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Atmosphere Section */}
                    <div className="pt-4 border-t border-white/5 mt-4">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard Atmosphere</p>
                             {userBackground && (
                                <button onClick={() => onUpdateBackground('')} className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                    <XCircle className="w-3 h-3" /> Clear
                                </button>
                             )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3 font-medium leading-relaxed">Customize your command center backdrop.</p>
                        
                        {userBackground && (
                            <div className="mb-3 w-full h-20 rounded-xl overflow-hidden border border-white/20 relative shadow-md group">
                                <img src={userBackground} alt="Wallpaper" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                                <span className="absolute bottom-1 right-2 text-[9px] font-bold text-white uppercase tracking-widest text-shadow">Active</span>
                            </div>
                        )}

                        <div className="relative group mb-4">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleBackgroundChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold border border-white/5 transition-all flex items-center justify-center gap-2 group-hover:text-white shadow-lg">
                                <Sparkles className="w-4 h-4" /> {userBackground ? 'Update Wallpaper' : 'Set Wallpaper'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Forms & Settings */}
        <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSave} className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-indigo-400" />
                        Identity Matrix
                    </h3>
                    <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Processing...' : 'Save Profile & Avatar'}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pilot Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center justify-between">
                            Pilot Email
                            <span className="flex items-center gap-1 text-[9px] text-indigo-400">
                                <Lock className="w-2.5 h-2.5" />
                            </span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="email" 
                                value={email}
                                readOnly
                                className="w-full bg-slate-950/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-slate-500 cursor-not-allowed transition-all font-medium"
                                title="Email is managed by identity provider"
                            />
                        </div>
                    </div>
                 </div>
            </form>

            <div className="glass-card p-8 rounded-[2rem] border border-white/5">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Enforcement Parameters
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Spending Limit</label>
                        <input 
                            type="number" 
                            value={spendingLimit}
                            onChange={(e) => onUpdateSpendingLimit(parseFloat(e.target.value))}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Reset Period</label>
                        <select 
                            value={spendingPeriod}
                            onChange={(e) => onUpdateSpendingPeriod(e.target.value as SpendingPeriod)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Plan Management Section */}
            {(isPro || isElite) && (
                <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-slate-900/40">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-400" />
                        Subscription Management
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-white/5 gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isElite ? 'bg-purple-900/30 text-purple-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                {isElite ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base">Active Plan: {isElite ? 'Elite System' : 'Pro System'}</h4>
                                <p className="text-xs text-slate-400 mt-1">Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowConfirmModal('downgrade')}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-white/10 transition-colors"
                        >
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            )}

            <div className="glass-card p-8 rounded-[2rem] border border-white/5">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                    Protocol Preferences
                </h3>
                
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                 <RefreshCw className="w-5 h-5 text-blue-400" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-white text-sm">Interface Language</h4>
                                 <p className="text-xs text-slate-400 font-medium">Global localization setting.</p>
                             </div>
                         </div>
                         <div className="flex bg-slate-950 rounded-lg p-1 border border-white/10">
                             <button onClick={() => onUpdateLanguage('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>English</button>
                             <button onClick={() => onUpdateLanguage('vi')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'vi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Tiếng Việt</button>
                         </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                 <Camera className="w-5 h-5 text-emerald-400" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-white text-sm">Default Currency</h4>
                                 <p className="text-xs text-slate-400 font-medium">Reformat all monetary projections.</p>
                             </div>
                         </div>
                         <select 
                            value={currency} 
                            onChange={(e) => onUpdateCurrency(e.target.value as Currency)}
                            className="bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                             <option value="USD">USD ($)</option>
                             <option value="EUR">EUR (€)</option>
                             <option value="GBP">GBP (£)</option>
                             <option value="JPY">JPY (¥)</option>
                             <option value="VND">VND (₫)</option>
                         </select>
                    </div>
                </div>
            </div>

            {/* Explanation Style Section */}
            <div className="glass-card p-8 rounded-[2rem] border border-white/5">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Explanation Style
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => onUpdateBotMode('ruthless')}
                        className={`p-5 rounded-2xl border transition-all text-left flex flex-col gap-3 group relative overflow-hidden ${botMode === 'ruthless' ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className="p-2 bg-slate-950 rounded-lg border border-white/10"><Terminal className="w-5 h-5 text-slate-400" /></div>
                            {botMode === 'ruthless' && <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>}
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold mb-1 ${botMode === 'ruthless' ? 'text-white' : 'text-slate-300'}`}>Analytical (Default)</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Cold, efficient system messages. Exact numbers and unavoidable consequences. No emotion.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => onUpdateBotMode('supportive')}
                        className={`p-5 rounded-2xl border transition-all text-left flex flex-col gap-3 group relative overflow-hidden ${botMode === 'supportive' ? 'bg-indigo-900/20 border-indigo-400 ring-1 ring-indigo-400/50' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className="p-2 bg-slate-950 rounded-lg border border-white/10"><Heart className="w-5 h-5 text-pink-400" /></div>
                            {botMode === 'supportive' && <div className="w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></div>}
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold mb-1 ${botMode === 'supportive' ? 'text-white' : 'text-slate-300'}`}>Supportive</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Warmer phrasing of the same hard facts. Gentle delivery without softening the financial reality.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Legal & Community Section */}
      <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" />
            Legal & Community
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
                onClick={() => setShowInfoModal('legal')}
                className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 hover:border-white/20 transition-all text-left group flex items-center justify-between"
            >
                <div>
                    <h4 className="font-bold text-white text-sm mb-1">Terms of Use</h4>
                    <p className="text-xs text-slate-500 font-medium">Read our platform guidelines.</p>
                </div>
                <FileText className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </button>

            <button 
                onClick={() => setShowInfoModal('legal')}
                className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 hover:border-white/20 transition-all text-left group flex items-center justify-between"
            >
                <div>
                    <h4 className="font-bold text-white text-sm mb-1">Security & Legal</h4>
                    <p className="text-xs text-slate-500 font-medium">Data protection protocols.</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            <button 
                onClick={() => setShowInfoModal('forum')}
                className="p-5 bg-slate-900/50 border border-indigo-500/10 rounded-2xl hover:bg-indigo-900/20 hover:border-indigo-500/30 transition-all text-left group flex items-center justify-between"
            >
                <div>
                    <h4 className="font-bold text-indigo-400 text-sm mb-1">Community Forum</h4>
                    <p className="text-xs text-slate-500 font-medium">Learn more about the platform.</p>
                </div>
                <Users className="w-5 h-5 text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
            </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset/Downgrade */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
             <div className="relative max-w-sm w-full bg-slate-950 rounded-[2rem] border border-white/10 shadow-[0_0_100px_rgba(244,63,94,0.3)] overflow-hidden animate-slide-up ring-1 ring-white/5">
                 <div className="p-8 text-center">
                     <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-500/50 animate-pulse">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                     </div>
                     <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Security Check</h3>
                     <p className="text-rose-200 text-sm mb-6 leading-relaxed font-medium">
                         {showConfirmModal === 'reset' ? 'This will permanently purge all financial data.' : 'Downgrading removes access to premium AI features immediately.'}
                     </p>
                     
                     <div className="mb-6 text-left">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                             {localStorage.getItem('nova_vault_key') ? "Confirm Passcode" : "Authorization Required"}
                         </label>
                         <input 
                            type="password" 
                            autoFocus
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                            onKeyDown={(e) => handleConfirmKeyDown(e, () => {
                                if (showConfirmModal === 'reset') onClearData();
                                if (showConfirmModal === 'downgrade' && onDowngrade) onDowngrade();
                            })}
                            placeholder={localStorage.getItem('nova_vault_key') ? "Enter vault password" : "Type 'CONFIRM'"}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-rose-500 focus:outline-none"
                         />
                         {passwordError && <p className="text-rose-500 text-xs mt-2 font-bold">{passwordError}</p>}
                         {!localStorage.getItem('nova_vault_key') && (
                             <p className="text-slate-500 text-[10px] mt-2 italic">Social Login? Type 'CONFIRM' to proceed.</p>
                         )}
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => {
                                setShowConfirmModal(null);
                                setConfirmPassword('');
                                setPasswordError('');
                            }} 
                            className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-white/5"
                        >
                             Cancel
                        </button>
                        <button 
                            onClick={() => verifyPasswordAndExecute(() => {
                                if (showConfirmModal === 'reset') onClearData();
                                if (showConfirmModal === 'downgrade' && onDowngrade) onDowngrade();
                            })}
                            className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                             <Trash2 className="w-4 h-4" /> Confirm
                        </button>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {/* Info Modals for Forum / Legal */}
      {showInfoModal === 'legal' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="relative max-w-lg w-full bg-slate-950 rounded-[2rem] border border-white/10 p-6 md:p-8 animate-slide-up ring-1 ring-white/5">
                <button onClick={() => setShowInfoModal(null)} className="absolute top-6 right-6 p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors">
                    <XCircle className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-500/20 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
                    <h3 className="text-xl font-bold text-white">Terms & Security</h3>
                </div>
                <div className="space-y-4 text-sm text-slate-400 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    <p><strong>1. Data Privacy:</strong> All your financial inputs are tokenized. We don't sell your data to third parties.</p>
                    <p><strong>2. Local Vault:</strong> Your data is primarily stored and computed locally. Syncing guarantees multi-device functionality.</p>
                    <p><strong>3. Use of AI:</strong> Insights are generated through secure, anonymous APIs. Models are not trained on your private transactions.</p>
                    <p><strong>4. Disclaimer:</strong> Our AI coach provides guidance, not professional financial advice. Always consult a certified advisor before making major monetary decisions.</p>
                </div>
                <button onClick={() => setShowInfoModal(null)} className="w-full mt-6 py-3 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/10 transition-colors">I Understand</button>
            </div>
        </div>
      )}

      {showInfoModal === 'forum' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="relative max-w-lg w-full bg-slate-950 rounded-[2rem] border border-white/10 p-6 md:p-8 animate-slide-up ring-1 ring-white/5">
                <button onClick={() => { setShowInfoModal(null); setActiveThread(null); }} className="absolute top-6 right-6 p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors">
                    <XCircle className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-xl"><Users className="w-6 h-6 text-indigo-400" /></div>
                    <h3 className="text-xl font-bold text-white">Community Forum</h3>
                </div>
                
                {activeThread === null ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-sm text-slate-400 mb-4">Welcome to the Nova Financial Hub. Connect with others, learn the platform, and grow your wealth.</p>
                        
                        <div 
                            onClick={() => setActiveThread('coach')}
                            className="p-4 bg-slate-900 hover:bg-slate-850 border border-white/5 rounded-xl cursor-pointer transition-colors"
                        >
                            <h4 className="text-indigo-300 font-bold text-sm mb-1">Getting Started with the AI Coach</h4>
                            <p className="text-xs text-slate-500">Learn how to ask the right questions about your budget constraints. <span className="text-indigo-400 hover:underline">Read more...</span></p>
                        </div>
                        
                        <div 
                            onClick={() => setActiveThread('privacy')}
                            className="p-4 bg-slate-900 hover:bg-slate-850 border border-white/5 rounded-xl cursor-pointer transition-colors"
                        >
                            <h4 className="text-indigo-300 font-bold text-sm mb-1">How is my Privacy Protected?</h4>
                            <p className="text-xs text-slate-500">Deep dive into our encryption strategy and local capsule mechanisms. <span className="text-indigo-400 hover:underline">Read more...</span></p>
                        </div>

                        <div 
                            onClick={() => setActiveThread('crypto')}
                            className="p-4 bg-slate-900 hover:bg-slate-850 border border-white/5 rounded-xl cursor-pointer transition-colors"
                        >
                            <h4 className="text-indigo-300 font-bold text-sm mb-1">Feature Request: Crypto Tracking</h4>
                            <p className="text-xs text-slate-500">Upvote this thread if you want to see standard web3 wallet support. <span className="text-indigo-400 hover:underline">Read more...</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
                        <button 
                            onClick={() => setActiveThread(null)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold mb-2 flex items-center gap-1"
                        >
                            &larr; Back to threads list
                        </button>
                        
                        {activeThread === 'coach' && (
                            <div className="space-y-4">
                                <h4 className="text-indigo-300 font-bold text-base">Getting Started with the AI Coach</h4>
                                <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                                    <p>The **Financial Coach** page responds in real-time to your spending metrics, budget limits, and prompt styles. To make the coach most effective, try these strategies:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Specify exact queries like: <code className="text-indigo-300">"Analyze my utility expenses"</code> or <code className="text-indigo-300">"Give me advice on saving for a house"</code>.</li>
                                        <li>Toggle your **Explanation Style** setting in Settings to switch between strict **Analytical (cold numbers)** and encouraging **Supportive (warmer delivery)** modes.</li>
                                    </ul>
                                    <p className="text-slate-500 italic mt-4 border-t border-white/5 pt-2 font-medium">Topic created by moderator_alice · 12 contributions</p>
                                </div>
                            </div>
                        )}

                        {activeThread === 'privacy' && (
                            <div className="space-y-4">
                                <h4 className="text-indigo-300 font-bold text-base">How is my Privacy Protected?</h4>
                                <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                                    <p>Your privacy is guaranteed by architectural design:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>All transactions, budget constraints, account balances, and goal architectures are computed directly inside your browser database.</li>
                                        <li>Insights are analyzed using secure, anonymous API proxies. Rest assured, your personal names or emails are never packaged with API payloads.</li>
                                        <li>No third party can access your records since it stays safe on your sandbox layer!</li>
                                    </ul>
                                    <p className="text-slate-500 italic mt-4 border-t border-white/5 pt-2 font-medium">Topic created by syssec_dan · 24 contributions</p>
                                </div>
                            </div>
                        )}

                        {activeThread === 'crypto' && (
                            <div className="space-y-4">
                                <h4 className="text-indigo-300 font-bold text-base">Feature Request: Crypto Tracking</h4>
                                <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                                    <p>Thank you for submitting this popular feature request! We are monitoring votes closely:</p>
                                    <p className="bg-slate-900 p-3 rounded-lg border border-white/5 text-[11px] text-indigo-400 font-semibold">Current Votes: 524 ▲ upvotes</p>
                                    <p>Our roadmap planning for **v1.5** includes adding custom web3 support so you can manually track Ethereum and Bitcoin wallets or watch ticker feeds automatically alongside your fiat accounts.</p>
                                    <p className="text-slate-500 italic mt-4 border-t border-white/5 pt-2 font-medium">Topic created by web3_explorer · 68 contributions</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <button onClick={() => { setShowInfoModal(null); setActiveThread(null); }} className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">Close Forum</button>
            </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
