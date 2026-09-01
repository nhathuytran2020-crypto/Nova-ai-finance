import { Transaction, TransactionType, Category, DailyReport, MonthlyReport } from '../types';

// --- HELPERS ---

const getTransactionsByDate = (transactions: Transaction[], date: Date) => {
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.toDateString() === date.toDateString();
    });
};

const getTransactionsByMonth = (transactions: Transaction[], month: number, year: number) => {
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
};

// --- DAILY ENGINE ---

export const generateDailyReport = (transactions: Transaction[], spendingLimit: number, today: Date = new Date()): DailyReport => {
    const todayTxs = getTransactionsByDate(transactions, today);
    
    const incomeToday = todayTxs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expenseToday = todayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    // Daily Budget Proxy (Monthly / 30)
    const dailyBudget = Math.max(1, spendingLimit / 30);

    // 7-Day Average (excluding today)
    let sum7d = 0;
    for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayTxs = getTransactionsByDate(transactions, d);
        sum7d += dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    }
    const avg7dSpend = Math.max(1, sum7d / 7);

    // Metrics
    const SPI = expenseToday / dailyBudget;
    const MD = (expenseToday - avg7dSpend) / avg7dSpend;
    
    // Category Spike
    const catMap: Record<string, number> = {};
    todayTxs.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const maxCatSpend = Math.max(0, ...Object.values(catMap));
    const CSR = expenseToday > 0 ? maxCatSpend / expenseToday : 0;
    
    // Noise (Micro transactions < $10)
    const TNI = todayTxs.filter(t => t.type === TransactionType.EXPENSE && t.amount < 10).length;

    // Risk Score Calculation
    // SPI * 40 + abs(MD) * 30 + CSR * 20 + normalize(TNI) * 10
    // Normalize TNI: assume 5 is high (1.0), 0 is 0.
    const normTNI = Math.min(1, TNI / 5);
    const riskScore = Math.min(100, (SPI * 40) + (Math.abs(MD) * 30) + (CSR * 20) + (normTNI * 10));

    let riskLevel: 'Stable' | 'Warning' | 'Critical' = 'Stable';
    if (riskScore >= 60) riskLevel = 'Critical';
    else if (riskScore >= 30) riskLevel = 'Warning';

    // Signals
    const signals: { type: string; title: string; description: string }[] = [];
    
    if (SPI > 1) {
        signals.push({ type: 'overspend', title: 'Overspend', description: `Spend is ${(SPI * 100).toFixed(0)}% of daily capacity.` });
    }
    if (MD > 0.3) {
        signals.push({ type: 'spike', title: 'Spending Spike', description: `Momentum is +${(MD * 100).toFixed(0)}% vs 7-day average.` });
    }
    if (TNI >= 4) {
        signals.push({ type: 'micro_leak', title: 'Leak Pattern', description: `${TNI} micro-transactions detected today.` });
    }
    
    // Habit Drift (Simple: Same category max for last 3 days?)
    // Simplified: If CSR > 0.6 (60% on one category)
    if (CSR > 0.6) {
        const topCat = Object.entries(catMap).find(e => e[1] === maxCatSpend)?.[0] || 'Unknown';
        signals.push({ type: 'habit_drift', title: 'Category Fixation', description: `${topCat} consumed ${(CSR * 100).toFixed(0)}% of output.` });
    }

    if (signals.length === 0) {
        signals.push({ type: 'stable', title: 'System Nominal', description: 'No anomalies detected in daily flow.' });
    }

    // Action Logic
    let internalAction: { priority: 'low' | 'medium' | 'high'; text: string; effect: string } = { priority: 'low', text: 'Maintain course.', effect: 'Stable trajectory.' };
    
    if (riskLevel === 'Critical') {
        internalAction = {
            priority: 'high',
            text: `Cap discretionary spend at $${(dailyBudget * 0.5).toFixed(0)} tomorrow.`,
            effect: 'Stabilize 7-day momentum.'
        };
    } else if (riskLevel === 'Warning') {
        if (MD > 0) {
            internalAction = { priority: 'medium', text: 'Zero-spend day recommended tomorrow.', effect: 'Reset momentum delta.' };
        } else {
            internalAction = { priority: 'medium', text: 'Review micro-transactions.', effect: 'Plug potential leaks.' };
        }
    }

    // Map to DailyReport interface
    let status: DailyReport['status'] = 'On Track';
    if (riskLevel === 'Critical') status = 'Action Needed';
    else if (riskLevel === 'Warning') status = 'Caution';

    return {
        date: today.toISOString(),
        status,
        summary: signals[0]?.title || 'Daily Summary',
        details: signals[0]?.description || 'Normal activity',
        cashFlow: {
            spentToday: expenseToday,
            dailyBudget,
            remainingDailyBudget: Math.max(0, dailyBudget - expenseToday)
        },
        projections: {
            spentThisMonth: expenseToday, // Simplified for now
            projectedMonthEnd: expenseToday * 30, // Simplified for now
            monthlyBudget: spendingLimit
        },
        topCategories: Object.entries(catMap).map(([name, amount]) => ({
            name,
            amount,
            percentageOfSpend: (amount / expenseToday) * 100
        })),
        advice: [internalAction.text]
    };
};

