export type ProjectStatus = "active" | "completed" | "paused";

export type EntryStatus = "pending" | "active" | "completed" | "withdrawn";

export interface InvestmentProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_profit_loss: number;
  remaining_capital: number;
  total_investment: number;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    entries: number;
  };
}

export interface InvestmentEntry {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  platform: string;
  investment_type: string;
  amount: number;
  status: EntryStatus;
  profit_loss?: number;
  withdrawal_date?: string;
  notes?: string;
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
  roi: number;
}
