export type ProjectStatus = "active" | "completed" | "paused";
export type EntryStatus = "pending" | "active" | "completed" | "withdrawn";

export interface InvestmentPlatform {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    projects: number;
  };
}

export interface InvestmentProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_profit: number;
  total_loss: number;
  total_profit_loss: number;
  remaining_capital: number;
  total_investment: number;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  platform_id?: string;
  platform?: InvestmentPlatform;
  _count?: {
    entries: number;
  };
}

export interface InvestmentEntry {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  investment_type: string;
  amount: number;
  status: EntryStatus;
  principal?: number;
  expected_profit?: number;
  profit_received?: number;
  withdrawal_amount?: number;
  profit_loss?: number;
  withdrawal_date?: string;
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BankStatement {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  total_capital: number;
  total_withdrawal: number;
  balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAnalytics {
  totalProfitLoss: number;
  remainingCapital: number;
  totalInvestment: number;
  totalProfit: number;
  totalLoss: number;
  roi: number;
}

// Investment Types
export const INVESTMENT_TYPES = [
  'Deposit',
  'Investment', 
  'Profit',
  'Loss',
  'Fee',
  'Withdrawal'
] as const;

export type InvestmentType = typeof INVESTMENT_TYPES[number];
