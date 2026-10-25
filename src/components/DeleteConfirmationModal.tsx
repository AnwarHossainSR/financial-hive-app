import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
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
      <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 sm:rounded-2xl">
        <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {previewContent && (
          <div className="rounded-xl border bg-muted/40 p-3">
            {previewContent}
          </div>
        )}

        {verificationText && (
          <div className="space-y-2">
            <Label htmlFor="delete-verification" className="text-sm font-normal text-muted-foreground">
              Type{" "}
              <span className="select-all font-semibold text-foreground">
                {verificationText}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="delete-verification"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={verificationText}
              className="h-10 rounded-xl"
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 rounded-xl">Cancel</AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) keeps the dialog open while
              deleting; callers close it via onOpenChange when done. */}
          <Button
            variant="destructive"
            onClick={() => onConfirmDelete(itemId)}
            disabled={isDeleteDisabled}
            className="rounded-xl"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDeleting
              ? `${deleteButtonText.replace(/^Delete/, "Deleting")}…`
              : deleteButtonText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
