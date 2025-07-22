import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Edit2, Image, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === "income";

  return (
    <Card className="group hover:shadow-card transition-all duration-300 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Category Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                isIncome
                  ? "border-income text-income bg-income-light"
                  : "border-expense text-expense bg-expense-light"
              )}
            >
              {transaction.category}
            </Badge>

            {/* Transaction Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "text-lg font-bold animate-amount-pulse",
                    isIncome ? "text-income" : "text-expense"
                  )}
                >
                  {isIncome ? "+" : "-"}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </span>
                {transaction.image_url && (
                  <Image className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {transaction.note && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {transaction.note}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {new Date(transaction.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(transaction)}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(transaction.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
