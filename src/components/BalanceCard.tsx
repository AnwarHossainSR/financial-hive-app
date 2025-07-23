import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

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
          gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
          shadow: "shadow-lg hover:shadow-xl",
          icon: TrendingUp,
          textColor: "text-white",
        };
      case "expense":
        return {
          gradient: "bg-gradient-to-br from-red-500 to-pink-600",
          shadow: "shadow-lg hover:shadow-xl",
          icon: TrendingDown,
          textColor: "text-white",
        };
      default:
        return {
          gradient:
            "bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-800 dark:to-gray-900",
          shadow: "shadow-lg hover:shadow-xl",
          icon: DollarSign,
          textColor: "text-white",
        };
    }
  };

  const { gradient, shadow, icon: Icon, textColor } = getCardStyles();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-none rounded-xl transition-all duration-300 transform hover:scale-105",
        gradient,
        shadow
      )}
    >
      <div className="relative">
        <CardHeader className="pb-2 px-5 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-sm font-medium", textColor)}>
              {title}
            </CardTitle>
            <Icon className={cn("w-5 h-5", textColor)} />
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-5">
          <div className={cn("text-3xl font-bold mb-2", textColor)}>
            ৳
            {Math.abs(amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>

          {subtitle && (
            <p className={cn("text-xs opacity-80", textColor)}>{subtitle}</p>
          )}

          {trend && (
            <div className="flex items-center mt-3 space-x-2">
              {trend.isPositive ? (
                <TrendingUp className={cn("w-4 h-4", textColor)} />
              ) : (
                <TrendingDown className={cn("w-4 h-4", textColor)} />
              )}
              <span className={cn("text-xs", textColor)}>
                {trend.value}% from last month
              </span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
