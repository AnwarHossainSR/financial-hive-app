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
import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (id: string) => void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
  deleteButtonText?: string;
  itemId: string;
  previewContent?: ReactNode;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirmDelete,
  isDeleting = false,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  deleteButtonText = "Delete",
  itemId,
  previewContent,
}: DeleteConfirmationModalProps) {
  if (!itemId) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Optional Preview Content */}
        {previewContent && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 my-4">
            {previewContent}
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-0 rounded-lg font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(itemId)}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting
              ? `${deleteButtonText.replace("Delete", "Deleting")}...`
              : deleteButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
