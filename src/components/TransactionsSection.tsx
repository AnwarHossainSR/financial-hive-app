import { EmptyState } from "@/components/EmptyState";
import { TransactionCard } from "@/components/TransactionCard";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import {
  cn,
  EXPENSE_CATEGORIES,
  formatTaka,
  getBangladeshTime,
  INCOME_CATEGORIES,
} from "@/lib/utils";
import {
  Transaction,
  TransactionFilters,
  TransactionsSectionProps,
} from "@/types/transaction";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Receipt,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// Fixed row slots (row + gap, day header) so virtual-scroll offsets stay exact
const ITEM_HEIGHT = 68;
const HEADER_HEIGHT = 40;
const CONTAINER_HEIGHT = 600;
// Room below the rows for the "loading more" / "end of list" line
const LIST_END_SPACE = 64;
const OVERSCAN = 10;

const TYPE_TABS = [
  { value: undefined, label: "All" },
  { value: "income" as const, label: "Income" },
  { value: "expense" as const, label: "Expense" },
];

interface DayRow {
  kind: "day";
  key: string;
  label: string;
  income: number;
  expense: number;
  /** More rows for this day may still be on unloaded pages */
  partial: boolean;
}

type ListRow =
  | DayRow
  | { kind: "transaction"; key: string; transaction: Transaction };

const dayKey = (date: Date | string) => getBangladeshTime(date).slice(0, 10);

const formatDayLabel = (key: string) => {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  // Noon UTC keeps the calendar day stable in any viewer timezone
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(key.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
};

function buildRows(transactions: Transaction[], hasNextPage: boolean) {
  const rows: ListRow[] = [];
  let header: DayRow | undefined;
  for (const transaction of transactions) {
    const key = `day-${dayKey(transaction.date)}`;
    if (header?.key !== key) {
      header = {
        kind: "day",
        key,
        label: formatDayLabel(key.slice(4)),
        income: 0,
        expense: 0,
        partial: false,
      };
      rows.push(header);
    }
    if (transaction.type === "income") {
      header.income += Number(transaction.amount);
    } else {
      header.expense += Number(transaction.amount);
    }
    rows.push({ kind: "transaction", key: transaction.id, transaction });
  }
  // List is date-sorted, so only the last day can continue on the next page
  if (header && hasNextPage) header.partial = true;
  return rows;
}

const formatDateChip = (value: string) => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : format(date, "MMM d, yyyy");
};

