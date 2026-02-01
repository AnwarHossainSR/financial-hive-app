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
  order_no?: number;
  order_date: string;
  order_id?: string;
  investment_type: string;
  status: EntryStatus;
  investment_amount: number;
  duration_months?: number;
  roi_min?: number;
  roi_max?: number;
  maturity_date?: string;
  expected_return?: number;
  expected_profit?: number;
  return_amount?: number;
  actual_profit?: number;
  capital_added?: number;
  withdrawal_amount?: number;
  is_completed?: boolean;
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
