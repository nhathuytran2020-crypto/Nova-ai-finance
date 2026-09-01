import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Transaction, AIAnalysisResponse, BotMode, Category, ChatMessage, FinancialSnapshot, SuggestedAction, UserPlan, DailyReport, TransactionType, MonthlyReport } from '../types';

let lastCallTime = 0;
const MIN_INTERVAL_MS = 1500; // Efficient throttle

// Configuration
const PRIMARY_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
// Specific key fallback
const SECONDARY_API_KEY = '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';

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastCallTime < MIN_INTERVAL_MS) {
    throw new Error("Cooling down. Please wait a moment.");
  }
  lastCallTime = now;
};

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getTransactionFingerprint = (transactions: Transaction[]): string => {
  const count = transactions.length;
  const sum = transactions.reduce((acc, t) => acc + t.amount, 0);
  const latestDate = transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.date).getTime())) : 0;
  return `${count}-${sum}-${latestDate}`;
};

const getCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch (e) {
    return null;
  }
};

const setCache = <T>(key: string, data: T, ttlMs: number = 3600000) => {
  try {
    const item = {
      data,
      expiry: Date.now() + ttlMs
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    // Silently proceed if storage is full
  }
};

const localMerchantCache: Record<string, string> = {
  "starbucks": "Food & Dining",
  "mcdonald": "Food & Dining",
  "burger": "Food & Dining",
  "dunkin": "Food & Dining",
  "kfc": "Food & Dining",
  "subway": "Food & Dining",
  "pizza": "Food & Dining",
  "restaurant": "Food & Dining",
  "cafe": "Food & Dining",
  "food": "Food & Dining",
  "dinner": "Food & Dining",
  "lunch": "Food & Dining",
  "breakfast": "Food & Dining",
  "coffee": "Food & Dining",
  "netflix": "Subscription",
  "spotify": "Subscription",
  "hulu": "Subscription",
  "disney": "Subscription",
  "youtube": "Subscription",
  "apple": "Shopping",
  "google": "Services",
  "amazon": "Shopping",
  "walmart": "Shopping",
  "target": "Shopping",
  "grocery": "Food & Dining",
  "kroger": "Food & Dining",
  "safeway": "Food & Dining",
  "costco": "Shopping",
  "salary": "Income",
  "paycheck": "Income",
  "porsche": "Transportation",
  "uber": "Transportation",
  "lyft": "Transportation",
  "taxi": "Transportation",
  "gas": "Transportation",
  "shell": "Transportation",
  "chevron": "Transportation",
  "rent": "Housing",
  "housing": "Housing",
  "apartment": "Housing",
  "gym": "Health",
  "cvs": "Health",
  "walgreens": "Health",
  "pharmacy": "Health",
  "doctor": "Health",
  "fitness": "Health",
  "wifi": "Utilities",
  "electric": "Utilities",
  "water": "Utilities",
  "gas bill": "Utilities",
  "at&t": "Utilities",
  "verizon": "Utilities",
  "t-mobile": "Utilities",
  "comcast": "Utilities"
};

const getMerchantCategoryFromLocal = (merchant: string): string | null => {
  const norm = merchant.toLowerCase();
  for (const [kw, cat] of Object.entries(localMerchantCache)) {
    if (norm.includes(kw)) {
      return cat;
    }
  }
  try {
    const cached = localStorage.getItem(`cat-${norm}`);
    if (cached) return cached;
  } catch (e) {}
  return null;
};

/**
 * Higher-order function to handle API Key rotation and Fallback logic.
 */
async function withGeminiRetry<T>(
  userPlan: UserPlan,
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  checkRateLimit();
  const workingKey = PRIMARY_API_KEY || SECONDARY_API_KEY;
  const ai = new GoogleGenAI({ 
    apiKey: workingKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  return operation(ai);
}

export const analyzeFinancialData = async (transactions: Transaction[], userPlan: UserPlan = 'free'): Promise<AIAnalysisResponse | null> => {
  const cacheKey = `fin-analysis-${getTransactionFingerprint(transactions)}-${userPlan}`;
  const cached = getCache<AIAnalysisResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  return withGeminiRetry(userPlan, async (ai) => {
    try {
      const recentTxs = transactions.slice(0, 50);
      const dataString = JSON.stringify(recentTxs);
      const isElite = userPlan === 'ultra';

      // Conditional Prompting based on Plan
      const eliteInstructions = isElite 
          ? "Include 'goal_proposals' with 'reason_math' (exact deficit/buffer calculations) and 'scenario_impact' (consequences of ignoring)." 
          : "Include 'goal_proposals' with 'reason_simple' only. Do NOT generate deep math or scenario trees.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Data: ${dataString}. User Plan: ${userPlan}.
        Analyze the spending data as a professional financial coach. 
        Focus on providing clear, helpful insights and easy-to-understand recommendations.
        Avoid robotic terms like 'SYSTEM NOMINAL', 'DANGER', or ALL CAPS text. 
        Return strictly typed JSON.
        ${eliteInstructions}
        For goal_proposals, suggest 1 high-impact Goal (type: 'goal') or Budget (type: 'budget') correction.
        `,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING } } } },
              budget_suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, current_spend: { type: Type.NUMBER }, suggested_limit: { type: Type.NUMBER }, reason: { type: Type.STRING } } } },
              goal_proposals: { 
                  type: Type.ARRAY, 
                  items: { 
                      type: Type.OBJECT, 
                      properties: { 
                          id: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ['goal', 'budget'] },
                          title: { type: Type.STRING },
                          target_amount: { type: Type.NUMBER },
                          reason_simple: { type: Type.STRING },
                          reason_math: { type: Type.STRING },
                          scenario_impact: { type: Type.STRING },
                          category: { type: Type.STRING },
                          deadline: { type: Type.STRING }
                      } 
                  } 
              },
              predicted_spend_next_month: { type: Type.NUMBER },
              risk_score: { type: Type.NUMBER }
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(cleanJsonResponse(response.text)) as AIAnalysisResponse;
        setCache(cacheKey, parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error("AI Analysis Failed", error);
      throw error;
    }
  });
};

export const generateDailyInsight = async (transactions: Transaction[], spendingLimit: number, userPlan: UserPlan = 'free'): Promise<DailyReport> => {
    const today = new Date();
    const todayStr = today.toDateString();
    const fingerprint = getTransactionFingerprint(transactions);
    const cacheKey = `daily-inset-${todayStr}-${spendingLimit}-${fingerprint}-${userPlan}`;
    const cached = getCache<DailyReport>(cacheKey);
    if (cached) {
        return cached;
    }

    // 1. Calculate Deterministic Math locally (Speed + Accuracy)
    const todayTxs = transactions.filter(t => 
        new Date(t.date).toDateString() === todayStr && 
        t.type === TransactionType.EXPENSE
    );
    const spentToday = todayTxs.reduce((sum, t) => sum + t.amount, 0);
    
    // Daily Cap (Monthly Limit / 30)
    const dailyCap = Math.max(1, spendingLimit / 30);
    const survivalBudget = Math.max(0, dailyCap - spentToday);

    // Month Projection
    const currentMonthTxs = transactions.filter(t =>
        t.type === TransactionType.EXPENSE &&
        new Date(t.date).getMonth() === today.getMonth() &&
        new Date(t.date).getFullYear() === today.getFullYear()
    );
    const monthSpent = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // Simple Linear Projection
    const projectedSpend = dayOfMonth > 0 ? (monthSpent / dayOfMonth) * daysInMonth : 0;
    const isProjectedOver = projectedSpend > spendingLimit;
    const currentOverspend = Math.max(0, monthSpent - (dailyCap * dayOfMonth));
    const projectedDisaster = Math.max(0, projectedSpend - spendingLimit);
    const budgetMultiplier = spendingLimit > 0 ? (monthSpent / spendingLimit) : 1;
    
    // Prepare Data for AI
    const context = {
        spentToday,
        survivalBudget,
        monthSpent,
        monthLimit: spendingLimit,
        projectedSpend,
        currentOverspend,
        projectedDisaster,
        budgetMultiplier,
        recentTxs: todayTxs.map(t => `${t.merchant} ($${t.amount})${t.isVirtual ? ' [Planned Pre-Transaction]' : ''}`).join(', ')
    };

    const fallbackReport: DailyReport = {
        date: today.toISOString(),
        status: isProjectedOver || survivalBudget <= 0 ? 'Action Needed' : 'On Track',
        summary: isProjectedOver || survivalBudget <= 0 ? "You are breaching your structural budget limits." : "Your limits are structurally sound.",
        details: "We're currently using a basic overview of your spending. Check the dashboard for specific figures.",
        cashFlow: { spentToday, dailyBudget: dailyCap, remainingDailyBudget: survivalBudget },
        projections: { spentThisMonth: monthSpent, projectedMonthEnd: projectedSpend, monthlyBudget: spendingLimit },
        topCategories: [],
        advice: isProjectedOver || survivalBudget <= 0 ? ["Lower discretionary spending to $0 to stop deficit hemorrhage."] : ["Monitor your targets."]
    };

    return withGeminiRetry(userPlan, async (ai) => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: `
You are a direct, highly analytical daily financial assistant. Review the user's current day metrics alongside their monthly aggregate targets.

Data Context:
- Spent Today: $${spentToday}
- Remaining Daily Safe Budget: $${survivalBudget}
- Total Spent This Month: $${monthSpent}
- Monthly Limit: $${spendingLimit}
- Projected Month End Spend: $${projectedSpend}
- Recent Transactions: ${context.recentTxs}
- Days Remaining in Month: ${daysInMonth - dayOfMonth}

Strict Generation Rules:
1. Prioritize Target Breaches over Daily Wins: If the 'Projected Month End Spend' exceeds the 'Monthly Limit' by more than 10%, the tone must immediately pivot to 'Damage Control'. Do not use overly celebratory or soft language, even if 'Spent Today' is 0.
2. Calculate the Restoration Cap: Take the remaining target budget (or $0 if already breached) and divide it by the number of days left in the month. Output this as a strict daily limit in the advice.
3. Reference Known Variables: Do not give generic advice like 'look for small subscriptions'. Explicitly name the large or frequent transactions provided in the context driving the deficit.
4. Set status clearly: Use 'Action Needed' if projecting over limit or spent too much today, 'Caution' if on the edge, 'On Track' only if perfectly safe.

Task: Generate a DailyReport JSON object.
- status: string ('On Track', 'Caution', 'Action Needed')
- summary: 1 crisp, direct sentence summarizing the structural health of the budget constraint based on the projection, not just the day.
- details: 2-3 sentences. Identify the exact root cause of the projected deficit using 'Recent Transactions' data if over. State the required Restoration Cap to fix the curve.
- topCategories: Array of up to 3 spend areas {name, amount, percentageOfSpend}.
- advice: Array of 1-3 hard, actionable directives directly referencing specific transactions or the Restoration Cap.
                `,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            status: { type: Type.STRING, enum: ['On Track', 'Caution', 'Action Needed'] },
                            summary: { type: Type.STRING },
                            details: { type: Type.STRING },
                            topCategories: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        amount: { type: Type.NUMBER },
                                        percentageOfSpend: { type: Type.NUMBER }
                                    }
                                }
                            },
                            advice: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const aiData = JSON.parse(cleanJsonResponse(response.text));
                const report: DailyReport = {
                    date: today.toISOString(),
                    status: aiData.status || fallbackReport.status,
                    summary: aiData.summary || fallbackReport.summary,
                    details: aiData.details || fallbackReport.details,
                    cashFlow: { spentToday, dailyBudget: dailyCap, remainingDailyBudget: survivalBudget },
                    projections: {
                        spentThisMonth: monthSpent,
                        projectedMonthEnd: projectedSpend,
                        monthlyBudget: spendingLimit
                    },
                    topCategories: aiData.topCategories || [],
                    advice: aiData.advice || fallbackReport.advice
                };
                setCache(cacheKey, report);
                return report;
            }
            return fallbackReport;
        } catch (e) {
            console.error("Daily Generation Failed", e);
            return fallbackReport;
        }
    });
};

export const generateMonthlyInsight = async (transactions: Transaction[], monthlyLimit: number, userPlan: UserPlan = 'free'): Promise<any> => {
    const now = new Date();
    const fingerprint = getTransactionFingerprint(transactions);
    const cacheKey = `monthly-inset-${now.getFullYear()}-${now.getMonth()}-${monthlyLimit}-${fingerprint}-${userPlan}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
        return cached;
    }

    const currentMonthTxs = transactions.filter(t => 
        new Date(t.date).getMonth() === now.getMonth() && 
        new Date(t.date).getFullYear() === now.getFullYear()
    );
    
    const income = currentMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    return withGeminiRetry(userPlan, async (ai) => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: `
You are a direct, helpful financial assistant. Review the current month's transaction aggregates.

Income: $${income}, Expense: $${expense}
Data: ${JSON.stringify(currentMonthTxs.slice(0, 300))}

When generating the Monthly Audit, you must strictly adhere to these rules:
1. NEVER use complicated financial jargon (e.g., do not use words like "wealth velocity", "aggregate income", "discretionary load", "amortization", "variance"). Use simple, everyday terms like "Money in", "Money out", "Saved", "Extra spending".
2. Do NOT use markdown tables. Only use simple bullet points and bold text. 
3. Name the exact merchant names and calculate exact totals. 
4. Keep the tone simple and easy to understand for beginners.

Generate a simple Monthly Checkup for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} containing:
1. THE BIG PICTURE: Simple bullet points showing total money in, total money out, and what's left.
2. SPENDING HABITS: When did the user spend the most? What was it for? 
3. HIDDEN LEAKS: Identify named merchants where small, everyday spending is adding up.
4. NEXT MONTH'S PLAN: Give a simple daily spending limit recommendation.

Return JSON:
{
  "healthScore": number,
  "markdownReport": "String containing the complete generated markdown"
}
                `,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                }
            });
            const result = response.text ? JSON.parse(cleanJsonResponse(response.text)) : null;
            if (result) {
                setCache(cacheKey, result);
            }
            return result;
        } catch (e) {
            return null;
        }
    });
};

