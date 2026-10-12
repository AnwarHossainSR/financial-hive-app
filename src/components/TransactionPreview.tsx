import { CategoryTags } from "@/components/CategoryTags";
import { Transaction } from "@/types/transaction";

export const TransactionPreview = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span
            className={`text-lg font-bold ${
              isIncome
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isIncome ? "+" : "-"}৳
            {Math.abs(transaction.amount).toLocaleString()}
          </span>
          <CategoryTags
            category={transaction.category}
            type={transaction.type}
            className="flex-wrap"
          />
        </div>
        {transaction.note && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            {transaction.note}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {new Date(transaction.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};
