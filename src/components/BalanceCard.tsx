import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface BalanceCardProps {
  title: string;
  amount: number;
  type: "balance" | "income" | "expense";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function BalanceCard({
  title,
  amount,
  type,
  subtitle,
  trend,
}: BalanceCardProps) {
  const getCardStyles = () => {
    switch (type) {
      case "income":
        return {
          gradient: "bg-gradient-income",
          shadow: "shadow-income hover:shadow-lg hover:shadow-income/40",
          border: "border border-income/10",
          icon: TrendingUp,
          textColor: "text-income-foreground",
          hoverBg: "hover:bg-income/5",
        };
      case "expense":
        return {
          gradient: "bg-gradient-expense",
          shadow: "shadow-expense hover:shadow-lg hover:shadow-expense/40",
          border: "border border-expense/10",
          icon: TrendingDown,
          textColor: "text-expense-foreground",
          hoverBg: "hover:bg-expense/5",
        };
      default:
        return {
          gradient: "bg-gradient-balance",
          shadow: "shadow-card hover:shadow-lg hover:shadow-primary/40",
          border: "border border-primary/10",
          icon: TrendingUp, // Neutral icon for balance
          textColor: "text-primary-foreground",
          hoverBg: "hover:bg-primary/5",
        };
    }
  };

  const {
    gradient,
    shadow,
    border,
    icon: Icon,
    textColor,
    hoverBg,
  } = getCardStyles();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-none rounded-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5 backdrop-blur-md bg-opacity-95",
        gradient,
        shadow,
        border,
        hoverBg,
        "animate-scale-in group"
      )}
    >
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-md"></div>

      <div className="relative z-10">
        <CardHeader className="pb-2 px-5 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle
              className={cn("text-sm font-semibold tracking-tight", textColor)}
            >
              {title}
            </CardTitle>
            <Icon
              className={cn(
                "w-5 h-5 transform transition-transform duration-300 group-hover:scale-110",
                textColor
              )}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-5 pb-4">
          <div
            className={cn(
              "text-2xl font-bold tracking-tight mb-2 animate-amount-pulse",
              textColor
            )}
          >
            ৳
            {Math.abs(amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>

          {subtitle && (
            <p className={cn("text-xs font-medium opacity-80", textColor)}>
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center mt-3 space-x-1.5">
              {trend.isPositive ? (
                <TrendingUp
                  className={cn(
                    "w-4 h-4 transform transition-transform duration-300 group-hover:scale-110",
                    textColor
                  )}
                />
              ) : (
                <TrendingDown
                  className={cn(
                    "w-4 h-4 transform transition-transform duration-300 group-hover:scale-110",
                    textColor
                  )}
                />
              )}
              <span className={cn("text-xs font-medium", textColor)}>
                {trend.value}% from last month
              </span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