export const parseSimulationQuery = async (query: string, userPlan: UserPlan = 'free', financialContext?: { income: number, savings: number, surplus: number }): Promise<{ oneTimeTotal: number, monthlyRecurringTotal: number, parsedDescription: string, aiOpinion: string, aiSuggestions: string[] } | null> => {
  const cacheKey = `sim-${query.trim().toLowerCase()}-${JSON.stringify(financialContext || {})}-${userPlan}`;
  const cached = getCache<any>(cacheKey);
  if (cached) {
    return cached;
  }

  return withGeminiRetry(userPlan, async (ai) => {
    try {
      const contextStr = financialContext ? 
        `User Financial Context: Monthly Income: $${financialContext.income}, Current Savings: $${financialContext.savings}, Monthly Surplus: $${financialContext.surplus}.` : '';

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this "What if?" purchase query: "${query}". 
        ${contextStr}
        
        Protocol: IMPULSE IMPACT ASSESSMENT.
        Task: 
        1. Extract the "oneTimeTotal" (price as number). If none is mentioned, estimate a realistic market rate for the items described (e.g. "Macbook" -> 2000, "Tesla" -> 80000, "cup of coffee" -> 5).
        2. Extract "monthlyRecurringTotal" (recurring cost if mentioned, e.g. subscription, otherwise 0).
        3. Define "parsedDescription" (a clean, human-friendly short name for the purchase).
        4. Provide "aiOpinion": A highly clear, professional, concise, and data-driven assessment. If financial context is provided, contrast this cost against their surplus/savings/income with clear percentages and realistic tradeoffs. Be extremely brief (1-2 sentences max) but precise.
        5. Provide "aiSuggestions": Exactly 3 clear, highly practical, and actionable saving strategies or alternatives tailored to this purchase (e.g. "To fund this, reduce dining expenses by $60 for 3 months" or "Implement a 30-day cool-off period"). Keep them concise and distinct.

        Return JSON matching the schema.`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              oneTimeTotal: { type: Type.NUMBER },
              monthlyRecurringTotal: { type: Type.NUMBER },
              parsedDescription: { type: Type.STRING },
              aiOpinion: { type: Type.STRING },
              aiSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const result = response.text ? JSON.parse(cleanJsonResponse(response.text)) : null;
      if (result) {
        setCache(cacheKey, result, 43200000); // 12 hours cache for static simulation queries
      }
      return result;
    } catch (error) {
      console.error("Sim Parse Failed", error);
      throw error;
    }
  });
};

export const categorizeTransaction = async (merchant: string, amount: number, userPlan: UserPlan = 'free'): Promise<string> => {
  const localMatch = getMerchantCategoryFromLocal(merchant);
  if (localMatch) {
    return localMatch;
  }

  return withGeminiRetry(userPlan, async (ai) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Categorize "${merchant}" ($${amount}). Return only the category name from standard finance categories.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.1,
        }
      });
      const category = response.text?.trim() || 'Other';
      
      try {
        localStorage.setItem(`cat-${merchant.toLowerCase()}`, category);
      } catch (e) {}

      return category;
    } catch (e) {
      return 'Other';
    }
  });
};

export const chatWithFinancialCoach = async (
  currentMessage: string,
  history: ChatMessage[],
  snapshot: FinancialSnapshot,
  mode: BotMode = 'ruthless',
  userPlan: UserPlan = 'free'
): Promise<{ message: string; sentiment: 'info' | 'warning' | 'critical'; suggestedActions: SuggestedAction[]; chartContext?: { type: 'bar' | 'pie' | 'line', title: string, data: { name: string, value: number }[] } }> => {
  
  return withGeminiRetry(userPlan, async (ai) => {
    // Create a condensed history context (last 5 messages) to save tokens and speed up response
    const historyText = history
      .slice(-5)
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    
    const persona = mode === 'ruthless'
      ? "You are a direct, straight-to-the-point financial coach. Be brief, honest, and focus on basic, everyday budgeting numbers. If spending is high, state it clearly."
      : "You are a warm, encouraging financial helper. Use friendly, simple terms. Focus on progress, small savings steps, and helpful tips.";

    const systemInstruction = `${persona}
    You are Nova, a simple financial assistant.
    You have access to a 'FinancialSnapshot' of the user.
    Analyze the snapshot to answer the user's question.
    
    IMPORTANT RULES FOR TERMINOLOGY:
    - ALWAYS avoid complex financial jargon and terms (e.g., do NOT use words like 'variance', 'amortization', 'arbitrage', 'liquidation', 'yield optimization', 'depreciation', 'debt-to-income ratio', 'asset valuation', 'macroeconomic trend', or 'portfolio diversification').
    - If you must talk about these concepts, use extremely simple, friendly, child-and-beginner-proof descriptions. For example, instead of 'leverage/liquidity', say 'available cash'; instead of 'assets/portfolio', say 'money saved'; instead of 'expenditure variance', say 'spending differences over time'.
    - Keep sentences short, crystal clear, and direct so the user never gets confused.
    
    IMPORTANT: Return structured JSON matching the requested responseSchema.
    - 'sentiment': 'info' (neutral), 'warning' (caution), or 'critical' (danger).
    - 'suggestedActions': Array of 1-3 actions. 
      - Use actionId 'navigate_dashboard', 'navigate_transactions', 'navigate_goals', 'navigate_budget' to navigate.
      - Use actionId 'chat_prompt' for follow-up questions (payload = question text).
    - 'chartContext': You are highly encouraged to generate visual chart contexts! If the user asks about spending, budget breakdown, history, categories, trends, comparisons, or anything visual, ALWAYS provide a chart (type: 'bar', 'pie', or 'line') consisting of 3 to 5 realistic data points from their snapshot to help them visualize simply.
      - For category spending breakdown, use a 'pie' chart.
      - For comparison across different categories or segments, use a 'bar' chart.
      - For over time trends or dates, use a 'line' chart.
      - Keep data names/labels very short (1 word, e.g. "Food", "Rent", "Utils") to fit correctly on screen.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
          Financial Snapshot: ${JSON.stringify(snapshot)}
          
          Recent Conversation:
          ${historyText}
          
          User's New Question: ${currentMessage}
        `,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.1, // Faster generation with lower temperature
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ["info", "warning", "critical", "success"] },
              suggestedActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    actionId: { type: Type.STRING },
                    payload: { type: Type.STRING },
                  }
                }
              },
              chartContext: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                  type: { type: Type.STRING, enum: ["bar", "pie", "line"] },
                  title: { type: Type.STRING },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
          return JSON.parse(cleanJsonResponse(response.text));
      }
      throw new Error("No response generated");
    } catch (error) {
      console.error("Coach Chat Error", error);
      throw error;
    }
  }).catch(() => {
      // Final fallback
      return {
          message: "I'm currently unable to process your financial data due to a connection issue.",
          sentiment: "critical",
          suggestedActions: []
      };
  });
};

export const parseReceiptImage = async (base64Image: string, userPlan: UserPlan = 'free'): Promise<{ merchant: string; date: string; amount: number; category: string } | null> => {
  return withGeminiRetry(userPlan, async (ai) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash", 
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Extract merchant, total amount (number), date (YYYY-MM-DD), and category. Return strictly JSON." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      });
      return response.text ? JSON.parse(cleanJsonResponse(response.text)) : null;
    } catch (error) {
      throw error;
    }
  });
};

export const generateNegotiationScript = async (merchant: string, amount: number, intent: 'discount' | 'cancel' | 'downgrade' = 'discount', userPlan: UserPlan = 'free'): Promise<string> => {
  return withGeminiRetry(userPlan, async (ai) => {
    try {
      const specificContext = `
        Service Provider: ${merchant}
        Current Monthly Cost: $${amount}
        User Context:
        - Has been a loyal subscriber for over 1 year.
        - Feels the current price is too high for the value.
        - Is willing to downgrade or cancel if no offer is made.
        - Competitors offer similar services for 20% less.
      `;

      let goalPrompt = "";
      switch(intent) {
          case 'cancel': 
              goalPrompt = "Write a firm cancellation script. However, if they offer a retention discount of >30%, I will stay. Emphasize that I am switching to a competitor otherwise."; 
              break;
          case 'downgrade': 
              goalPrompt = "Write a script asking to DOWNGRADE to a cheaper tier. I want to keep the service but cut the cost. Mention I don't use the premium features anymore."; 
              break;
          default: 
              goalPrompt = "Write a script to negotiate a DISCOUNT/PROMO rate on the existing bill. Mention loyalty (loyal customer >1 year) and that I'm considering cancelling due to budget constraints.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${specificContext} 
        
        Task: ${goalPrompt} 

        Output Rules: Return a professionally structured Markdown output with two clearly labeled parts:
        
        ### 📋 COPY-PASTE SCRIPT
        [Provide the clean, copy-pasteable script here without any greetings, subject lines, or footnotes]

        ### 🧠 STRATEGIC FEASIBILITY ANALYSIS
        - **Success Rate**: [Assign High, Medium, or Low success chance for this merchant and explain why this action works/doesn't work]
        - **Risk Factor**: [Determine if cancellation threat/downgrade is effective or risky here]
        - **Counter Objection Plan**: [Exact response to use if their representative says: 'I cannot offer you anything dynamic today']`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.2
        }
      });
      return response.text?.trim() || "Unable to generate script.";
    } catch (error) {
      throw error;
    }
  });
};
