
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, deleteDoc } from 'firebase/firestore';
import { Account, Budget, Goal, Transaction, UserPlan, ToastMessage, BotMode, Currency, Language, TransactionType, SpendingPeriod, SpendingStatus, ReportType } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_GOALS, NAV_ITEMS, TRANSLATIONS } from './constants';
import { evaluateSpending } from './services/ruleEngine';
import Dashboard from './components/Dashboard';

// Lazy load non-critical components
const Transactions = lazy(() => import('./components/Transactions'));
const Accounts = lazy(() => import('./components/Accounts'));
const Insights = lazy(() => import('./components/Insights'));
const Goals = lazy(() => import('./components/Goals'));
const Plans = lazy(() => import('./components/Plans'));
const Settings = lazy(() => import('./components/Settings'));
const SmartMoney = lazy(() => import('./components/SmartMoney'));
const Investment = lazy(() => import('./components/Investment'));
const UpcomingFeatures = lazy(() => import('./components/UpcomingFeatures'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const FirstTransactionOnboarding = lazy(() => import('./components/FirstTransactionOnboarding'));
const FirstAccountOnboarding = lazy(() => import('./components/FirstAccountOnboarding'));
const FloatingAssistant = lazy(() => import('./components/FloatingAssistant'));

import ToastContainer from './components/Toast';
import MobileNav from './components/MobileNav';
import { FoxLogo } from './components/FoxLogo';
import { Sparkles, LogOut, Zap, Shield, EyeOff, LayoutDashboard, CreditCard, Landmark, Target, Settings as SettingsIcon, Lock, Eye } from 'lucide-react';

const getMonthlyUsage = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return 0;
        const parsed = JSON.parse(item);
        const now = new Date();
        if (parsed.month !== now.getMonth() || parsed.year !== now.getFullYear()) return 0;
        return parsed.count || 0;
    } catch (e) { return 0; }
};

const safeSetItem = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch (e) { console.warn(`Storage quota exceeded for ${key}`); }
};