// --- MONTHLY ENGINE ---

export const generateMonthlyReport = (transactions: Transaction[], spendingLimit: number, today: Date = new Date()): MonthlyReport => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const prevDate = new Date(today);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    const currTxs = getTransactionsByMonth(transactions, currentMonth, currentYear);
    const prevTxs = getTransactionsByMonth(transactions, prevMonth, prevYear);

    const income = currTxs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expenses = currTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const savings = Math.max(0, income - expenses);
    
    const prevExpenses = prevTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);

    // Metrics
    const safeIncome = Math.max(1, income); // Avoid div by zero
    const SPI_M = savings / safeIncome;
    const ELR = expenses / safeIncome;
    
    const subs = currTxs.filter(t => t.category === Category.SUBSCRIPTION);
    const subTotal = subs.reduce((acc, t) => acc + t.amount, 0);
    const SBS = subTotal / safeIncome;

    const safePrevExp = Math.max(1, prevExpenses);
    const LIR = (expenses - safePrevExp) / safePrevExp;

    const catMap: Record<string, number> = {};
    currTxs.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const maxCatSpend = Math.max(0, ...Object.values(catMap));
    const DI = expenses > 0 ? maxCatSpend / expenses : 0;

    // Stability Index (Variance of last 3 months) - Simplified to just comparison of last 2 months for MVP
    // Variance proxy: abs diff normalized by average
    const avgExp2 = (expenses + prevExpenses) / 2;
    const SI = avgExp2 > 0 ? Math.abs(expenses - prevExpenses) / avgExp2 : 0;

    // Health Score
    // 100 - ELR*35 - SBS*20 - SI*15 - DI*15 + SPI_M*15
    // Note: Constants tuned for 0-1 scale inputs
    
    let rawHealth = 100 
        - (ELR * 35) 
        - (SBS * 50) 
        - (SI * 15) 
        - (DI * 15) 
        + (SPI_M * 25); 

    // Clamp
    const healthScore = Math.max(0, Math.min(100, rawHealth));

    let healthLevel: MonthlyReport['healthLevel'] = 'Stable';
    if (healthScore >= 80) healthLevel = 'Strong';
    else if (healthScore < 40) healthLevel = 'Critical';
    else if (healthScore < 60) healthLevel = 'Fragile';

    // Risk Model
    // (1 - SPI_M) * 30 + SBS * 25 + LIR * 25 + DI * 20
    const riskScore = Math.min(100, Math.max(0, ((1 - SPI_M) * 30) + (SBS * 50) + (Math.max(0, LIR) * 25) + (DI * 20)));

    // Insights / Problems
    const problems: MonthlyReport['problems'] = [];
    if (SBS > 0.1) problems.push({ title: `Subscription overload (${(SBS*100).toFixed(0)}% of income)`, severity: 'medium' });
    if (LIR > 0.1) problems.push({ title: `Lifestyle inflation (+${(LIR*100).toFixed(0)}% spend)`, severity: 'high' });
    if (DI > 0.4) {
        const topCat = Object.entries(catMap).find(e => e[1] === maxCatSpend)?.[0] || 'Unknown';
        problems.push({ title: `Category dependency (${topCat} ${(DI*100).toFixed(0)}%)`, severity: 'medium' });
    }
    if (SPI_M < 0.1) problems.push({ title: 'Critically low savings rate', severity: 'high' });

    if (problems.length === 0) problems.push({ title: 'No major structural leaks found.', severity: 'low' });

    // Strategic Plan
    const strategicActions: string[] = [];
    if (SBS > 0.05) strategicActions.push(`Audit ${subs.length} subscriptions`);
    if (DI > 0.3) strategicActions.push(`Cap top category spend by 15%`);
    if (SPI_M < 0.2) strategicActions.push(`Identify 2 discretionary cuts`);
    if (strategicActions.length === 0) strategicActions.push('Increase investment allocation');

    const outcome = `+${(riskScore * 0.2).toFixed(0)}% Health Score, -${(riskScore * 0.15).toFixed(0)}% Risk`;

    return {
        month: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        healthScore,
        healthLevel,
        riskScore,
        metrics: {
            savingsPowerIndex: SPI_M,
            expenseLoadRatio: ELR,
            subscriptionBurdenScore: SBS,
            lifestyleInflationRate: LIR,
            dependencyIndex: DI
        },
        totals: {
            income,
            expenses,
            savings,
            prevExpenses
        },
        problems,
        strategicPlan: {
            objective: SPI_M < 0.2 ? 'Restore Savings Capacity' : 'Optimize Yield',
            actions: strategicActions,
            outcome
        }
    };
};