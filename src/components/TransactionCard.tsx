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
    <Card
      className={cn(
        "group border-none shadow-md hover:shadow-lg bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-300",
        isIncome
          ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
          : "hover:bg-red-50 dark:hover:bg-red-900/20"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Category Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-sm font-semibold py-1 px-3 rounded-full",
                isIncome
                  ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/30"
              )}
            >
              {transaction.category}
            </Badge>

            {/* Transaction Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "text-xl font-bold",
                    isIncome
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {isIncome ? "+" : "-"}৳
                  {Math.abs(transaction.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {transaction.image_url && (
                  <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              {transaction.note && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                  {transaction.note}
                </p>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(transaction.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(transaction)}
              className="h-9 w-9 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-600 dark:text-gray-300"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(transaction.id)}
              className="h-9 w-9 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