const PINNABLE_FEATURES = ['budget-monitor', 'sandbox-link', 'goal-tracker', 'system-alerts', 'neural-quota'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smartMoneyTab, setSmartMoneyTab] = useState('burn_vector');
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => localStorage.getItem('nova_privacy_mode') === 'true');
  const [isPinMode, setIsPinMode] = useState(false);
  const [autoScanTrigger, setAutoScanTrigger] = useState(false);
  
  const [hasCompletedLogTransition, setHasCompletedLogTransition] = useState(() => {
    const direct = localStorage.getItem('nova_has_completed_log_transition');
    const legacy = localStorage.getItem('nova_onboarding_complete');
    return direct === 'true' || legacy === 'true';
  });
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    const direct = localStorage.getItem('nova_has_completed_log_transition');
    const legacy = localStorage.getItem('nova_onboarding_complete');
    return direct === 'true' || legacy === 'true';
  });
  
  const [spendingLimit, setSpendingLimit] = useState<number>(() => {
      const stored = localStorage.getItem('nova_spending_limit');
      if (!stored) return 1000;
      const parsed = parseFloat(stored);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
  });

  const [spendingPeriod, setSpendingPeriod] = useState<SpendingPeriod>(() => (localStorage.getItem('nova_spending_period') as SpendingPeriod) || 'monthly');

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('nova_pinned_ids');
        return saved ? JSON.parse(saved) : []; 
    } catch { return []; }
  });
  
  const [featureUsage, setFeatureUsage] = useState<Record<string, number>>(() => {
      try {
          const saved = localStorage.getItem('nova_feature_usage');
          return saved ? JSON.parse(saved) : {};
      } catch { return {}; }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
      const saved = localStorage.getItem('nova_accounts');
      return saved ? JSON.parse(saved) : ACCOUNTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('nova_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [budgets, setBudgets] = useState<Budget[]>(() => {
      const saved = localStorage.getItem('nova_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
      const saved = localStorage.getItem('nova_goals');
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [userPlan, setUserPlan] = useState<UserPlan>(() => localStorage.getItem('nova_user_plan') as UserPlan || 'free');
  const [insightUsage, setInsightUsage] = useState(() => getMonthlyUsage('nova_insight_usage'));
  const [scanUsage, setScanUsage] = useState(() => getMonthlyUsage('nova_scan_usage'));
  const [negotiationUsage, setNegotiationUsage] = useState(() => getMonthlyUsage('nova_negotiation_usage'));

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Firebase Auth Listener
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('the client is offline') || error?.code === 'unavailable') {
          console.warn("Firestore connection check noted: Operating in offline/cached mode.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        
        // Sync protocol-locked identity from Auth Provider
        if (user.email) {
          setUserEmail(user.email);
          localStorage.setItem('nova_user_email', user.email);
        }

        // Fast-path check from user-specific local storage cache first
        const localTransition = localStorage.getItem(`nova_has_completed_log_transition_${user.uid}`);
        const localOnboarding = localStorage.getItem(`nova_onboarding_complete_${user.uid}`);
        if (localTransition === 'true' || localOnboarding === 'true') {
          setHasCompletedLogTransition(true);
          setOnboardingComplete(true);
          setActiveTab('dashboard');
        }

        // Sync and verify user profile in Firestore database
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.displayName) setUserName(data.displayName);
            else if (user.displayName) {
                // Default to Auth Display Name if Firestore is empty
                setUserName(user.displayName);
                localStorage.setItem('nova_user_name', user.displayName);
            }
            
            // Check transition / onboarding flag in DB profile
            const isCompleted = Boolean(
              data.hasCompletedLogTransition === true || 
              data.has_seen_transition === true || 
              data.onboardingComplete === true
            );

            if (isCompleted) {
              // Bypass log transition screens entirely and direct to main dashboard
              setHasCompletedLogTransition(true);
              setOnboardingComplete(true);
              setActiveTab('dashboard');
              localStorage.setItem(`nova_has_completed_log_transition_${user.uid}`, 'true');
              localStorage.setItem('nova_has_completed_log_transition', 'true');
              localStorage.setItem(`nova_onboarding_complete_${user.uid}`, 'true');
              localStorage.setItem('nova_onboarding_complete', 'true');
            } else if (data.hasCompletedLogTransition === false && data.onboardingComplete === false) {
              setHasCompletedLogTransition(false);
              setOnboardingComplete(false);
              localStorage.removeItem(`nova_has_completed_log_transition_${user.uid}`);
              localStorage.removeItem('nova_has_completed_log_transition');
              localStorage.removeItem(`nova_onboarding_complete_${user.uid}`);
              localStorage.removeItem('nova_onboarding_complete');
            }

            if (data.plan) setUserPlan(data.plan);
          } else if (user.displayName && (userName === 'Pilot' || !userName)) {
              // Fallback for new users without a document yet
              setUserName(user.displayName);
              localStorage.setItem('nova_user_name', user.displayName);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setIsLoggedIn(false);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [botMode, setBotMode] = useState<BotMode>(() => (localStorage.getItem('nova_bot_mode') as BotMode) || 'ruthless');
  const [pendingChatQuery, setPendingChatQuery] = useState<string | null>(null);
  
  const [userName, setUserName] = useState(() => localStorage.getItem('nova_user_name') || 'Pilot');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('nova_user_email') || 'pilot@nova.io');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('nova_user_avatar') || '');
  const [userAvatarZoom, setUserAvatarZoom] = useState(() => parseFloat(localStorage.getItem('nova_user_avatar_zoom') || '1'));
  const [userAvatarPos, setUserAvatarPos] = useState(() => {
      try {
          const saved = localStorage.getItem('nova_user_avatar_pos');
          return saved ? JSON.parse(saved) : { x: 0, y: 0 };
      } catch { return { x: 0, y: 0 }; }
  });
  const [userBorder, setUserBorder] = useState(() => localStorage.getItem('nova_user_border') || 'default');
  const [userBackground, setUserBackground] = useState(() => localStorage.getItem('nova_user_bg') || '');
  
  const calculatedCreditScore = useMemo(() => {
      if (accounts.length === 0 && transactions.length === 0) return 0;
      
      let score = 700; // Base score
      
      // 1. Asset & Net Worth Health
      const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
      if (totalBalance > 100000) score += 40;
      else if (totalBalance > 25000) score += 20;
      else if (totalBalance > 5000) score += 10;
      else if (totalBalance < 0) score -= 40;

      // 2. Debt / Utilization Analysis
      const debtAccounts = accounts.filter(a => a.type === 'Credit Card' || a.balance < 0);
      const totalDebt = debtAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
      const liquidAccounts = accounts.filter(a => a.type === 'Checking' || a.type === 'Savings');
      const totalLiquid = liquidAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

      if (totalDebt > 0) {
          const debtRatio = totalDebt / (totalLiquid || 1);
          if (debtRatio > 0.8) score -= 50;
          else if (debtRatio > 0.4) score -= 25;
          else if (debtRatio < 0.1) score += 15;
      } else if (accounts.length > 0) {
          score += 25; // Good standing with no debt
      }

      // 3. Payment / Transaction Behavior
      const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      
      if (income > 0) {
          if (expense < income * 0.5) score += 35;
          else if (expense > income * 0.85) score -= 35;
      }
      
      if (transactions.length > 50) score += 15;

      return Math.min(850, Math.max(300, Math.round(score)));
  }, [accounts, transactions]);

  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('nova_currency') as Currency) || 'USD');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('nova_language') as Language) || 'en');

  // Persistence
  useEffect(() => safeSetItem('nova_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => safeSetItem('nova_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => safeSetItem('nova_budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => safeSetItem('nova_goals', JSON.stringify(goals)), [goals]);
  useEffect(() => {
    safeSetItem('nova_user_plan', userPlan);
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), {
        plan: userPlan
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
      });
    }
  }, [userPlan]);
  useEffect(() => safeSetItem('nova_currency', currency), [currency]);
  useEffect(() => safeSetItem('nova_language', language), [language]);
  useEffect(() => safeSetItem('nova_bot_mode', botMode), [botMode]);
  useEffect(() => safeSetItem('nova_privacy_mode', isPrivacyMode.toString()), [isPrivacyMode]);
  useEffect(() => safeSetItem('nova_pinned_ids', JSON.stringify(pinnedIds)), [pinnedIds]);
  useEffect(() => safeSetItem('nova_feature_usage', JSON.stringify(featureUsage)), [featureUsage]);
  useEffect(() => safeSetItem('nova_spending_limit', spendingLimit.toString()), [spendingLimit]);
  useEffect(() => safeSetItem('nova_spending_period', spendingPeriod), [spendingPeriod]);
  useEffect(() => safeSetItem('nova_user_bg', userBackground), [userBackground]);

  // Derived State
  const currentPeriodSpend = useMemo(() => {
      const now = new Date();
      return transactions
        .filter(t => {
            const d = new Date(t.date);
            if (t.type !== TransactionType.EXPENSE) return false;
            
            if (spendingPeriod === 'monthly') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } else {
                // Weekly logic: simple 7 day lookback for now
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return d >= oneWeekAgo && d <= now;
            }
        })
        .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, spendingPeriod]);

  const spendingStatus = useMemo(() => evaluateSpending(currentPeriodSpend, spendingLimit), [currentPeriodSpend, spendingLimit]);

  // Enhanced Format Currency with Privacy Logic
  const formatCurrency = (amount: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const addToast = (message: string, type: ToastMessage['type'] = 'info', action?: ToastMessage['action']) => {
    setToasts(prev => [...prev, { id: Date.now().toString(), type, message, action }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigate = (tab: string, params?: any) => {
    setActiveTab(tab);
    if (tab === 'smart_money' && params?.tab) {
        setSmartMoneyTab(params.tab);
    }
    if (tab === 'insights' && params?.reportType) {
        setActiveReport(params.reportType);
    }
  };

  const markLogTransitionComplete = async (additionalProfileData: Partial<{ displayName: string; language: Language; period: SpendingPeriod; limit: number }> = {}) => {
    setHasCompletedLogTransition(true);
    setOnboardingComplete(true);
    setActiveTab('dashboard');
    localStorage.setItem('nova_has_completed_log_transition', 'true');
    localStorage.setItem('nova_onboarding_complete', 'true');

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      localStorage.setItem(`nova_has_completed_log_transition_${uid}`, 'true');
      localStorage.setItem(`nova_onboarding_complete_${uid}`, 'true');
      try {
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: auth.currentUser.email || userEmail || '',
          hasCompletedLogTransition: true,
          has_seen_transition: true,
          onboardingComplete: true,
          plan: userPlan,
          ...(additionalProfileData.displayName ? { displayName: additionalProfileData.displayName } : {}),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
  };

  const handleAddAccount = (newAccount: Account) => {
      setAccounts(prev => [...prev, newAccount]);
      addToast('Account established successfully', 'success');
  };

  const handleAddTransaction = (newTx: Transaction) => {
      setTransactions(prev => [newTx, ...prev]);
      
      if (!newTx.isVirtual) {
          const accIndex = accounts.findIndex(a => a.id === newTx.accountId);
          if (accIndex >= 0) {
              const updatedAccounts = [...accounts];
              if (newTx.type === TransactionType.INCOME) {
                  updatedAccounts[accIndex].balance += newTx.amount;
              } else {
                  updatedAccounts[accIndex].balance -= newTx.amount;
              }
              setAccounts(updatedAccounts);
          }
      }
      addToast(newTx.isVirtual ? 'Planned pre-transaction recorded' : 'Transaction recorded successfully', 'success');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
      let oldTx: Transaction | undefined;
      setTransactions(prev => {
          oldTx = prev.find(t => t.id === updatedTx.id);
          return prev.map(t => t.id === updatedTx.id ? updatedTx : t);
      });

      // Update account balance if amount or virtual status changed
      setAccounts(prevAccounts => {
          if (!oldTx) return prevAccounts;
          const newAccs = [...prevAccounts];
          const oldAccIdx = newAccs.findIndex(a => a.id === oldTx!.accountId);
          const newAccIdx = newAccs.findIndex(a => a.id === updatedTx.accountId);

          // 1. Revert old non-virtual balance effect
          if (!oldTx.isVirtual && oldAccIdx >= 0) {
              if (oldTx.type === TransactionType.INCOME) {
                  newAccs[oldAccIdx].balance -= oldTx.amount;
              } else {
                  newAccs[oldAccIdx].balance += oldTx.amount;
              }
          }

          // 2. Apply new non-virtual balance effect
          if (!updatedTx.isVirtual && newAccIdx >= 0) {
              if (updatedTx.type === TransactionType.INCOME) {
                  newAccs[newAccIdx].balance += updatedTx.amount;
              } else {
                  newAccs[newAccIdx].balance -= updatedTx.amount;
              }
          }

          return newAccs;
      });

      addToast(updatedTx.isVirtual ? 'Pre-transaction updated' : 'Transaction updated successfully', 'success');
  };

  const handleDeleteTransaction = (id: string) => {
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;

      // 1. Remove from state
      setTransactions(prev => prev.filter(t => t.id !== id));

      // 2. Revert Balance (only if NOT virtual!)
      if (!tx.isVirtual) {
          const accIndex = accounts.findIndex(a => a.id === tx.accountId);
          if (accIndex >= 0) {
              const updatedAccounts = [...accounts];
              if (tx.type === TransactionType.INCOME) updatedAccounts[accIndex].balance -= tx.amount;
              else updatedAccounts[accIndex].balance += tx.amount;
              setAccounts(updatedAccounts);
          }
      }

      // 3. Show Toast with Undo
      addToast('Transaction deleted', 'info', {
          label: 'Undo',
          onClick: () => {
              // Restore Transaction
              setTransactions(prev => [tx, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
              
              // Restore Balance (if not virtual)
              if (!tx.isVirtual) {
                  setAccounts(prevAccounts => {
                      const newAccs = [...prevAccounts];
                      const idx = newAccs.findIndex(a => a.id === tx.accountId);
                      if (idx >= 0) {
                          if (tx.type === TransactionType.INCOME) newAccs[idx].balance += tx.amount;
                          else newAccs[idx].balance -= tx.amount;
                      }
                      return newAccs;
                  });
              }
              addToast('Transaction restored', 'success');
          }
      });
  };

  const handleUpdateProfile = (name: string, _email: string, avatar: string, zoom: number, pos: {x:number, y:number}, border: string) => {
      setUserName(name);
      setUserAvatar(avatar);
      setUserAvatarZoom(zoom);
      setUserAvatarPos(pos);
      setUserBorder(border);
      localStorage.setItem('nova_user_name', name);
      localStorage.setItem('nova_user_avatar', avatar);
      localStorage.setItem('nova_user_avatar_zoom', zoom.toString());
      localStorage.setItem('nova_user_avatar_pos', JSON.stringify(pos));
      localStorage.setItem('nova_user_border', border);
  };

  const handleIncrementUsage = (type: 'insight' | 'scan' | 'negotiation', amount = 1) => {
      const key = `nova_${type}_usage`;
      const now = new Date();
      const current = type === 'insight' ? insightUsage : type === 'scan' ? scanUsage : negotiationUsage;
      const newVal = current + amount;
      
      const record = { count: newVal, month: now.getMonth(), year: now.getFullYear() };
      localStorage.setItem(key, JSON.stringify(record));
      
      if (type === 'insight') setInsightUsage(newVal);
      else if (type === 'scan') setScanUsage(newVal);
      else setNegotiationUsage(newVal);
  };

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
              accounts={accounts} 
              transactions={transactions} 
              goals={goals} 
              budgets={budgets} 
              onNavigate={handleNavigate}
              onAddTransaction={() => handleNavigate('transactions')}
              onAddGoal={() => handleNavigate('goals')}
              formatCurrency={formatCurrency}
              userPlan={userPlan}
              onAskCoach={(q) => { setPendingChatQuery(q); handleNavigate('insights'); }}
              insightUsage={insightUsage}
              spendingStatus={spendingStatus}
              currentPeriodSpend={currentPeriodSpend}
              spendingLimit={spendingLimit}
              spendingPeriod={spendingPeriod}
              userName={userName}
              isPrivacyMode={isPrivacyMode}
              onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
              creditScore={calculatedCreditScore}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onAddTransactionObject={handleAddTransaction}
              currency={currency}
          />
        );
      case 'transactions':
        return (
          <Transactions 
              transactions={transactions}
              accounts={accounts}
              onDelete={handleDeleteTransaction}
              onAdd={handleAddTransaction}
              formatCurrency={formatCurrency}
              onNavigateToAccounts={() => handleNavigate('accounts')}
              userPlan={userPlan}
              scanUsage={scanUsage}
              onIncrementScan={() => handleIncrementUsage('scan')}
              currency={currency}
          />
        );
      case 'accounts':
        return (
          <Accounts 
              accounts={accounts}
              budgets={budgets}
              transactions={transactions}
              userPlan={userPlan}
              onAdd={(acc) => setAccounts(prev => [...prev, acc])}
              onUpdate={(acc) => setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a))}
              onDelete={(id) => setAccounts(prev => prev.filter(a => a.id !== id))}
              formatCurrency={formatCurrency}
              userName={userName}
              userAvatar={userAvatar}
              userAvatarZoom={userAvatarZoom}
              userAvatarPos={userAvatarPos}
              userBorder={userBorder}
              onNavigate={handleNavigate}
          />
        );
      case 'insights':
        return (
          <Insights 
              transactions={transactions}
              goals={goals}
              budgets={budgets}
              userPlan={userPlan}
              onUpgradeClick={() => handleNavigate('plans')}
              formatCurrency={formatCurrency}
              initialPrompt={pendingChatQuery}
              onPromptHandled={() => setPendingChatQuery(null)}
              onApplyBudgets={(newBudgets) => setBudgets(prev => [...prev, ...newBudgets])}
              insightUsage={insightUsage}
              onIncrementUsage={() => handleIncrementUsage('insight')}
              botMode={botMode}
              onNavigate={handleNavigate}
              onAddGoal={(g) => setGoals(prev => [...prev, g])}
              autoScanTriggered={autoScanTrigger}
              activeReport={activeReport}
              spendingLimit={spendingLimit}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'smart_money':
        return (
          <SmartMoney 
              initialTab={smartMoneyTab}
              transactions={transactions}
              accounts={accounts}
              goals={goals}
              formatCurrency={formatCurrency}
              userPlan={userPlan}
              onUpgradeClick={() => handleNavigate('plans')}
              insightUsage={insightUsage}
              onIncrementUsage={(n) => handleIncrementUsage('insight', n)}
              negotiationUsage={negotiationUsage}
              onIncrementNegotiationUsage={() => handleIncrementUsage('negotiation')}
          />
        );
      case 'goals':
        return (
          <Goals 
              goals={goals}
              budgets={budgets}
              transactions={transactions}
              onAddGoal={(g) => setGoals(prev => [...prev, g])}
              onUpdateGoal={(g) => setGoals(prev => prev.map(goal => goal.id === g.id ? g : goal))}
              onAddBudget={(b) => setBudgets(prev => [...prev, b])}
              onDeleteBudget={(id) => setBudgets(prev => prev.filter(b => b.id !== id))}
              formatCurrency={formatCurrency}
          />
        );
      case 'plans':
        return (
          <Plans 
              currentPlan={userPlan}
              onUpgrade={(plan) => setUserPlan(plan)}
              onDowngrade={() => setUserPlan('free')}
              onNavigateDashboard={() => handleNavigate('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings 
              userName={userName}
              userEmail={userEmail}
              userAvatar={userAvatar}
              userAvatarZoom={userAvatarZoom}
              userAvatarPos={userAvatarPos}
              userBorder={userBorder}
              userBackground={userBackground}
              onUpdateBackground={(bg) => setUserBackground(bg)}
              userPlan={userPlan}
              onUpdateProfile={handleUpdateProfile}
              addToast={addToast}
              onExportData={() => {
                  const data = { accounts, transactions, budgets, goals, userPlan };
                  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `nova_backup_${new Date().toISOString()}.json`;
                  a.click();
              }}
              onImportData={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                      try {
                          const data = JSON.parse(e.target?.result as string);
                          if (data.accounts) setAccounts(data.accounts);
                          if (data.transactions) setTransactions(data.transactions);
                          if (data.budgets) setBudgets(data.budgets);
                          if (data.goals) setGoals(data.goals);
                          addToast('Data restored successfully', 'success');
                      } catch (err) {
                          addToast('Invalid backup file', 'error');
                      }
                  };
                  reader.readAsText(file);
              }}
              onClearData={async () => {
                  try {
                      if (auth.currentUser) {
                          await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                      }
                  } catch (e) {
                      console.warn("Failed to delete cloud user data:", e);
                  }
                  // Clear all keys from local storage
                  Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('nova_') || key.startsWith('cat-')) {
                          localStorage.removeItem(key);
                      }
                  });
                  // Reset all React states to original values
                  setAccounts(ACCOUNTS);
                  setTransactions(INITIAL_TRANSACTIONS);
                  setBudgets(INITIAL_BUDGETS);
                  setGoals(INITIAL_GOALS);
                  setSpendingLimit(0);
                  setSpendingPeriod('monthly');
                  setCurrency('USD');
                  setLanguage('en');
                  setIsPrivacyMode(false);
                  setBotMode('ruthless');
                  setUserPlan('free');
                  setOnboardingComplete(false);
                  
                  if (auth.currentUser) {
                      try {
                          await signOut(auth);
                      } catch (e) {
                          console.warn(e);
                      }
                  }
                  addToast('System reset complete. All data purged and session locked.', 'info');
              }}
              language={language}
              onUpdateLanguage={setLanguage}
              currency={currency}
              onUpdateCurrency={setCurrency}
              botMode={botMode}
              onUpdateBotMode={setBotMode}
              onDowngrade={() => setUserPlan('free')}
              spendingLimit={spendingLimit}
              onUpdateSpendingLimit={setSpendingLimit}
              spendingPeriod={spendingPeriod}
              onUpdateSpendingPeriod={setSpendingPeriod}
          />
        );
      case 'investment':
        return (
          <Investment 
              accounts={accounts}
              formatCurrency={formatCurrency}
              userPlan={userPlan}
          />
        );
      case 'upcoming':
        return <UpcomingFeatures />;
      default:
        return null;
    }
  }, [activeTab, accounts, transactions, goals, budgets, userPlan, insightUsage, spendingStatus, currentPeriodSpend, spendingLimit, spendingPeriod, userName, isPrivacyMode, calculatedCreditScore, currency, smartMoneyTab, pendingChatQuery, autoScanTrigger, activeReport, botMode, userEmail, userAvatar, userAvatarZoom, userAvatarPos, userBorder, userBackground, language]);

  if (authLoading) {
      return (
          <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30">
                      <FoxLogo className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading Environment</div>
              </div>
          </div>
      );
  }

  if (!isLoggedIn) {
      return (
          <Suspense fallback={
            <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
              <div className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading Environment</div>
            </div>
          }>
            <LandingPage onLoginSuccess={(name) => {
                addToast(`Vault recognized. Synchronizing...`, 'success');
            }} />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
          </Suspense>
      );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden" 
         style={{ backgroundImage: userBackground ? `url(${userBackground})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        
        {/* Dark Overlay for Readability if Background is set */}
        {userBackground && <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-[2px] z-0"></div>}

        {/* MODERN GLASS SIDEBAR - Only render if onboarding / log transition is complete */}
        {(hasCompletedLogTransition || onboardingComplete) && (
            <div className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 w-24 hover:w-80 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] bg-[#0f172a]/60 backdrop-blur-2xl border-r border-white/5 shadow-[10px_0_40px_rgba(0,0,0,0.5)] group overflow-hidden">
                
                {/* Logo Section */}
                <div className="h-28 flex items-center px-6 shrink-0 relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 z-20 ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                        <FoxLogo className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap">
                        <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">NOVA<span className="text-indigo-400">.OS</span></h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-0.5">Finance Core</p>
                    </div>
                    
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-6 -translate-y-1/2 w-20 h-20 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-2 custom-scrollbar py-4">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`relative w-full flex items-center h-14 rounded-[1.2rem] transition-all duration-300 group/item overflow-hidden ${
                                activeTab === item.id 
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>

                            {/* Icon Container */}
                            <div className="w-16 h-full flex items-center justify-center shrink-0 relative z-10">
                                <item.icon className={`w-6 h-6 transition-all duration-500 ${
                                    activeTab === item.id 
                                    ? 'text-white scale-110 drop-shadow-md' 
                                    : 'group-hover/item:text-indigo-300 group-hover/item:scale-110'
                                }`} />
                            </div>

                            {/* Text Label */}
                            <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap font-bold text-sm tracking-wide relative z-10 flex items-center gap-2">
                                {TRANSLATIONS[language]?.[item.id as keyof typeof TRANSLATIONS['en']] || item.label}
                            </div>
                        </button>
                    ))}
                </nav>

                {/* Privacy Mode Toggle - Above User Profile */}
                <div className="px-4 pb-2 pt-2 mt-auto">
                    <button 
                        onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                        className={`w-full flex items-center h-12 rounded-xl transition-all ${isPrivacyMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        <div className="w-16 flex items-center justify-center shrink-0">
                             {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </div>
                        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            Privacy {isPrivacyMode ? 'On' : 'Off'}
                        </span>
                    </button>
                </div>

                {/* User Footer */}
                <div className="px-5 pb-8 mt-4">
                    <div 
                        onClick={() => handleNavigate('settings')}
                        className="relative p-2 w-full overflow-hidden rounded-[1.2rem] bg-slate-900 border border-white/5 cursor-pointer transition-all duration-300 hover:bg-slate-800 hover:border-white/10 group/profile flex items-center gap-3"
                    >
                        {/* Avatar / Icon Container */}
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center ml-1">
                            <div className="w-10 h-10 rounded-[0.8rem] bg-slate-800 overflow-hidden shadow-inner ring-1 ring-white/10 flex items-center justify-center relative">
                                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <div className="text-white font-black bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex justify-center items-center text-sm">{userName.charAt(0)}</div>}
                            </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 whitespace-nowrap">
                            <div className="font-bold text-white text-sm truncate leading-tight">{userName}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{userPlan} Pilot</div>
                        </div>

                        {/* Logout Button */}
                        <div className="shrink-0 mr-1 opacity-0 group-hover/profile:opacity-100 transition-all duration-300 translate-x-2 group-hover/profile:translate-x-0 z-10">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsLogoutModalOpen(true); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-all shadow-lg"
                                title="Logout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col relative z-10 overflow-hidden ${(hasCompletedLogTransition || onboardingComplete) ? 'md:pl-24' : ''} transition-all duration-300`}>
            {/* Mobile Header - Only render if onboarding / log transition is complete */}
            {(hasCompletedLogTransition || onboardingComplete) && (
                <div className="md:hidden h-16 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                            <FoxLogo className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white tracking-tight">Nova</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setAutoScanTrigger(true)} className="p-2 bg-slate-800 rounded-full text-indigo-400"><Zap className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            <main className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${activeTab === 'smart_money' ? 'p-0' : 'p-4 md:p-6'}`}>
                <div className="w-full max-w-[1920px] mx-auto h-full">
                    <Suspense fallback={
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading View</div>
                      </div>
                    }>
                        {tabContent}
                    </Suspense>
                </div>
            </main>

            {isLoggedIn && (!hasCompletedLogTransition || !onboardingComplete) && (
              <Suspense fallback={null}>
                <OnboardingModal onComplete={async (name, lang, period, limit) => {
                    setUserName(name);
                    setLanguage(lang);
                    setSpendingPeriod(period);
                    setSpendingLimit(limit);
                    
                    await markLogTransitionComplete({
                      displayName: name,
                      language: lang,
                      period,
                      limit
                    });

                    addToast("Core initialized. Welcome to Nova.", "success");
                }} />
              </Suspense>
            )}

            {/* FIRST ACCOUNT ONBOARDING - Triggers after profile setup if NOT completed log transition and NO accounts exist */}
            {isLoggedIn && !hasCompletedLogTransition && accounts.length === 0 && (
              <Suspense fallback={null}>
                <FirstAccountOnboarding onAdd={handleAddAccount} userName={userName} />
              </Suspense>
            )}

            {/* FIRST TRANSACTION ONBOARDING - Triggers after profile setup AND account creation if no transactions exist and transition not complete */}
            {isLoggedIn && !hasCompletedLogTransition && accounts.length > 0 && transactions.length === 0 && (
              <Suspense fallback={null}>
                <FirstTransactionOnboarding 
                    onAdd={(newTx) => {
                        handleAddTransaction(newTx);
                        markLogTransitionComplete();
                    }} 
                    userName={userName} 
                    accounts={accounts}
                />
              </Suspense>
            )}

            {/* Mobile Nav - Only render if onboarding is complete */}
            {(hasCompletedLogTransition || onboardingComplete) && (
                <MobileNav 
                    activeTab={activeTab} 
                    onNavigate={handleNavigate} 
                    onAddTransaction={() => handleNavigate('transactions')} 
                    language={language}
                />
            )}
            
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            
            {/* Floating Assistant - Only render if onboarding is complete */}
            {(hasCompletedLogTransition || onboardingComplete) && (
              <Suspense fallback={null}>
                <FloatingAssistant 
                    transactions={transactions} 
                    budgets={budgets} 
                    userPlan={userPlan} 
                    botMode={botMode}
                    onOpenChat={(q) => { setPendingChatQuery(q); handleNavigate('insights'); }}
                    isVisible={activeTab !== 'insights'}
                    insightUsage={insightUsage}
                />
              </Suspense>
            )}

            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-bold text-white mb-2">Sign Out?</h3>
                        <p className="text-slate-400 text-sm mb-6">Your data is saved, but you'll need to sign in again to access your account.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsLogoutModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white font-medium">Cancel</button>
                            <button 
                                onClick={async () => {
                                    try {
                                        await signOut(auth);
                                        setOnboardingComplete(false);
                                        setHasCompletedLogTransition(false);
                                        setIsLogoutModalOpen(false);
                                        addToast("Session terminated. Vault locked.", "info");
                                    } catch (err) {
                                        addToast("Failed to logout", "error");
                                    }
                                }} 
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-lg"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;
