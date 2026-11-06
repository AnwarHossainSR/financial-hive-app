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
import { useBudget } from "@/hooks/useBudget";
import { formatTaka } from "@/lib/utils";
import { format, parse } from "date-fns";
import { Loader2, Target } from "lucide-react";
import { useState } from "react";

const monthLabel = (month: string) =>
  format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy");

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "YYYY-MM" the budget is set from */
  month: string;
}

/** Sets the one monthly budget that applies across all books */
export function BudgetDialog({ open, onOpenChange, month }: BudgetDialogProps) {
  // The hook shows the success/error toast
  const { budgetFor, setBudget, saving } = useBudget();
  const current = budgetFor(month);
  const [amount, setAmount] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  // Prefill each time the dialog opens (render-time reset, no effect needed)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setAmount(current ? String(current.amount) : "");
  }

  const value = Number(amount);
  const isValid = amount.trim() !== "" && Number.isFinite(value) && value > 0;

  const save = async (next: number) => {
    const { error } = await setBudget(month, next);
    if (!error) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card p-6 sm:rounded-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) save(value);
          }}
          className="space-y-5"
        >
          <DialogHeader className="items-start space-y-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-foreground dark:text-gold">
              <Target className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>Monthly budget</DialogTitle>
              <DialogDescription>
                One budget for all your books, compared with everything you
                spend. Applies from {monthLabel(month)} until you change it.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Budget per month</Label>
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
                placeholder="60000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-xl pl-8 text-lg font-semibold tabular-nums"
              />
            </div>
            {current && current.fromMonth !== month && (
              <p className="text-xs text-muted-foreground">
                Currently {formatTaka(current.amount)}, set in{" "}
                {monthLabel(current.fromMonth)}.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:items-center sm:justify-between sm:space-x-0">
            {current ? (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => save(0)}
                className="rounded-xl text-muted-foreground"
              >
                Remove budget
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
