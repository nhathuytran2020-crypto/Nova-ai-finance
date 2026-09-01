
// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Insights from './Insights';
import { BotMode, TransactionType, Category } from '../types';

describe('Insights Component', () => {
  const mockProps = {
    transactions: [],
    goals: [],
    budgets: [],
    userPlan: 'free' as const,
    onUpgradeClick: jest.fn(),
    formatCurrency: (n: number) => `$${n}`,
    insightUsage: 0,
    onIncrementUsage: jest.fn(),
    botMode: 'ruthless' as BotMode,
    onNavigate: jest.fn(),
    onAddGoal: jest.fn(),
    activeReport: null
  };

  test('renders the Neural Coach interface', () => {
    render(<Insights {...mockProps} />);
    // Check for the header
    expect(screen.getByText(/Neural Coach/i)).toBeInTheDocument();
    // Check for the mode indicator
    expect(screen.getByText(/ruthless Mode/i)).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    render(<Insights {...mockProps} />);
    expect(screen.getByText(/Daily/i)).toBeInTheDocument();
    expect(screen.getByText(/Monthly/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Scan/i)).toBeInTheDocument();
  });

  test('displays usage count for free plan', () => {
    render(<Insights {...mockProps} insightUsage={2} />);
    // Free limit is usually 3 in the code logic
    expect(screen.getByText(/2 \/ 3 OPS/i)).toBeInTheDocument();
  });
});
