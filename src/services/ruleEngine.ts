
import { SpendingStatus } from '../types';

/**
 * Pure math evaluation of spending against a limit.
 * Zero AI. Zero external dependencies.
 * 
 * @param currentSpend - The accumulated spend for the current period (positive number).
 * @param userLimit - The hard limit set by the user.
 * @returns SpendingStatus object with deterministic UI states.
 */
export const evaluateSpending = (currentSpend: number, userLimit: number): SpendingStatus => {
  // Prevent division by zero
  const limit = Math.max(userLimit, 1);
  const ratio = currentSpend / limit;

  // Cold, factual logic
  if (ratio >= 1.0) {
    return {
      status: 'violation',
      ratio,
      message: `LIMIT EXCEEDED: ${((ratio - 1) * 100).toFixed(1)}% OVER CAPACITY`,
      colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/50'
    };
  } 
  
  if (ratio >= 0.8) {
    return {
      status: 'warning',
      ratio,
      message: `THRESHOLD ALERT: ${Math.floor(ratio * 100)}% UTILIZED`,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/50'
    };
  }

  return {
    status: 'normal',
    ratio,
    message: 'NOMINAL',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  };
};