export const TransactionsSection = ({
  transactions,
  searchQuery,
  onSearchQueryChange,
  filters,
  onFilterChange,
  onDeleteTransaction,
  onEditTransaction,
  onAddTransaction,
  canAddTransaction,
  pagination,
  onLoadMore,
  loadingMore,
  loading,
}: TransactionsSectionProps) => {
  const rows = useMemo(
    () => buildRows(transactions, pagination.hasNextPage),
    [transactions, pagination.hasNextPage],
  );
  const rowSizes = useMemo(
    () => rows.map((r) => (r.kind === "day" ? HEADER_HEIGHT : ITEM_HEIGHT)),
    [rows],
  );
  // Short lists get a short box instead of a mostly-empty 600px one
  const contentHeight = rowSizes.reduce((sum, h) => sum + h, 0);
  const viewportHeight = Math.min(
    CONTAINER_HEIGHT,
    contentHeight + LIST_END_SPACE,
  );

  const {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    handleScroll,
  } = useVirtualScroll({
    itemHeight: ITEM_HEIGHT,
    itemSizes: rowSizes,
    containerHeight: viewportHeight,
    overscan: OVERSCAN,
    totalItems: rows.length,
    onLoadMore,
    hasNextPage: pagination.hasNextPage,
    loadingMore,
    threshold: 200,
  });

  const visibleRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex],
  );
  const visibleHeight = rowSizes
    .slice(startIndex, endIndex)
    .reduce((sum, h) => sum + h, 0);

  // Filter dialog edits a draft; nothing changes until "Apply"
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draft, setDraft] = useState<TransactionFilters>(filters);

  const openFilters = () => {
    setDraft(filters);
    setIsFilterOpen(true);
  };

  const chips = [
    filters.category && {
      key: "category" as const,
      label: filters.category,
    },
    filters.startDate && {
      key: "startDate" as const,
      label: `From ${formatDateChip(filters.startDate)}`,
    },
    filters.endDate && {
      key: "endDate" as const,
      label: `Until ${formatDateChip(filters.endDate)}`,
    },
    filters.note && {
      key: "note" as const,
      label: `Note: “${filters.note}”`,
    },
  ].filter(Boolean) as { key: keyof TransactionFilters; label: string }[];

  const isFiltered = chips.length > 0 || !!filters.type || !!searchQuery;

  const clearAll = () => {
    onFilterChange({});
    onSearchQueryChange("");
  };

  const draftCategories =
    draft.type === "income"
      ? [{ label: "Income", items: INCOME_CATEGORIES }]
      : draft.type === "expense"
        ? [{ label: "Expense", items: EXPENSE_CATEGORIES }]
        : [
            { label: "Income", items: INCOME_CATEGORIES },
            { label: "Expense", items: EXPENSE_CATEGORIES },
          ];

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      {/* Toolbar */}
      <div className="space-y-3 border-b p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Transactions</h2>
            <p className="text-sm text-muted-foreground">
              {pagination.totalCount.toLocaleString()}{" "}
              {pagination.totalCount === 1 ? "entry" : "entries"}
              {isFiltered && " match"}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Transaction type"
            className="flex rounded-xl bg-muted p-1"
          >
            {TYPE_TABS.map(({ value, label }) => {
              const selected = filters.type === value;
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onFilterChange({ ...filters, type: value })}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes…"
              aria-label="Search transactions"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="h-10 rounded-xl bg-background pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={openFilters}
            className={cn(
              "h-10 gap-2 rounded-xl",
              chips.length > 0 && "border-primary/40 bg-primary/5 text-primary",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {chips.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {chips.length}
              </span>
            )}
          </Button>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex h-7 items-center gap-1 rounded-full border bg-muted/50 pl-3 pr-1 text-xs font-medium"
              >
                {chip.label}
                <button
                  type="button"
                  aria-label={`Remove filter ${chip.label}`}
                  onClick={() =>
                    onFilterChange({ ...filters, [chip.key]: undefined })
                  }
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading transactions…
        </div>
      ) : transactions.length > 0 ? (
        <div className="relative">
          <div
            ref={containerRef}
            className="relative overflow-auto overscroll-contain scrollbar-hide"
            style={{ height: viewportHeight }}
            onScroll={handleScroll}
          >
            <div style={{ height: offsetY }} />
            <div className="px-2 sm:px-3">
              {visibleRows.map((row) =>
                row.kind === "day" ? (
                  <div
                    key={row.key}
                    className="flex items-end justify-between gap-3 px-2 pb-2 text-xs sm:px-3"
                    style={{ height: HEADER_HEIGHT }}
                  >
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </span>
                    <span
                      className="flex items-center gap-2 font-medium tabular-nums"
                      title={
                        row.partial
                          ? "Scroll to load the rest of this day"
                          : undefined
                      }
                    >
                      {row.income > 0 && (
                        <span className="text-income">
                          {formatTaka(row.income, { signed: true })}
                        </span>
                      )}
                      {row.expense > 0 && (
                        <span className="text-muted-foreground">
                          {formatTaka(-row.expense)}
                        </span>
                      )}
                      {row.partial && (
                        <span className="font-normal text-muted-foreground/70">
                          so far
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div
                    key={row.key}
                    className="pb-1"
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <TransactionCard
                      transaction={row.transaction}
                      onDelete={() => onDeleteTransaction(row.transaction)}
                      onEdit={() => onEditTransaction(row.transaction)}
                    />
                  </div>
                ),
              )}
            </div>
            <div
              style={{
                height: Math.max(0, totalHeight - offsetY - visibleHeight),
              }}
            />
            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading more…
              </div>
            ) : (
              !pagination.hasNextPage && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  That&apos;s everything for this view
                </p>
              )
            )}
          </div>
          {/* Fade hints that the list scrolls */}
          {contentHeight > viewportHeight && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent"
            />
          )}
        </div>
      ) : isFiltered ? (
        <EmptyState
          icon={SearchX}
          title="No matching transactions"
          description="Try a different search or remove some filters."
          action={
            <Button variant="outline" onClick={clearAll} className="rounded-xl">
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Add your first income or expense and watch this month add up."
          action={
            <Button
              onClick={onAddTransaction}
              disabled={!canAddTransaction}
              className="gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </Button>
          }
        />
      )}

      {transactions.length > 0 && (
        <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
          <span>
            Showing {transactions.length.toLocaleString()} of{" "}
            {pagination.totalCount.toLocaleString()}
          </span>
          {pagination.hasNextPage && <span>Scroll for more</span>}
        </div>
      )}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card p-6 sm:rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle>Filter transactions</DialogTitle>
            <DialogDescription>
              Narrow the list by category, date range or note.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="filter-category">Category</Label>
              <Select
                value={draft.category ?? "all"}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: value === "all" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger id="filter-category" className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {draftCategories.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((cat) => (
                        <SelectItem key={`${group.label}-${cat}`} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="filter-start">From</Label>
                <Input
                  id="filter-start"
                  type="date"
                  value={draft.startDate || ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-end">To</Label>
                <Input
                  id="filter-end"
                  type="date"
                  value={draft.endDate || ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              A date range overrides the selected month.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-note">Note contains</Label>
              <Input
                id="filter-note"
                value={draft.note || ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    note: e.target.value || undefined,
                  }))
                }
                placeholder="e.g. rickshaw"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="ghost"
              onClick={() => {
                setDraft({ type: filters.type });
              }}
              className="rounded-xl"
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                onFilterChange(draft);
                setIsFilterOpen(false);
              }}
              className="rounded-xl"
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
