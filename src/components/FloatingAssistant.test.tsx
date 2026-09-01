// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FloatingAssistant from './FloatingAssistant';
import { Transaction, Budget, TransactionType, Category } from '../types';

// Mock Data Generators
const createBudget = (category: Category, limit: number): Budget => ({
  id: `budget_${category}`,
  category,
  limit
});

const createTransaction = (category: Category, amount: number, dateOffsetDays = 0): Transaction => {
    const date = new Date();
    date.setDate(date.getDate() + dateOffsetDays);
    return {
        id: `tx_${Math.random()}`,
        date: date.toISOString().split('T')[0],
        merchant: 'Test Merchant',
        amount,
        category,
        type: TransactionType.EXPENSE,
        accountId: 'acc_1'
    };
};

describe('FloatingAssistant Risk Logic & Routing', () => {
  const mockOpenChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Silence by Default: No alerts render when data is healthy', () => {
    const { container } = render(
      <FloatingAssistant 
        transactions={[]} 
        budgets={[]} 
        userPlan="free" 
        onOpenChat={mockOpenChat} 
        isVisible={true} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('Inline Routing: Low risk budget violation (<40) shows Inline Panel', () => {
    // 10% overspend = 4 points. 1 Transaction = 0 habit points. Total = 4.
    const budget = createBudget(Category.FOOD, 100);
    const tx = createTransaction(Category.FOOD, 110); // $10 over

    render(
      <FloatingAssistant 
        transactions={[tx]} 
        budgets={[budget]} 
        userPlan="free" 
        onOpenChat={mockOpenChat} 
        isVisible={true} 
      />
    );

    // Click the robot
    const robot = screen.getByRole('button');
    fireEvent.click(robot);

    // Assert Inline Panel exists (based on text unique to inline)
    expect(screen.getByText(/Budget Boundary Crossed/i)).toBeInTheDocument();
    // Ensure Diagnostic elements are NOT present
    expect(screen.queryByText(/Diagnostic Alert/i)).toBeNull();
  });

  test('Diagnostic Routing: Medium risk violation (40-69) shows Diagnostic Modal', () => {
    // 100% overspend = 40 points. 4 Transactions = 5 habit points. Total = 45.
    const budget = createBudget(Category.FOOD, 100);
    const txs = Array(4).fill(null).map(() => createTransaction(Category.FOOD, 50)); // Total 200 (100 over)

    render(
      <FloatingAssistant 
        transactions={txs} 
        budgets={[budget]} 
        userPlan="free" 
        onOpenChat={mockOpenChat} 
        isVisible={true} 
      />
    );

    const robot = screen.getByRole('button');
    fireEvent.click(robot);

    expect(screen.getByText(/Diagnostic Alert/i)).toBeInTheDocument();
    expect(mockOpenChat).not.toHaveBeenCalled(); // Should not auto-redirect
  });

  test('Critical Routing: High risk (>=70) triggers Forced Redirect', () => {
    // Prediction Risk < 3 days runway = 95 Risk.
    const expense = createTransaction(Category.HOUSING, 3000); // High burn
    const income = { ...createTransaction(Category.INCOME, 3100), type: TransactionType.INCOME }; // Low runway
    
    // We need to manipulate the Elite Prediction logic which uses date objects inside component
    // Just simulating high budget risk instead:
    // 200% overspend = 80 points. 10 txs = 35 points. Total > 95.
    
    const budget = createBudget(Category.FOOD, 100);
    const txs = Array(10).fill(null).map(() => createTransaction(Category.FOOD, 30)); // 300 total

    render(
      <FloatingAssistant 
        transactions={txs} 
        budgets={[budget]} 
        userPlan="free" 
        onOpenChat={mockOpenChat} 
        isVisible={true} 
      />
    );

    const robot = screen.getByRole('button');
    fireEvent.click(robot);

    // Should call chat immediately
    expect(mockOpenChat).toHaveBeenCalled();
    // Context payload should be passed
    expect(mockOpenChat.mock.calls[0][0]).toContain('SYSTEM_INTERRUPT: BUDGET_VIOLATION');
  });

  test('Irreversibility Clamping: Time alone does not exceed 60', () => {
    // 0 hours left = 60 points max.
    // Create a subscription due NOW (0 hours diff)
    const subTx = createTransaction(Category.SUBSCRIPTION, 10); // Low amount to avoid compounding
    
    render(
      <FloatingAssistant 
        transactions={[subTx]} 
        budgets={[]} 
        userPlan="free" 
        onOpenChat={mockOpenChat} 
        isVisible={true} 
      />
    );

    // If risk was > 70, click would redirect.
    // Since we expect risk ~60, click should open Diagnostic.
    const robot = screen.getByRole('button');
    fireEvent.click(robot);

    expect(screen.getByText(/Diagnostic Alert/i)).toBeInTheDocument();
    expect(mockOpenChat).not.toHaveBeenCalled();
  });
});