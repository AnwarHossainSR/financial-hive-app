"use client";

import { BookFormDialog } from "@/components/BookFormDialog";
import { BudgetDialog } from "@/components/BudgetDialog";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { CSVImport } from "@/components/CSVImport";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { MonthPicker } from "@/components/MonthPicker";
import { PageHeader } from "@/components/PageHeader";
import { QuickCalculator } from "@/components/QuickCalculator";
import { StatTile, type StatTrend } from "@/components/StatTile";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionPreview } from "@/components/TransactionPreview";
import { TransactionsSection } from "@/components/TransactionsSection";
import { TransactionsSkeleton } from "@/components/skeleton/TransactionsSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import {
  useTransactionTotals,
  useTransactions,
} from "@/hooks/useTransactions";
import { generateStatementReceipt } from "@/lib/receiptGenerator";
import {
  formatTaka,
  getBangladeshTime,
  getCurrentMonth,
  getMonthDateRange,
  getPreviousPeriodRange,
} from "@/lib/utils";
import { Book } from "@/types/book";
import {
  Transaction,
  TransactionFilters,
  TransactionFormValues,
} from "@/types/transaction";
import {
  Building2,
  Calculator,
  FileDown,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  Receipt,
  Scale,
  Settings2,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** No badge when there's nothing to compare against (avoids "+∞%") */
const trendFor = (
  current: number,
  before: number | undefined,
  upIsGood: boolean,
  label: string,
): StatTrend | undefined => {
  if (!before || before <= 0) return undefined;
  const value = Math.round(((current - before) / before) * 1000) / 10;
  return { value, isGood: value >= 0 === upIsGood, label };
};

export default function BookDetailsPage() {
  const params = useParams();
  const bookId = params?.bookId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { books, initialized: booksInitialized } = useBooks();
  const selectedBook: Book | null =
    books.find((b) => b.id === bookId) ?? null;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBookSettings, setShowBookSettings] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addPrefill, setAddPrefill] = useState<{
    amount: number;
    note: string;
  } | null>(null);

  // Must match usePrefetchBook, which warms this month from the dashboard
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const showAllData = selectedMonth === "all";

  const [filters, setFilters] = useState<TransactionFilters>({});

  // A custom date range from the filter dialog replaces the month
  const periodFilters = useMemo(() => {
    if (showAllData || filters.startDate || filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }
    return getMonthDateRange(selectedMonth);
  }, [showAllData, filters.startDate, filters.endDate, selectedMonth]);

  const combinedFilters = useMemo(
    () => ({
      ...filters,
      ...periodFilters,
      bookId: bookId || "",
      search: searchQuery,
    }),
    [filters, periodFilters, bookId, searchQuery],
  );

  // The breakdown shows every category, so it ignores category and type
  const breakdownFilters = useMemo(
    () => ({ ...combinedFilters, category: undefined, type: undefined }),
    [combinedFilters],
  );

  const {
    transactions,
    loading: transactionsLoading,
    loadingMore,
    initialized: transactionsInitialized,
    pagination,
    totals,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadMore,
  } = useTransactions(combinedFilters);

  // Unknown book (deleted, or someone else's): back to the dashboard
  useEffect(() => {
    if (booksInitialized && books.length > 0 && bookId && !selectedBook) {
      toast({
        title: "Book not found",
        description: "The book you're looking for doesn't exist.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [books, booksInitialized, bookId, selectedBook, router, toast]);

  // Trends compare against last month with the same filters. Skipped for
  // "all time" and custom date ranges, where "previous period" is undefined.
  const previousPeriod = useMemo(
    () =>
      showAllData || filters.startDate || filters.endDate
        ? null
        : getPreviousPeriodRange(selectedMonth),
    [showAllData, filters.startDate, filters.endDate, selectedMonth],
  );
  const { data: previousTotals } = useTransactionTotals(
    {
      ...filters,
      bookId,
      search: searchQuery,
      startDate: previousPeriod?.startDate,
      endDate: previousPeriod?.endDate,
    },
    !!previousPeriod && !!bookId,
  );

  // Server-side sums over every matching row, not just the loaded pages
  const totalIncome = totals.income;
  const totalExpense = totals.expense;
  const net = totalIncome - totalExpense;
  const budgetMonth = showAllData ? getCurrentMonth() : selectedMonth;
  const monthlyBudget = selectedBook?.monthly_budgets?.find(
    (b) => b.month === budgetMonth,
  )?.amount;
  const budgetAmount = monthlyBudget ? Number(monthlyBudget) : undefined;
  const budgetUsed = budgetAmount
    ? (totalExpense / budgetAmount) * 100
    : undefined;
  const periodLabel = showAllData
    ? "All time"
    : filters.startDate || filters.endDate
      ? "Custom range"
      : selectedMonth === getCurrentMonth()
        ? "This month"
        : "Selected month";

  // Today's recorded expense, for checking against the calculator tape. Only
  // reliable when the list is the unfiltered current month.
  const recordedToday = useMemo(() => {
    const today = getBangladeshTime().slice(0, 10);
    const isUnfilteredCurrentMonth =
      !showAllData &&
      selectedMonth === today.slice(0, 7) &&
      !searchQuery &&
      !Object.values(filters).some(Boolean);
    if (!isUnfilteredCurrentMonth) return undefined;
    return transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          getBangladeshTime(t.date).slice(0, 10) === today,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, showAllData, selectedMonth, searchQuery, filters]);

  // The mutations show success/error toasts themselves
  const handleAddTransaction = async (values: TransactionFormValues) => {
    const { error } = await createTransaction(values);
    if (error) return false;
    setShowAddForm(false);
    setAddPrefill(null);
    return true;
  };

  const handleEditTransaction = async (values: TransactionFormValues) => {
    if (!editingTransaction) return false;
    const { book_id: _bookId, ...updates } = values;
    const { error } = await updateTransaction(editingTransaction.id, updates);
    if (error) return false;
    setEditingTransaction(null);
    return true;
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
    } finally {
      setIsDeleting(false);
      setTransactionToDelete(null);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedBook) return;

    if (transactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sum the rows actually exported so the PDF totals match its table
      const sumOf = (type: Transaction["type"]) =>
        transactions
          .filter((t) => t.type === type)
          .reduce((sum, t) => sum + Number(t.amount), 0);
      const stats = {
        income: sumOf("income"),
        expense: sumOf("expense"),
        count: transactions.length,
      };

      const title = showAllData
        ? `${selectedBook.name} - All Transactions`
        : `${selectedBook.name} - ${selectedMonth}`;

      generateStatementReceipt(
        transactions,
        title,
        stats,
        user?.user_metadata?.display_name || user?.email || "User",
      );

      toast({
        title: "Export successful",
        description: `Exported ${transactions.length} transactions to PDF.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!selectedBook) return;

    if (transactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Type", "Amount", "Category", "Note", "Image"];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [
          t.date,
          t.type,
          t.amount,
          `"${t.category}"`,
          `"${t.note || ""}"`,
          `"${t.image_url || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      showAllData
        ? `${selectedBook.name}-all.csv`
        : `${selectedBook.name}-${selectedMonth}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isBusiness = selectedBook?.type === "business";
  const isFirstLoad = transactionsLoading && !transactionsInitialized;

  return (
    <div className="space-y-6">
      {selectedBook ? (
        <PageHeader
          icon={
            isBusiness ? (
              <Building2 className="h-6 w-6" />
            ) : (
              <UserRound className="h-6 w-6" />
            )
          }
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="capitalize">{selectedBook.type} book</span>
              {selectedBook.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </span>
              )}
            </span>
          }
          title={selectedBook.name}
          description={selectedBook.description}
          actions={
            <>
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Open calculator"
                onClick={() => setShowCalculator(true)}
                className="h-10 w-10 rounded-xl"
              >
                <Calculator className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More book actions"
                    className="h-10 w-10 rounded-xl"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={handleExportCSV}
                    disabled={transactions.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={handleExportPDF}
                    disabled={transactions.length === 0}
                  >
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    Export PDF statement
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => setShowBudget(true)}
                  >
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Set monthly budget
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => setShowBookSettings(true)}
                  >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    Book settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setShowAddForm(true)}
                className="hidden h-10 gap-2 rounded-xl shadow-primary md:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Add transaction
              </Button>
            </>
          }
        />
      ) : (
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
      )}

      {/* Stats */}
      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {isFirstLoad ? (
          [0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              featured
              label="Net balance"
              value={formatTaka(net, { signed: true })}
              icon={Scale}
              hint={periodLabel}
              className="col-span-2 lg:col-span-1"
            />
            <StatTile
              label="Income"
              value={formatTaka(totalIncome)}
              icon={TrendingUp}
              tone="income"
              trend={trendFor(
                totalIncome,
                previousTotals?.income,
                true,
                previousPeriod?.label ?? "",
              )}
              hint={previousPeriod ? undefined : periodLabel}
            />
            <StatTile
              label="Expense"
              value={formatTaka(totalExpense)}
              icon={TrendingDown}
              tone="expense"
              trend={trendFor(
                totalExpense,
                previousTotals?.expense,
                false,
                previousPeriod?.label ?? "",
              )}
              hint={previousPeriod ? undefined : periodLabel}
            />
            {showAllData ? (
              <StatTile
                label="Transactions"
                value={pagination.totalCount.toLocaleString()}
                icon={Receipt}
                tone="primary"
                hint="All time"
                className="col-span-2 sm:col-span-1"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowBudget(true)}
                disabled={!selectedBook}
                aria-label={
                  budgetAmount ? "Edit monthly budget" : "Set a monthly budget"
                }
                className="col-span-2 rounded-2xl text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-1 lg:col-span-1"
              >
                <StatTile
                  label="Budget used"
                  value={
                    budgetUsed !== undefined
                      ? `${Math.round(budgetUsed)}%`
                      : "Not set"
                  }
                  icon={Target}
                  tone={
                    budgetUsed === undefined
                      ? "neutral"
                      : budgetUsed > 100
                        ? "expense"
                        : budgetUsed > 85
                          ? "warning"
                          : "primary"
                  }
                  progress={budgetUsed}
                  hint={
                    budgetAmount === undefined
                      ? "Tap to set a monthly budget"
                      : budgetAmount - totalExpense >= 0
                        ? `${formatTaka(budgetAmount - totalExpense)} left of ${formatTaka(budgetAmount)}`
                        : `${formatTaka(totalExpense - budgetAmount)} over ${formatTaka(budgetAmount)}`
                  }
                  className="h-full"
                />
              </button>
            )}
          </>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isFirstLoad ? (
            <TransactionsSkeleton />
          ) : (
            <TransactionsSection
              transactions={transactions}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filters={filters}
              onFilterChange={setFilters}
              onDeleteTransaction={setTransactionToDelete}
              onEditTransaction={setEditingTransaction}
              onAddTransaction={() => setShowAddForm(true)}
              canAddTransaction={!!selectedBook}
              pagination={pagination}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              loading={transactionsLoading}
            />
          )}
        </div>
        <CategoryBreakdown
          className="lg:sticky lg:top-24"
          filters={breakdownFilters}
          activeCategory={filters.category}
          onSelectCategory={(category) =>
            setFilters((prev) => ({ ...prev, category }))
          }
        />
      </div>

      {/* Mobile quick add, above the tab bar */}
      {selectedBook && (
        <Button
          onClick={() => setShowAddForm(true)}
          aria-label="Add transaction"
          className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-gradient-primary p-0 shadow-primary md:hidden"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Add */}
      <Dialog
        open={showAddForm}
        onOpenChange={(open) => {
          setShowAddForm(open);
          if (!open) setAddPrefill(null);
        }}
      >
        <DialogContent className="max-w-lg gap-0 rounded-2xl bg-card p-0 sm:rounded-2xl">
          <DialogHeader className="space-y-1 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg">New transaction</DialogTitle>
            {selectedBook && (
              <DialogDescription>Adding to {selectedBook.name}</DialogDescription>
            )}
          </DialogHeader>
          <div className="px-6 pb-6">
            <TransactionForm
              bookId={bookId || ""}
              onSubmit={handleAddTransaction}
              onCancel={() => {
                setShowAddForm(false);
                setAddPrefill(null);
              }}
              initialAmount={addPrefill?.amount}
              initialNote={addPrefill?.note}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent className="max-w-lg gap-0 rounded-2xl bg-card p-0 sm:rounded-2xl">
          <DialogHeader className="space-y-1 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg">Edit transaction</DialogTitle>
            <DialogDescription>
              Changes update this book&apos;s totals right away.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {editingTransaction && (
              <TransactionForm
                key={editingTransaction.id}
                bookId={bookId || ""}
                transaction={editingTransaction}
                onSubmit={handleEditTransaction}
                onCancel={() => setEditingTransaction(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuickCalculator
        open={showCalculator}
        onOpenChange={setShowCalculator}
        storageKey={`calc-tape:${bookId}`}
        recordedToday={recordedToday}
        onUseTotal={(amount, note) => {
          setAddPrefill({ amount, note });
          setShowCalculator(false);
          setShowAddForm(true);
        }}
      />

      <CSVImport
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        selectedBook={selectedBook}
      />

      {selectedBook && (
        <>
          <BookFormDialog
            open={showBookSettings}
            onOpenChange={setShowBookSettings}
            book={selectedBook}
          />
          <BudgetDialog
            open={showBudget}
            onOpenChange={setShowBudget}
            bookId={selectedBook.id}
            bookName={selectedBook.name}
            month={budgetMonth}
            currentAmount={budgetAmount}
          />
        </>
      )}

      <DeleteConfirmationModal
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
        itemId={transactionToDelete?.id || ""}
        title="Delete transaction?"
        description="This can't be undone. The book's totals will update right away."
        deleteButtonText="Delete transaction"
        previewContent={
          transactionToDelete ? (
            <TransactionPreview transaction={transactionToDelete} />
          ) : null
        }
      />
    </div>
  );
}
