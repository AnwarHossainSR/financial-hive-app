import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Target, TrendingDown, TrendingUp } from "lucide-react";

interface QuickStatsProps {
  monthlyIncome: number;
  monthlyExpense: number;
  transactionCount: number;
  savingsGoal?: number;
}

export function QuickStats({
  monthlyIncome,
  monthlyExpense,
  transactionCount,
  savingsGoal = 5000,
}: QuickStatsProps) {
  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsProgress = (monthlySavings / savingsGoal) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Monthly Income */}
      <Card className="hover:shadow-income transition-all duration-300 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Income
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-income" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-income">
            +${monthlyIncome.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Expense */}
      <Card className="hover:shadow-expense transition-all duration-300 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Expense
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-expense" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-expense">
            -${monthlyExpense.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Count */}
      <Card className="hover:shadow-card transition-all duration-300 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-foreground">
            {transactionCount}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      {/* Savings Progress */}
      <Card className="hover:shadow-card transition-all duration-300 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Goal
            </CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-foreground">
            {Math.round(savingsProgress)}%
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(savingsProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${monthlySavings.toLocaleString()} / ${savingsGoal.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
