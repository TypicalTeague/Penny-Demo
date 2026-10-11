import { DemoState, Message } from '../types';

const STATE_STORAGE_KEY = 'penny_demo_state_v1';
const MESSAGES_STORAGE_KEY = 'penny_demo_messages_v1';

export const INITIAL_DEMO_STATE: DemoState = {
  startingCash: 100,
  protectedCash: 0,
  investableCash: 0,
  expenses: [],
  incomeChanges: [],
  riskLevel: null,
  portfolioAllocation: null,
  portfolioValue: 0,
  weeklyChange: null,
  planStatus: 'uninitialized',
  contributionStatus: 'active',
  pendingDecision: null,
  conversationSummary: 'Initial session',
};

// Start with clean initial Penny greeting or empty conversation as specified in Scene 1
export const INITIAL_MESSAGES: Message[] = [];

export function loadSavedState(): DemoState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load saved state from localStorage:', err);
  }
  return { ...INITIAL_DEMO_STATE };
}

export function saveState(state: DemoState): void {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function loadSavedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load saved messages from localStorage:', err);
  }
  return [...INITIAL_MESSAGES];
}

export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to localStorage:', err);
  }
}

export function clearDemoPersistence(): void {
  try {
    localStorage.removeItem(STATE_STORAGE_KEY);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear persistence:', err);
  }
}
