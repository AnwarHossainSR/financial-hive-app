"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBooks } from "@/hooks/useBooks";
import { format, parse } from "date-fns";
import { Loader2, Target } from "lucide-react";
import { useState } from "react";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookName: string;
  /** "YYYY-MM" */
  month: string;
  currentAmount?: number;
}

export function BudgetDialog({
  open,
  onOpenChange,
  bookId,
  bookName,
  month,
  currentAmount,
}: BudgetDialogProps) {
  // The hook's mutation shows the success/error toast
  const { setMonthlyBudget } = useBooks();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Prefill each time the dialog opens (render-time reset, no effect needed)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setAmount(currentAmount ? String(currentAmount) : "");
  }

  const value = Number(amount);
  const isValid = amount.trim() !== "" && Number.isFinite(value) && value > 0;
  const monthLabel = format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    const { error } = await setMonthlyBudget(bookId, month, value);
    setSaving(false);
    if (!error) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="items-start space-y-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Monthly budget</DialogTitle>
              <DialogDescription>
                How much do you plan to spend from {bookName} in {monthLabel}?
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Budget</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                ৳
              </span>
              <Input
                id="budget-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                autoFocus
                placeholder="20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-xl pl-8 text-lg font-semibold tabular-nums"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || saving}
              className="rounded-xl"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
