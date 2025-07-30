import { TransactionCard } from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import {
  Download,
  Filter,
  Loader2,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
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
}

// Virtual scrolling configuration
const ITEM_HEIGHT = 120; // Approximate height of each transaction card
const CONTAINER_HEIGHT = 600; // Height of the scrollable container
const OVERSCAN = 10; // Number of items to render outside visible area

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

  // Memoize visible transactions to prevent unnecessary re-renders
  const visibleTransactions = useMemo(() => {
    return transactions.slice(startIndex, endIndex);
  }, [transactions, startIndex, endIndex]);

  // Calculate total virtual height
  const totalHeight = transactions.length * ITEM_HEIGHT;
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
              className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all rounded-xl backdrop-blur-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filter</span>
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
          // Initial loading state
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading transactions...
              </p>
            </div>
          </div>
        ) : transactions.length > 0 ? (
          // Virtual scrolled list
          <div
            ref={containerRef}
            className="relative overflow-auto"
            style={{ height: CONTAINER_HEIGHT }}
            onScroll={handleScroll}
          >
            {/* Virtual spacer before visible items */}
            <div style={{ height: startIndex * ITEM_HEIGHT }} />

            {/* Visible transactions */}
            <div className="px-6 space-y-3">
              {visibleTransactions.map((transaction, index) => {
                return (
                  <div
                    key={transaction.id}
                    className="transform transition-all duration-200 hover:scale-[1.02] opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                    style={{
                      animationDelay: `${(index % 10) * 50}ms`, // Stagger animation for visible items only
                      minHeight: ITEM_HEIGHT,
                    }}
                  >
                    <TransactionCard
                      transaction={transaction}
                      onDelete={() => onDeleteTransaction(transaction)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Virtual spacer after visible items */}
            <div
              style={{ height: (transactions.length - endIndex) * ITEM_HEIGHT }}
            />

            {/* Loading more indicator */}
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

            {/* End of results indicator */}
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
          // Empty state
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

      {/* Pagination info footer */}
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
    </Card>
  );
};
