import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function BalanceCard({ title, amount, type, subtitle, trend }: BalanceCardProps) {
  const getCardStyles = () => {
    switch (type) {
      case 'income':
        return {
          gradient: 'bg-gradient-income',
          shadow: 'shadow-income',
          icon: TrendingUp,
          textColor: 'text-income-foreground'
        };
      case 'expense':
        return {
          gradient: 'bg-gradient-expense', 
          shadow: 'shadow-expense',
          icon: TrendingDown,
          textColor: 'text-expense-foreground'
        };
      default:
        return {
          gradient: 'bg-gradient-balance',
          shadow: 'shadow-card',
          icon: DollarSign,
          textColor: 'text-primary-foreground'
        };
    }
  };

  const { gradient, shadow, icon: Icon, textColor } = getCardStyles();

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:scale-105 animate-scale-in", shadow)}>
      {/* Gradient Background */}
      <div className={cn("absolute inset-0", gradient)} />
      
      {/* Content */}
      <div className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-sm font-medium", textColor)}>
              {title}
            </CardTitle>
            <Icon className={cn("w-4 h-4", textColor)} />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className={cn("text-2xl font-bold mb-1 animate-amount-pulse", textColor)}>
            ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          
          {subtitle && (
            <p className={cn("text-xs opacity-90", textColor)}>
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2 space-x-1">
              {trend.isPositive ? (
                <TrendingUp className={cn("w-3 h-3", textColor)} />
              ) : (
                <TrendingDown className={cn("w-3 h-3", textColor)} />
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