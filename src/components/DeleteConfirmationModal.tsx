import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/types/transaction";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onConfirmDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  transaction,
  onConfirmDelete,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delete Transaction
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Transaction Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 my-4">
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
                <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                  {transaction.category}
                </span>
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
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-0 rounded-lg font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(transaction.id)}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
