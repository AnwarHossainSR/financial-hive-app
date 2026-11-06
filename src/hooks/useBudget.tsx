import { setBudgetAction } from "@/app/actions/budgets";
import { read } from "@/lib/read";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface BudgetRow {
  month: string;
  amount: number;
}

export interface EffectiveBudget {
  amount: number;
  /** The month the amount was set in; earlier than the asked month if carried forward */
  fromMonth: string;
}

/**
 * The overall budget for a "YYYY-MM" month: the latest row at or before it.
 * A row with 0 turns the budget off from that month.
 */
export const budgetForMonth = (
  rows: BudgetRow[],
  month: string,
): EffectiveBudget | undefined => {
  let found: BudgetRow | undefined;
  for (const row of rows) {
    if (row.month <= month && (!found || row.month > found.month)) found = row;
  }
  return found && found.amount > 0
    ? { amount: found.amount, fromMonth: found.month }
    : undefined;
};

const budgetKeys = {
  all: ["budgets"] as const,
  list: (userId: string) => [...budgetKeys.all, userId] as const,
};

/** The single monthly budget that applies across all books */
export const useBudget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: budgetKeys.list(user?.id ?? ""),
    queryFn: async () => {
      const { budgets, error } = await read("budgets");
      if (error || !budgets) throw new Error(error ?? "Failed to load budget");
      return budgets;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async ({ month, amount }: BudgetRow) => {
      const { error } = await setBudgetAction(month, amount);
      if (error) throw new Error(error);
    },
    onSuccess: (_data, { amount }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      // Setting a budget also creates a notification
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: amount > 0 ? "Budget saved" : "Budget removed",
        description:
          amount > 0
            ? "It applies to all your books from this month on."
            : "No monthly budget from this month on.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't save budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const budgetFor = useCallback(
    (month: string) => budgetForMonth(rows, month),
    [rows],
  );

  const setBudget = useCallback(
    async (month: string, amount: number) => {
      try {
        await mutation.mutateAsync({ month, amount });
        return { error: null };
      } catch (error: any) {
        return { error: error.message as string };
      }
    },
    [mutation],
  );

  return { budgetFor, setBudget, isLoading, saving: mutation.isPending };
};
