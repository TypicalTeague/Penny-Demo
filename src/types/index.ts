export type RiskLevel = 'Low' | 'Medium' | 'High';

export type PlanStatus = 'uninitialized' | 'proposed' | 'active' | 'paused';
export type ContributionStatus = 'active' | 'paused';

export interface PortfolioAllocation {
  equities: number; // e.g. 60
  bonds: number;    // e.g. 30
  cash: number;     // e.g. 10
}

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  date?: string;
  isEssential: boolean;
}

export interface DemoState {
  startingCash: number;
  protectedCash: number;
  investableCash: number;
  expenses: ExpenseItem[];
  incomeChanges: Array<{ label: string; amount: number }>;
  riskLevel: RiskLevel | null;
  portfolioAllocation: PortfolioAllocation | null;
  portfolioValue: number;
  weeklyChange: {
    amount: number;
    percentage: number;
  } | null;
  planStatus: PlanStatus;
  contributionStatus: ContributionStatus;
  pendingDecision: string | null;
  conversationSummary: string;
}

export interface PollOption {
  id: string;
  label: string;
  emoji?: string;
  votes?: number;
}

export interface PollData {
  id: string;
  title: string;
  options: PollOption[];
  selectedOptionId?: string;
  isAnswered: boolean;
  disabled?: boolean;
}

export interface PlanCardData {
  startingMoney: number;
  protectedMoney: number;
  protectedReason: string;
  portfolioMoney: number;
  riskLevel: RiskLevel;
  allocation: PortfolioAllocation;
}

export interface WeeklyCardData {
  portfolioValue: number;
  weeklyChangeAmount: number;
  weeklyChangePercent: number;
  protectedReserve: number;
  protectedReason: string;
  riskLevel: RiskLevel;
  actionRequired: string;
}

export interface VerificationData {
  stage: 'in_progress' | 'verified';
  message: string;
}

export type TapbackType = 'heart' | 'thumbs_up' | 'sprout' | 'laugh';

export interface MessageActionButton {
  id: string;
  label: string;
  action: 'open_onboarding' | 'view_timeline' | 'retry';
}

export interface Message {
  id: string;
  sender: 'user' | 'penny' | 'system';
  timestamp: string;
  text?: string;
  type: 'text' | 'poll' | 'plan-card' | 'weekly-card' | 'verification' | 'system-divider';
  poll?: PollData;
  planData?: PlanCardData;
  weeklyData?: WeeklyCardData;
  verificationData?: VerificationData;
  actionButton?: MessageActionButton;
  tapback?: TapbackType;
  inReplyTo?: string; // Threaded reply reference
}

export interface GeminiInterpretation {
  intent:
    | 'start_investing'
    | 'report_expense'
    | 'report_income_change'
    | 'report_emergency'
    | 'ask_question'
    | 'change_risk'
    | 'approve'
    | 'pause'
    | 'withdraw'
    | 'unknown';
  amount: number;
  label: string;
  effectiveDate: string | null;
  riskLevel: RiskLevel | null;
  confidence: number;
  missingFields: string[];
  clarifyingQuestion: string | null;
}
