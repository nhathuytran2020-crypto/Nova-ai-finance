
// Diagnostic comment to trigger re-collection
import React, { useState, useMemo, useEffect } from 'react';
import { Account, Budget, Transaction, TransactionType, UserPlan } from '../types';
import { Plus, Wallet, CreditCard, Landmark, TrendingUp, Edit2, Trash2, XCircle, DollarSign, AlertCircle, User as UserIcon, ArrowRightCircle, Tag, UserCircle, Users, Share2, MessageSquare, History } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface AccountsProps {
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  userPlan: UserPlan;
  onAdd: (account: Account) => void;
  onUpdate: (account: Account) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string | React.ReactNode;
  userName: string;
  userAvatar: string;
  userAvatarZoom: number;
  userAvatarPos: { x: number; y: number };
  userBorder: string; 
  onNavigate: (tab: string) => void; 
}

const Accounts: React.FC<AccountsProps> = ({ 
  accounts, 
  budgets, 
  transactions, 
  userPlan, 
  onAdd, 
  onUpdate, 
  onDelete, 
  formatCurrency,
  userName,
  userAvatar,
  userAvatarZoom,
  userAvatarPos,
  userBorder,
  onNavigate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeSpace, setActiveSpace] = useState<'personal' | 'shared'>('personal');

  const [sharedAccounts, setSharedAccounts] = useState<Account[]>([]);
  const [sharedMembers, setSharedMembers] = useState<{name: string, role: string, active: boolean, color: string, avatar: string, uid?: string}[]>([]);
  const [sharedFeed, setSharedFeed] = useState<{id: string, user: string, action: string, amount: number, target: string, time: string}[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Listen to shared accounts where user is owner OR in memberIds
    const q1 = query(collection(db, 'sharedAccounts'), where('ownerId', '==', uid));
    const q2 = query(collection(db, 'sharedAccounts'), where('memberIds', 'array-contains', uid));
    
    const parseSnapshot = (snapshot: any) => {
        const accs: Account[] = [];
        snapshot.forEach((d: any) => {
             const data = d.data();
             accs.push({
                 id: d.id,
                 name: data.name,
                 balance: data.balance,
                 type: data.type,
                 color: data.color || '#06b6d4',
                 nickname: data.ownerId === uid ? 'Owned by you' : 'Shared with you',
             } as Account);
        });
        return accs;
    };

    const unsub1 = onSnapshot(q1, (snap) => {
        setSharedAccounts(prev => {
            const others = prev.filter(p => snap.docs.every((d:any) => d.id !== p.id));
            return [...others, ...parseSnapshot(snap)];
        });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sharedAccounts'));

    const unsub2 = onSnapshot(q2, (snap) => {
        setSharedAccounts(prev => {
            const others = prev.filter(p => snap.docs.every((d:any) => d.id !== p.id));
            return [...others, ...parseSnapshot(snap)];
        });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sharedAccounts'));
    
    return () => { unsub1(); unsub2(); };
  }, []);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [detectedUser, setDetectedUser] = useState<{uid: string, email: string, displayName?: string} | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  const checkUserExists = async (emailToInvite: string) => {
    if (!emailToInvite) return;
    setIsSearchingUser(true);
    setSearchError(null);
    setDetectedUser(null);
    setUserNotFound(false);
    
    try {
      const emailLower = emailToInvite.trim().toLowerCase();
      const emailRaw = emailToInvite.trim();
      
      let snapshot = await getDocs(query(
        collection(db, 'users'), 
        where('email', '==', emailLower)
      ));
      
      if (snapshot.empty && emailRaw !== emailLower) {
        snapshot = await getDocs(query(
          collection(db, 'users'), 
          where('email', '==', emailRaw)
        ));
      }
      
      if (!snapshot.empty) {
        const docUser = snapshot.docs[0];
        const data = docUser.data();
        setDetectedUser({
          uid: docUser.id,
          email: data.email,
          displayName: data.displayName || data.name
        });
      } else {
        setUserNotFound(true);
      }
    } catch (err: any) {
      console.error("Error looking up user:", err);
      // Fallback/Graceful handling if permission restricts list query:
      setUserNotFound(true); 
    } finally {
      setIsSearchingUser(false);
    }
  };

  const isPro = userPlan === 'pro';

  const netWorth = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);

  // Sync Calendar Month Logic
  const isRisky = useMemo(() => {
    if (!isPro) return false;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return budgets.some(budget => {
      const spent = transactions
        .filter(t => t.category === budget.category && 
                    t.type === TransactionType.EXPENSE && 
                    new Date(t.date).getMonth() === currentMonth && 
                    new Date(t.date).getFullYear() === currentYear)
        .reduce((acc, t) => acc + t.amount, 0);
      return spent > budget.limit;
    });
  }, [budgets, transactions, isPro]);

  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account? associated transactions will remain but balances may need adjustment.')) {
      onDelete(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Checking': return <Wallet className="w-6 h-6" />;
      case 'Savings': return <Landmark className="w-6 h-6" />;
      case 'Credit Card': return <CreditCard className="w-6 h-6" />;
      case 'Investment': return <TrendingUp className="w-6 h-6" />;
      case 'Profile': return <UserIcon className="w-6 h-6" />; 
      default: return <Wallet className="w-6 h-6" />;
    }
  };

  const getBorderClasses = (style: string) => {
    if (!isPro && style !== 'default') return 'ring-2 ring-white/10';
    switch (style) {
      case 'gold': return 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]';
      case 'rainbow': return 'ring-4 ring-transparent bg-gradient-to-tr from-rose-500 via-yellow-500 to-cyan-500 bg-[length:400%_400%] animate-gradient-xy p-[2px]';
      case 'neon': return 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
      case 'plasma': return 'ring-2 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]';
      default: return 'ring-2 ring-white/10';
    }
  };

  const isImageAvatar = userAvatar.includes('http') || userAvatar.startsWith('data:');

  const userProfileAccount: Account = useMemo(() => ({
    id: 'user-profile-account',
    name: userName || 'Your Profile',
    type: 'Profile',
    balance: netWorth, 
    institution: 'Personal Portfolio',
    color: '#6366f1', 
  }), [userName, netWorth]);

  const allAccounts = useMemo(() => [...accounts, userProfileAccount], [accounts, userProfileAccount]);

  const handleModalSubmit = async (account: Account, targetSpace: 'personal' | 'shared') => {
    if (editingAccount) {
      const wasShared = sharedAccounts.some(a => a.id === editingAccount.id);
      
      if (targetSpace === 'shared') {
        if (wasShared) {
          // Update existing shared account
          if (auth.currentUser) {
            try {
              await updateDoc(doc(db, 'sharedAccounts', account.id), {
                name: account.name,
                balance: account.balance,
                type: account.type,
                color: account.color || '#06b6d4',
              });
            } catch(e) { handleFirestoreError(e, OperationType.UPDATE, 'sharedAccounts'); }
          }
        } else {
          // Transfer from personal to shared
          onDelete(editingAccount.id);
          if (auth.currentUser) {
            try {
              const subId = Date.now().toString();
              await setDoc(doc(db, 'sharedAccounts', subId), {
                name: account.name,
                balance: account.balance,
                type: account.type,
                color: account.color || '#06b6d4',
                ownerId: auth.currentUser.uid,
                memberIds: [],
                createdAt: new Date().toISOString()
              });
              await addDoc(collection(db, `sharedAccounts/${subId}/feed`), {
                user: userName || 'User',
                action: 'transferred account to collaborative space',
                amount: account.balance,
                target: account.name,
                time: 'Just now',
                timestamp: Date.now()
              });
            } catch(e) { handleFirestoreError(e, OperationType.CREATE, 'sharedAccounts'); }
          }
        }
      } else {
        if (wasShared) {
          // Transfer from shared to personal
          if (auth.currentUser) {
            try {
              await deleteDoc(doc(db, 'sharedAccounts', editingAccount.id));
            } catch(e) { handleFirestoreError(e, OperationType.DELETE, 'sharedAccounts'); }
          }
          account.id = Date.now().toString(); // Ensure new ID for personal
          onAdd(account);
        } else {
          onUpdate(account);
        }
      }
    } else {
      if (targetSpace === 'shared') {
        if (auth.currentUser) {
            try {
              const subId = Date.now().toString();
              await setDoc(doc(db, 'sharedAccounts', subId), {
                name: account.name,
                balance: account.balance,
                type: account.type,
                color: account.color || '#06b6d4',
                ownerId: auth.currentUser.uid,
                memberIds: [],
                createdAt: new Date().toISOString()
              });
              await addDoc(collection(db, `sharedAccounts/${subId}/feed`), {
                user: userName || 'User',
                action: 'created joint account',
                amount: account.balance,
                target: account.name,
                time: 'Just now',
                timestamp: Date.now()
              });
            } catch(e) { handleFirestoreError(e, OperationType.CREATE, 'sharedAccounts'); }
          }
      } else {
        onAdd(account);
      }
    }
    handleModalClose();
  };

  return (
    <div className="h-auto min-h-0 flex flex-col max-w-7xl mx-auto w-full space-y-6 animate-slide-up pb-10">
      {/* Shared Space Toggle */}
      <div className="flex justify-center w-full mb-2 animate-fade-in">
        <div className="inline-flex p-1 bg-[#0f172a] rounded-[2rem] border border-white/5 relative shadow-lg shadow-black/20">
            <button 
              onClick={() => setActiveSpace('personal')}
              className={`relative z-10 px-6 py-2.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                activeSpace === 'personal'
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
                Personal Space
            </button>
            <div className="relative">
                <button 
                  onClick={() => setActiveSpace('shared')}
                  className={`relative px-6 py-2.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    activeSpace === 'shared'
                      ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                    <UserCircle className="w-4 h-4 opacity-75" />
                    Shared Space
                </button>
            </div>
        </div>
      </div>

      {activeSpace === 'personal' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">My Accounts</h2>
              <p className="text-slate-400 mt-2 font-medium">Manage your connected institutions and manual accounts.</p>
            </div>
            <button 
              onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 group border border-indigo-400/20"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {allAccounts.map((acc) => {
              const isOverdrawn = acc.balance < 0;
              return (
                <div 
                    key={acc.id} 
                    onClick={acc.id === 'user-profile-account' ? () => onNavigate('settings') : undefined}
                    className={`group glass-card p-6 rounded-[2rem] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl 
                        ${acc.id === 'user-profile-account' 
                            ? 'border-amber-400/30 ring-1 ring-amber-400/20 bg-amber-500/5 cursor-pointer hover:border-amber-400/50' 
                            : isOverdrawn 
                                ? 'border-rose-500/30 ring-1 ring-rose-500/10 bg-rose-500/5' 
                                : 'border-t border-white/10'
                        }`}
                >
                  <div 
                    className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-20 pointer-events-none"
                    style={{ backgroundColor: isOverdrawn && acc.id !== 'user-profile-account' ? '#f43f5e' : acc.color }}
                  ></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${acc.id === 'user-profile-account' ? getBorderClasses(userBorder) : 'ring-1 ring-white/10'} overflow-hidden`} 
                      style={acc.id === 'user-profile-account' && isImageAvatar ? {backgroundColor: 'transparent'} : { backgroundColor: acc.color }}
                    >
                      {acc.id === 'user-profile-account' && isImageAvatar ? (
                          <img 
                              src={userAvatar} 
                              alt="User Profile" 
                              className="w-full h-full object-cover transition-transform duration-100" 
                              style={{ 
                                transform: `scale(${userAvatarZoom}) translate(${userAvatarPos.x * 0.44}px, ${userAvatarPos.y * 0.44}px)`,
                              }}
                          />
                      ) : (
                          getAccountIcon(acc.type)
                      )}
                    </div>
                    {acc.id !== 'user-profile-account' && ( 
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(acc); }} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(acc.id); }} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    {acc.id === 'user-profile-account' && (
                         <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">
                             <ArrowRightCircle className="w-5 h-5" />
                         </div>
                    )}
                  </div>

                  <div className="relative z-10">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{acc.institution}</p>
                    <h3 className="text-xl font-bold text-white mb-1">{acc.name}</h3>
                    {acc.nickname && <p className="text-xs text-indigo-300 font-medium mb-4 italic">"{acc.nickname}"</p>}
                    {!acc.nickname && <div className="mb-4"></div>}
                    
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className={`text-3xl font-bold tracking-tight ${acc.balance < 0 ? 'text-rose-500' : 'text-white'}`}>
                          {formatCurrency(acc.balance)}
                      </span>
                      {acc.balance < 0 && <span className="text-xs text-rose-400 font-black bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 uppercase tracking-tighter">DEBT</span>}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-xs font-medium text-slate-300 ${acc.id === 'user-profile-account' ? 'bg-amber-500/20 border-amber-500/30 text-amber-200' : ''}`}>
                        {isRisky && acc.id !== 'user-profile-account' ? 'RISKY • OVERSPENT' : acc.type}
                      </div>
                      
                      {isOverdrawn && acc.id !== 'user-profile-account' && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onNavigate('insights'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest animate-pulse transition-all group/alert"
                          >
                             <AlertCircle className="w-3 h-3" /> 
                             Consult Coach
                             <ArrowRightCircle className="w-3 h-3 opacity-0 group-hover/alert:opacity-100 transition-opacity -ml-1 group-hover/alert:ml-0" />
                         </button>
                      )}

                      {isRisky && !isOverdrawn && acc.id !== 'user-profile-account' && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                              <AlertCircle className="w-3 h-3" /> AI Warning
                          </div>
                      )}
                      {acc.id === 'user-profile-account' && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                              <Wallet className="w-3 h-3" /> Net Worth
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <button 
                onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
                className="border-2 border-dashed border-slate-700/50 rounded-[2rem] flex flex-col items-center justify-center p-8 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-slate-800/30 transition-all group min-h-[240px]"
            >
                <div className="w-16 h-16 rounded-full bg-slate-800/80 group-hover:bg-indigo-500/10 flex items-center justify-center mb-5 transition-colors ring-1 ring-white/10 group-hover:ring-indigo-500/30 group-hover:scale-110 duration-300">
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="font-bold text-base">Connect Account</span>
            </button>
          </div>
        </>
      ) : (
        /* SHARED WORKSPACE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left panel: Shared Accounts */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-7 h-7 text-indigo-400" />
                  Shared Space Ledger
                </h2>
                <p className="text-slate-400 mt-1 font-medium text-sm">Joint balances managed and updated collaboratively. Only authenticated members can write edits.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingAccount(null); 
                  setIsModalOpen(true); 
                  setActiveSpace('shared');
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Joint Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sharedAccounts.map((acc) => {
                const isOverdrawn = acc.balance < 0;
                return (
                  <div key={acc.id} className="group glass-card p-6 rounded-[2rem] border border-white/5 relative overflow-hidden bg-slate-900/40 hover:border-indigo-500/35 transition-all">
                    <div 
                      className="absolute top-0 right-0 w-48 h-48 opacity-5 rounded-full blur-2xl transition-opacity group-hover:opacity-10"
                      style={{ backgroundColor: acc.color }}
                    ></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white ring-1 ring-white/10" style={{ backgroundColor: acc.color }}>
                        {getAccountIcon(acc.type)}
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                          Joint asset
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditClick(acc)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to remove joint account "${acc.name}"?`)) {
                                if (auth.currentUser) {
                                  try {
                                      await deleteDoc(doc(db, 'sharedAccounts', acc.id));
                                  } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'sharedAccounts'); }
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{acc.institution}</p>
                      <h3 className="text-lg font-black text-white">{acc.name}</h3>
                      {acc.nickname && <p className="text-xs text-slate-400 mt-1 italic">"{acc.nickname}"</p>}
                      
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white tracking-tight">
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                        <span>Updated dynamically</span>
                        <button 
                          onClick={async () => {
                            const val = parseFloat(prompt('Enter deposit amount:', '500') || '0');
                            if (val > 0 && auth.currentUser) {
                               try {
                                  await updateDoc(doc(db, 'sharedAccounts', acc.id), {
                                    balance: acc.balance + val
                                  });
                                  await addDoc(collection(db, `sharedAccounts/${acc.id}/feed`), {
                                    user: userName || 'User',
                                    action: 'deposited to',
                                    amount: val,
                                    target: acc.name,
                                    time: 'Just now',
                                    timestamp: Date.now()
                                  });
                               } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'sharedAccounts'); }
                            }
                          }}
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                        >
                          + Quick deposit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Member Hub, Invites & activity feed */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active partner list */}
            <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-900/60 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none"></div>
              
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4 font-mono">
                <Users className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Active Co-Authors
              </h3>

              <div className="space-y-4">
                {sharedMembers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    No active co-authors linked
                  </div>
                ) : (
                  sharedMembers.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-indigo-500/20 hover:scale-[1.01] transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/30 overflow-hidden`}>
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">{member.name}</div>
                          <div className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{member.role}</div>
                        </div>
                      </div>
                      {member.active ? (
                        <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Pending
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Invite Partner Box */}
              <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Invite Partner, Spouse or Advisor</h4>
                  {(detectedUser || userNotFound) && (
                    <button 
                      onClick={() => {
                        setDetectedUser(null);
                        setUserNotFound(false);
                        setInviteEmail('');
                      }} 
                      className="text-[9px] font-bold text-slate-500 hover:text-white uppercase transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {inviteSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-semibold text-center animate-fade-in space-y-1">
                    <p className="text-sm">✓ Success!</p>
                    <p className="text-[10px] opacity-80">Partnership invite processed successfully.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      checkUserExists(inviteEmail);
                    }} className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="email" 
                          required
                          placeholder="partner@example.com" 
                          value={inviteEmail}
                          onChange={e => {
                            setInviteEmail(e.target.value);
                            setDetectedUser(null);
                            setUserNotFound(false);
                          }}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          disabled={isSearchingUser}
                        />
                        {isSearchingUser && (
                          <div className="absolute right-3 top-2.5">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSearchingUser || !inviteEmail}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                      >
                        Check
                      </button>
                    </form>

                    {/* Detected User Box */}
                    {detectedUser && (
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 animate-fade-in space-y-4 text-center">
                        <div>
                          <span className="text-sm font-light text-white block tracking-wide">Member found</span>
                          <span className="text-xs text-slate-400 block mt-1 font-light">
                            {detectedUser.displayName || 'Nova Member'} is ready to share space.
                          </span>
                        </div>

                        <button 
                          type="button"
                          onClick={async () => {
                            if (!auth.currentUser) return;
                            try {
                              if (sharedAccounts.length > 0) {
                                for (const acc of sharedAccounts) {
                                  const accDocRef = doc(db, 'sharedAccounts', acc.id);
                                  const accSnap = await getDoc(accDocRef);
                                  if (accSnap.exists()) {
                                    const accData = accSnap.data();
                                    const currentMemberIds = accData.memberIds || [];
                                    if (!currentMemberIds.includes(detectedUser.uid)) {
                                      await updateDoc(accDocRef, {
                                        memberIds: [...currentMemberIds, detectedUser.uid]
                                      });
                                      await setDoc(doc(db, `sharedAccounts/${acc.id}/members`, detectedUser.uid), {
                                        uid: detectedUser.uid,
                                        name: detectedUser.displayName || detectedUser.email.split('@')[0],
                                        role: 'Partner',
                                        active: true
                                      });
                                      await addDoc(collection(db, `sharedAccounts/${acc.id}/feed`), {
                                        user: userName || 'Owner',
                                        action: 'linked shared space with',
                                        amount: 0,
                                        target: detectedUser.displayName || detectedUser.email.split('@')[0],
                                        timestamp: Date.now()
                                      });
                                    }
                                  }
                                }
                              }

                              setSharedMembers(prev => {
                                if (prev.some(p => p.uid === detectedUser.uid)) return prev;
                                return [...prev, { name: detectedUser.displayName || detectedUser.email.split('@')[0], role: 'Partner', active: true, color: 'border-white/20', avatar: '', uid: detectedUser.uid }];
                              });
                              setInviteSuccess(true);
                              setTimeout(() => {
                                setInviteSuccess(false);
                                setInviteEmail('');
                                setDetectedUser(null);
                              }, 3500);
                            } catch (err) {
                              console.error("Link error:", err);
                              setInviteSuccess(true);
                              setTimeout(() => {
                                setInviteSuccess(false);
                                setInviteEmail('');
                                setDetectedUser(null);
                              }, 3500);
                            }
                          }}
                          className="w-full bg-white text-slate-900 hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] text-xs font-medium uppercase tracking-[0.2em] py-3 rounded-xl transition-all cursor-pointer"
                        >
                          Share Space
                        </button>
                      </div>
                    )}

                    {/* Not Found User Box -> Display Gmail invite */}
                    {userNotFound && (
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 animate-fade-in space-y-4 text-center">
                        <div>
                          <span className="text-sm font-light text-white block tracking-wide">Not registered</span>
                          <span className="text-xs text-slate-400 block mt-1 font-light leading-relaxed">
                            {inviteEmail} hasn't joined Nova yet. <br/> Send an email invitation.
                          </span>
                        </div>

                        <button 
                          type="button"
                          disabled={isSendingGmail}
                          onClick={async () => {
                            setIsSendingGmail(true);
                            try {
                              const emailTo = inviteEmail.trim();
                              const subject = "Nova Joint Wealth Proposal: Manage our Money Together";
                              const bodyText = `Hi there,\n\nI am using Nova to configure our unified finances, and I want to propose that we manage our budgets, accounts, and income streams together in a collaborative Shared Space.\n\nJoin me on Nova today to link our accounts securely:\n${window.location.origin}\n\nBest regards,\n${userName || 'Your Fin-Author'}`;

                              const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                              window.open(mailtoUrl, '_blank');

                              await addDoc(collection(db, 'pendingInvites'), {
                                inviterId: auth.currentUser?.uid || 'unknown',
                                inviterName: userName || 'Nova Client',
                                inviteeEmail: emailTo.toLowerCase(),
                                createdAt: new Date().toISOString()
                              });

                              setSharedMembers(prev => {
                                if (prev.some(p => p.name === emailTo.split('@')[0])) return prev;
                                return [...prev, { name: emailTo.split('@')[0], role: 'Partner (Emailed)', active: false, color: 'border-amber-400', avatar: '' }];
                              });

                              setInviteSuccess(true);
                              setTimeout(() => {
                                setInviteSuccess(false);
                                setInviteEmail('');
                                setUserNotFound(false);
                              }, 3500);
                            } catch (e) {
                              console.error("Gmail send error:", e);
                            } finally {
                              setIsSendingGmail(false);
                            }
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] text-white text-[11px] font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                        >
                          {isSendingGmail ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              <span>Send Proposal via Gmail API</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Shared ledger log */}
            <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-900/60 font-sans">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 mb-4 font-mono">
                <History className="w-3.5 h-3.5 text-amber-400" />
                Live activity feed
              </h3>

              <div className="space-y-3">
                {sharedFeed.map((item) => (
                  <div key={item.id} className="text-xs p-2.5 rounded-xl bg-[#0f172a]/80 border border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                      <span>{item.user}</span>
                      <span>{item.time}</span>
                    </div>
                    <p className="text-slate-300 font-medium">
                      {item.action} <span className="text-white font-bold">{item.target}</span>
                      {item.amount > 0 && <span className="text-emerald-400 font-semibold ml-1">({formatCurrency(item.amount)})</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AccountModal 
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialData={editingAccount}
          isSharedByDefault={activeSpace === 'shared' || (editingAccount !== null && sharedAccounts.some(a => a.id === editingAccount.id))}
        />
      )}
    </div>
  );
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: Account, targetSpace: 'personal' | 'shared') => void;
  initialData: Account | null;
  isSharedByDefault: boolean;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSubmit, initialData, isSharedByDefault }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [institution, setInstitution] = useState(initialData?.institution || '');
  const [type, setType] = useState<Account['type']>(initialData?.type || 'Checking');
  const [balance, setBalance] = useState(initialData?.balance.toString() || '');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');
  const [targetSpace, setTargetSpace] = useState<'personal' | 'shared'>(isSharedByDefault ? 'shared' : 'personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const account: Account = {
      id: initialData?.id || (targetSpace === 'shared' ? `shared_${Date.now()}` : `acc_${Date.now()}`),
      name,
      nickname: nickname || undefined,
      institution,
      type,
      balance: parseFloat(balance) || 0,
      color
    };
    onSubmit(account, targetSpace);
  };

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
        <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up relative ring-1 ring-white/5">
            <button onClick={onClose} type="button" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10"><XCircle className="w-5 h-5" /></button>
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-900/20 to-transparent">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   {initialData ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                   {initialData ? 'Edit Account' : 'Add Account'}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Enter account details manually.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Target Space Selection */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-mono">Workspace Assignment</label>
                    <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-white/5">
                        <button 
                            type="button"
                            onClick={() => setTargetSpace('personal')}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${targetSpace === 'personal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Personal
                        </button>
                        <button 
                            type="button"
                            onClick={() => setTargetSpace('shared')}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${targetSpace === 'shared' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Shared Joint
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-2.5 text-white mt-1.5 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 text-sm" placeholder="e.g. Primary Checking" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">Nickname <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded">FOR AI</span></label>
                    <div className="relative mt-1.5">
                         <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                         <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-2.5 pl-8 text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 text-sm" placeholder="e.g. Slush Fund" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution</label>
                      <input required type="text" value={institution} onChange={e => setInstitution(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-2.5 text-white mt-1.5 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 text-sm" placeholder="e.g. Chase" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
                      <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-2.5 text-white mt-1.5 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer text-sm">
                        <option value="Checking">Checking</option>
                        <option value="Savings">Savings</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Investment">Investment</option>
                      </select>
                  </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Balance</label>
                    <div className="relative mt-1.5">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input required type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-2.5 pl-8 text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 text-sm" placeholder="0.00" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Theme Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 mt-2 active:scale-95 transition-all text-sm">
                  {initialData ? 'Update Account' : 'Create Account'}
                </button>
            </form>
        </div>
    </div>
  );
};

export default Accounts;
