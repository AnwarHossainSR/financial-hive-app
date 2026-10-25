"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryTotals } from "@/hooks/useTransactions";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { cn, formatTaka } from "@/lib/utils";
import { TransactionFilters } from "@/types/transaction";
import { PieChart } from "lucide-react";
import { createElement, useState } from "react";

const MAX_ROWS = 6;

interface CategoryBreakdownProps {
  /** Same filters as the list (book, period, search), minus category/type */
  filters: TransactionFilters;
  /** Currently filtered category, highlighted in the list */
  activeCategory?: string;
  onSelectCategory: (
    category: string | undefined,
    type: "income" | "expense",
  ) => void;
  className?: string;
}

export function CategoryBreakdown({
  filters,
  activeCategory,
  onSelectCategory,
  className,
}: CategoryBreakdownProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const { data, isLoading } = useCategoryTotals(filters);

  const rows = (data ?? []).filter((row) => row.type === type);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const visible = rows.slice(0, MAX_ROWS);
  const rest = rows.slice(MAX_ROWS);
  const restTotal = rest.reduce((sum, row) => sum + row.amount, 0);
  const barColor =
    type === "income" ? "hsl(var(--chart-income))" : "hsl(var(--chart-expense))";

  return (
    <section
      className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            {type === "expense" ? "Spending" : "Income"} by category
          </h2>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${formatTaka(total)} in this view` : "This view"}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Breakdown type"
          className="flex rounded-lg bg-muted p-0.5"
        >
          {(["expense", "income"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                type === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <PieChart className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Nothing to break down</p>
            <p className="text-xs text-muted-foreground">
              No {type} recorded in this view yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {visible.map((row) => {
              const share = total > 0 ? (row.amount / total) * 100 : 0;
              const active = activeCategory === row.category;
              return (
                <li key={row.category}>
                  <button
                    type="button"
                    aria-pressed={active}
                    title={
                      active ? "Show all categories" : `Show only ${row.category}`
                    }
                    onClick={() =>
                      onSelectCategory(active ? undefined : row.category, type)
                    }
                    className={cn(
                      "-mx-2 w-[calc(100%+1rem)] rounded-xl px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {createElement(getCategoryIcon(row.category, type), {
                          className: "h-4 w-4",
                        })}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {row.category}
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatTaka(row.amount)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(share, 2)}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                            {Math.round(share)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {rest.length > 0 && (
              <li className="flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground">
                <span>
                  {rest.length} more categor{rest.length === 1 ? "y" : "ies"}
                </span>
                <span className="tabular-nums">{formatTaka(restTotal)}</span>
              </li>
            )}
          </ul>
        )}
      </div>
      {rows.length > 0 && (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Tap a category to filter the list. Entries with several categories
          count toward their first one.
        </p>
      )}
    </section>
  );
}
