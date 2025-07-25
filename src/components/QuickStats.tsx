import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCent,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface QuickStatsProps {
  monthlyIncome: number;
  monthlyExpense: number;
  transactionCount: number;
  savingsGoal?: number;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  subtitle?: string;
  delay?: number;
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
  progress,
  subtitle,
  delay = 0,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      className={`
        group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl 
        bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl
        transition-all duration-500 hover:scale-105 hover:-translate-y-1
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
      />

      {/* Animated Border */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
      />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
            {title}
          </CardTitle>
          <div
            className={`p-2 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110`}
          >
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-transform duration-300">
            {value}
          </div>
          {trend && (
            <div
              className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${
                trend.isPositive
                  ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                  : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
                style={{
                  width: isVisible ? `${Math.min(progress, 100)}%` : "0%",
                  transitionDelay: `${delay + 300}ms`,
                }}
              />
            </div>
          </div>
        )}

        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickStats({
  monthlyIncome,
  monthlyExpense,
  transactionCount,
  savingsGoal = 5000,
}: QuickStatsProps) {
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsProgress = (monthlySavings / savingsGoal) * 100;

  // Mock trend data - in real app, this would come from comparing with previous month
  const incomeTrend = { value: 12.5, isPositive: true };
  const expenseTrend = { value: 8.3, isPositive: false };

  const statCards = [
    {
      title: "Monthly Income",
      value: `+৳${monthlyIncome.toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-950" />,
      color: "from-emerald-500 to-green-500",
      trend: incomeTrend,
      delay: 0,
    },
    {
      title: "Monthly Expense",
      value: `-৳${monthlyExpense.toLocaleString()}`,
      icon: <TrendingDown className="w-5 h-5 text-red-950" />,
      color: "from-red-500 to-pink-500",
      trend: expenseTrend,
      delay: 100,
    },
    {
      title: "Total Transactions",
      value: transactionCount.toString(),
      icon: <BadgeCent className="w-5 h-5 text-blue-950" />,
      color: "from-blue-500 to-cyan-500",
      subtitle: "This month",
      delay: 200,
    },
    {
      title: "Savings Goal",
      value: `${Math.round(savingsProgress)}%`,
      icon: <Target className="w-5 h-5 text-purple-950" />,
      color: "from-purple-500 to-indigo-500",
      progress: savingsProgress,
      subtitle: `৳${monthlySavings.toLocaleString()} / ৳${savingsGoal.toLocaleString()}`,
      delay: 300,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Mobile View: Dropdown Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full flex justify-between items-center bg-white/90 dark:bg-gray-800/90 border-border rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsMobileStatsOpen(!isMobileStatsOpen)}
        >
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Quick Stats
          </span>
          {isMobileStatsOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </Button>

        {/* Mobile Dropdown Content */}
        {isMobileStatsOpen && (
          <div className="mt-2 space-y-4 animate-in slide-in-from-top-4 duration-300">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop View: Grid Layout */}
      <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
