
import { Account, Category, Transaction, TransactionType, Goal, Budget } from './types';
import { CreditCard, Wallet, Sparkles, Target, Landmark, CreditCard as BillingIcon, Settings, Microscope, Rocket, GitFork, Handshake, TrendingUp, Cpu } from 'lucide-react';

export const ACCOUNTS: Account[] = [];

export const INITIAL_GOALS: Goal[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'accounts', label: 'Accounts', icon: Landmark },
  { id: 'insights', label: 'Financial Coach', icon: Sparkles },
  { id: 'smart_money', label: 'Smart Money', icon: Cpu },
  { id: 'goals', label: 'Goals & Budgets', icon: Target },
  { id: 'plans', label: 'Plans & Billing', icon: BillingIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    smart_money: 'Smart Money',
    insights: 'Financial Coach',
    goals: 'Goals & Budgets',
    plans: 'Plans & Billing',
    settings: 'Settings',
    netWorth: 'Net Worth',
    monthlySpend: 'Monthly Spend',
    signOut: 'Sign Out',
    planFree: 'Free Plan',
    planPro: 'Pro Plan'
  },
  vi: {
    dashboard: 'Trang chủ',
    transactions: 'Giao dịch',
    accounts: 'Tài khoản',
    smart_money: 'Tiền Thông Minh',
    insights: 'Trợ lý AI',
    goals: 'Mục tiêu & Ngân sách',
    plans: 'Gói & Thanh toán',
    settings: 'Cài đặt',
    netWorth: 'Tài sản ròng',
    monthlySpend: 'Chi tiêu tháng',
    signOut: 'Đăng xuất',
    planFree: 'Gói Miễn phí',
    planPro: 'Gói Cao cấp'
  }
};
