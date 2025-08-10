export interface MonthlyBudget {
  id: string;
  book_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  name: string;
  type: "personal" | "business";
  owner_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  monthly_budgets?: MonthlyBudget[];
}
