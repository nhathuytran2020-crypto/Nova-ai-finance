
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  UTILITIES = 'Utilities',
  HEALTH = 'Health',
  SUBSCRIPTION = 'Subscription',
  EDUCATION = 'Education',
  TRAVEL = 'Travel',
  PETS = 'Pets',
  KIDS = 'Kids',
  GIFTS = 'Gifts',
  SERVICES = 'Services',
  INCOME = 'Income',
  SALARY = 'Salary & Wages',
  FREELANCE = 'Freelance & Side Hustles',
  TRADING = 'Trading & Stocks',
  CRYPTO = 'Crypto & Web3',
  BUSINESS = 'Business Revenue',
  CASHBACK = 'Cashback & Rewards',
  INVESTMENT = 'Investment',
  OTHER = 'Other'
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  type: TransactionType;
  accountId: string;
  notes?: string;
  tax?: number;
  isVirtual?: boolean; // New field for pre-transactions
}

export interface Account {
  id: string;
  name: string;
  nickname?: string; 
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Profile'; 
  balance: number;
  institution: string;
  color: string;
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  actionable?: boolean;
  metric?: string;
}

export interface BudgetSuggestion {
  category: string;
  current_spend: number;
  suggested_limit: number;
  reason: string;
}

export interface GoalProposal {
  id: string;
  type: 'goal' | 'budget';
  title: string;
  target_amount: number;
  reason_simple: string; 
  reason_math?: string; // Elite Only
  scenario_impact?: string; // Elite Only
  category?: string; // For budgets
  deadline?: string; // For goals
}

export interface AIAnalysisResponse {
  insights: FinancialInsight[];
  budget_suggestions: BudgetSuggestion[];
  goal_proposals: GoalProposal[];
  predicted_spend_next_month: number;
  risk_score: number; 
}

export interface SuggestedAction {
  label: string;
  actionId: string;
  payload?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sentiment?: 'info' | 'warning' | 'critical' | 'success';
  suggestedActions?: SuggestedAction[];
  chartContext?: {
    type: 'bar' | 'pie' | 'line';
    title: string;
    data: { name: string; value: number }[];
  };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  backgroundImage?: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  startDate?: string; // If set, budget tracks 30-day cycles from this date
}

export interface FinancialSnapshot {
  currentMonthMetrics: {
    income: number;
    expense: number;
    savingsRate: number;
    topExpenseCategory: string;
  };
  recentTransactions: Transaction[];
  activeGoals: Goal[];
  budgets: Budget[];
}

export type UserPlan = 'free' | 'pro' | 'ultra';

export type Language = 'en' | 'vi';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'VND';

export type BotMode = 'ruthless' | 'supportive';

export type SpendingPeriod = 'weekly' | 'monthly';

export interface SpendingStatus {
  status: 'normal' | 'warning' | 'violation';
  ratio: number;
  message: string;
  colorClass: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SimulationParams {
  monthlyExtraSpend: number;
  oneTimePurchase: number;
  extraIncome: number;
  selectedGoalId: string | null;
}

// --- NEW REPORT TYPES ---

export interface DailyReport {
  date: string;
  status: 'On Track' | 'Caution' | 'Action Needed';
  summary: string;
  details: string; // Explains *why* we got this status
  cashFlow: {
    spentToday: number;
    dailyBudget: number;
    remainingDailyBudget: number;
  };
  projections: {
    spentThisMonth: number;
    projectedMonthEnd: number;
    monthlyBudget: number;
  };
  topCategories: {
    name: string;
    amount: number;
    percentageOfSpend: number;
  }[];
  advice: string[];
}

export interface MonthlyReport {
  month: string;
  healthScore: number; // 0-100
  healthLevel: 'Strong' | 'Stable' | 'Fragile' | 'Critical';
  riskScore: number;
  metrics: {
    savingsPowerIndex: number; // SPI_M
    expenseLoadRatio: number; // ELR
    subscriptionBurdenScore: number; // SBS
    lifestyleInflationRate: number; // LIR
    dependencyIndex: number; // DI
  };
  totals: {
    income: number;
    expenses: number;
    savings: number;
    prevExpenses: number;
  };
  problems: {
    title: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  strategicPlan: {
    objective: string;
    actions: string[];
    outcome: string;
  };
  macroForecast?: string;
  markdownReport?: string;
}

export type ReportType = 'daily' | 'monthly' | null;

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  plan?: UserPlan;
  onboardingComplete?: boolean;
  hasCompletedLogTransition?: boolean;
  has_seen_transition?: boolean;
}
