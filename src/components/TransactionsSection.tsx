import { TransactionCard } from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Filter, Plus, Search, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
}

interface TransactionsSectionProps {
  transactions: Transaction[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  onImportCSV: () => void;
  canAddTransaction: boolean;
}

export const TransactionsSection = ({
  transactions,
  searchQuery,
  onSearchQueryChange,
  onDeleteTransaction,
  onAddTransaction,
  onImportCSV,
  canAddTransaction,
}: TransactionsSectionProps) => (
  <Card className="border-none shadow-xl rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
    <CardHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-gray-700/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Recent Transactions
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

    <CardContent className="p-6 space-y-4">
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className="transform transition-all duration-200 hover:scale-[1.02] opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <TransactionCard
                transaction={transaction}
                onDelete={() => onDeleteTransaction(transaction)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.2s_forwards]">
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Transaction
            </Button>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);
