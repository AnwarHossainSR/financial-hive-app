import { TransactionCard } from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import { cn } from "@/lib/utils";
import {
  Download,
  Filter,
  Loader2,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
}

interface TransactionFilters {
  bookId?: string;
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TransactionsSectionProps {
  transactions: Transaction[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  onImportCSV: () => void;
  canAddTransaction: boolean;
  pagination: PaginationInfo;
  onLoadMore: () => void;
  loadingMore: boolean;
  loading: boolean;
  onFilterChange: (filters: TransactionFilters) => void;
}

const ITEM_HEIGHT = 120;
const CONTAINER_HEIGHT = 600;
const OVERSCAN = 10;

// Categories from TransactionForm
const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Business",
  "Gift",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
];

export const TransactionsSection = ({
  transactions,
  searchQuery,
  onSearchQueryChange,
  onDeleteTransaction,
  onAddTransaction,
  onImportCSV,
  canAddTransaction,
  pagination,
  onLoadMore,
  loadingMore,
  loading,
  onFilterChange,
}: TransactionsSectionProps) => {
  const { containerRef, startIndex, endIndex, offsetY, handleScroll } =
    useVirtualScroll({
      itemHeight: ITEM_HEIGHT,
      containerHeight: CONTAINER_HEIGHT,
      overscan: OVERSCAN,
      totalItems: transactions.length,
      onLoadMore,
      hasNextPage: pagination.hasNextPage,
      loadingMore,
      threshold: 200,
    });

  const visibleTransactions = useMemo(() => {
    return transactions.slice(startIndex, endIndex);
  }, [transactions, startIndex, endIndex]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: undefined,
    category: undefined,
    startDate: undefined,
    endDate: undefined,
    search: undefined,
  });

  // Check if any filters are applied
  const hasFiltersApplied = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      type: undefined,
      category: undefined,
      startDate: undefined,
      endDate: undefined,
      search: undefined,
    });
    onFilterChange({
      type: undefined,
      category: undefined,
      startDate: undefined,
      endDate: undefined,
      search: searchQuery, // Preserve search query
    });
    setIsFilterOpen(false);
  };

  return (
    <Card className="border-none shadow-xl rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-gray-700/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Recent Transactions
            {pagination.totalCount > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({pagination.totalCount.toLocaleString()} total)
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-10 text-sm bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all rounded-xl backdrop-blur-sm",
                hasFiltersApplied &&
                  "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {hasFiltersApplied ? "Filters Applied" : "Filter"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onImportCSV}
              disabled={!canAddTransaction}
              className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all rounded-xl backdrop-blur-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>

            <Button
              size="sm"
              onClick={onAddTransaction}
              disabled={!canAddTransaction}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading transactions...
              </p>
            </div>
          </div>
        ) : transactions.length > 0 ? (
          <div
            ref={containerRef}
            className="relative overflow-auto"
            style={{ height: CONTAINER_HEIGHT }}
            onScroll={handleScroll}
          >
            <div style={{ height: startIndex * ITEM_HEIGHT }} />
            <div className="px-6 space-y-3">
              {visibleTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="transform transition-all duration-200 hover:scale-[1.02] opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                  style={{
                    animationDelay: `${(index % 10) * 50}ms`,
                    minHeight: ITEM_HEIGHT,
                  }}
                >
                  <TransactionCard
                    transaction={transaction}
                    onDelete={() => onDeleteTransaction(transaction)}
                  />
                </div>
              ))}
            </div>
            <div
              style={{ height: (transactions.length - endIndex) * ITEM_HEIGHT }}
            />
            {loadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Loading more transactions...
                  </span>
                </div>
              </div>
            )}
            {!pagination.hasNextPage &&
              transactions.length > 0 &&
              !loadingMore && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You've reached the end of your transactions
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-16 px-6 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.2s_forwards]">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur-2xl opacity-10 scale-150"></div>
              <TrendingUp className="relative w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery ? "No matching transactions" : "No transactions yet"}
            </h4>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Add your first transaction to get started with tracking your finances!"}
            </p>
            {!searchQuery && (
              <Button
                onClick={onAddTransaction}
                disabled={!canAddTransaction}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Transaction
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {transactions.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {transactions.length} of{" "}
              {pagination.totalCount.toLocaleString()} transactions
            </span>
            {pagination.hasNextPage && (
              <span className="flex items-center gap-1">
                <span>Scroll down to load more</span>
              </span>
            )}
          </div>
        </div>
      )}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Filter Transactions
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Apply filters to narrow down your transaction list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="type"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Type
              </Label>
              <Select
                value={filters.type || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: (value as "income" | "expense") || undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="category"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Category
              </Label>
              <Select
                value={filters.category || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: value || undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filters.type === "income"
                    ? INCOME_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))
                    : filters.type === "expense"
                    ? EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))
                    : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(
                        (cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        )
                      )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                  className="bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="endDate"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                  className="bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="noteSearch"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Search Notes
              </Label>
              <Input
                id="noteSearch"
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value || undefined,
                  }))
                }
                placeholder="Search in notes..."
                className="bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="mr-2"
            >
              Reset
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
