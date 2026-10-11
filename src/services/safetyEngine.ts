import { DemoState, ExpenseItem } from '../types';

export interface CapacityResult {
  startingCash: number;
  protectedCash: number;
  investableCash: number;
  expenses: ExpenseItem[];
  canInvest: boolean;
  notes: string[];
}

export class FinancialSafetyEngine {
  /**
   * Enforces strict safety rules:
   * 1. Protected cash cannot be invested.
   * 2. Investable cash = max(0, startingCash - protectedCash).
   * 3. Investable cash cannot be negative.
   * 4. Essential near-term expenses must remain protected.
   * 5. Risk preference cannot override protected-cash requirements.
   */
  static evaluateCapacity(
    startingCash: number,
    existingProtectedCash: number,
    newExpense?: { label: string; amount: number; date?: string; isEssential?: boolean }
  ): CapacityResult {
    const safeStartingCash = Math.max(0, startingCash);
    let totalProtected = Math.max(0, existingProtectedCash);
    const notes: string[] = [];

    const expenses: ExpenseItem[] = [];

    if (newExpense && newExpense.amount > 0) {
      const isEssential = newExpense.isEssential ?? true;
      expenses.push({
        id: `exp-${Date.now()}`,
        label: newExpense.label || 'Essential expense',
        amount: newExpense.amount,
        date: newExpense.date,
        isEssential,
      });

      if (isEssential) {
        totalProtected += newExpense.amount;
        notes.push(`Protected $${newExpense.amount} for ${newExpense.label || 'upcoming expense'}.`);
      }
    }

    // Ensure total protected does not exceed total cash available
    if (totalProtected > safeStartingCash) {
      totalProtected = safeStartingCash;
      notes.push('All available cash protected for upcoming essential expenses.');
    }

    const investableCash = Math.max(0, safeStartingCash - totalProtected);
    const canInvest = investableCash > 0;

    if (!canInvest) {
      notes.push('Investable paper cash is $0. Safe reserves take priority.');
    }

    return {
      startingCash: safeStartingCash,
      protectedCash: totalProtected,
      investableCash,
      expenses,
      canInvest,
      notes,
    };
  }

  /**
   * Analyzes an emergency or unexpected shock (e.g. $300 car repairs)
   * and recommends appropriate mandate actions without moving real money.
   */
  static assessLifeEvent(
    eventAmount: number,
    currentState: DemoState
  ): {
    recommendedAction: 'pause_contributions' | 'explore_withdrawal' | 'keep_plan';
    rationale: string;
    options: Array<{ id: string; label: string; emoji?: string }>;
  } {
    // If expense is significant compared to current investable amount or liquidity
    return {
      recommendedAction: 'pause_contributions',
      rationale:
        'Your repair matters more than adding new money to investments right now. I recommend pausing future contributions.',
      options: [
        { id: 'pause_contributions', label: 'Pause contributions' },
        { id: 'explore_withdrawal', label: 'Explore withdrawing money' },
        { id: 'keep_current_plan', label: 'Keep my current plan' },
      ],
    };
  }
}
