import { CategoryTags } from "@/components/CategoryTags";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { cn, formatTaka, parseCategories } from "@/lib/utils";
import { Transaction } from "@/types/transaction";
import { createElement } from "react";

export const TransactionPreview = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 text-left">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense",
        )}
      >
        {createElement(
          getCategoryIcon(
            parseCategories(transaction.category)[0],
            transaction.type,
          ),
          { className: "h-5 w-5" },
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.note || parseCategories(transaction.category)[0]}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <CategoryTags category={transaction.category} max={2} />
          <span className="text-xs text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-base font-semibold tabular-nums",
          isIncome ? "text-income" : "text-foreground",
        )}
      >
        {isIncome ? "+" : "−"}
        {formatTaka(Math.abs(transaction.amount))}
      </span>
    </div>
  );
};
