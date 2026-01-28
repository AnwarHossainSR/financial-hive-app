import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { ReactNode, useState } from "react";

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
  verificationText?: string; // e.g., platform name to type
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
  verificationText,
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset input when modal opens/closes
  // Reset input when modal opens using render-time adjustment pattern to avoid useEffect lint
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setInputValue("");
    }
  }

  if (!itemId) return null;

  const isDeleteDisabled =
    isDeleting || (!!verificationText && inputValue !== verificationText);

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

        {/* Verification Input */}
        {verificationText && (
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To confirm, type{" "}
              <span className="font-bold select-all">{verificationText}</span>{" "}
              below:
            </Label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={verificationText}
              className="border-red-200 focus:border-red-500 focus:ring-red-500 dark:bg-gray-900/50"
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-0 rounded-lg font-medium">
            Cancel
          </AlertDialogCancel>
          <ButtonWrapper
            onClick={() => onConfirmDelete(itemId)}
            disabled={isDeleteDisabled}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting
              ? `${deleteButtonText.replace("Delete", "Deleting")}...`
              : deleteButtonText}
          </ButtonWrapper>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Wrapper to pass props correctly to AlertDialogAction or Button
// AlertDialogAction behaves like a button but validation requires standard button sometimes
// actually AlertDialogAction closes the dialog automatically.
// If we want to prevent closing (e.g. if we had async validation which we don't here really,
// but we only enable the button when valid), we can use AlertDialogAction but disabled.
// However, shadcn AlertDialogAction might not support 'disabled' styling perfectly or might close on click even if disabled?
// No, standard button disabled attribute prevents click.
// But wait, AlertDialogAction automatically closes modal.
// We are passing onConfirmDelete which usually triggers async action.
// If we want to keep modal open while deleting (isDeleting), we should use a normal Button inside footer, NOT AlertDialogAction.
// Because AlertDialogAction unmounts/closes immediately.
// But previous implementation used AlertDialogAction.
// Let's check imports.
import { Button } from "@/components/ui/button";

function ButtonWrapper({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  // We use a regular Button instead of AlertDialogAction to prevent auto-closing
  // This allows us to show 'Deleting...' state
  // But we need to close it manually in onConfirmDelete (which sets open=false).
  // The implementations I saw passed `setDeleteModalOpen(false)` inside the handler.
  // So using Button is correct.
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </Button>
  );
}
