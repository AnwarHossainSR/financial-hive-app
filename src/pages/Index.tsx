import { BookSelector } from "@/components/BookSelector";
import { CSVImport } from "@/components/CSVImport";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { Header } from "@/components/Header";
import { QuickStats } from "@/components/QuickStats";
import { TransactionCard } from "@/components/TransactionCard";
import { TransactionForm } from "@/components/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Book, useBooks } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import {
  BookOpen,
  Calendar,
  Download,
  Filter,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
}

// Skeleton Components
const BookSelectorSkeleton = () => (
  <div className="relative">
    <div className="h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse" />
  </div>
);

const QuickStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    {[...Array(4)].map((_, i) => (
      <Card
        key={i}
        className="border-none shadow-lg rounded-xl bg-white dark:bg-gray-800 overflow-hidden"
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-20" />
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-24" />
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const TransactionsSkeleton = () => (
  <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-gray-800 overflow-hidden">
    <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-40" />
        <div className="flex gap-2">
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-64" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-20" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-24" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-32" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-20" />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const Index = () => {
  const { toast } = useToast();
  const { books, initialized: booksInitialized } = useBooks();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Update the selectedMonth state initialization at the top of the Index component
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth is 0-based, +1 for 1-based
    const initialMonth = `${year}-${month}`; // e.g., "2025-07"
    console.log("Initial selectedMonth:", initialMonth); // Debug
    return initialMonth;
  });

  console.log("selectedMonth", selectedMonth);
  const {
    transactions,
    loading: transactionsLoading,
    initialized: transactionsInitialized,
    createTransaction,
    deleteTransaction,
  } = useTransactions(
    selectedBook
      ? { bookId: selectedBook.id, search: searchQuery }
      : { search: searchQuery }
  );

  // Reset selectedMonth when book changes
  useEffect(() => {
    if (selectedBook) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${month}`; // e.g., "2025-07"
      console.log("Reset selectedMonth on book change:", currentMonth); // Debug
      setSelectedMonth(currentMonth);
    }
  }, [selectedBook]);

  // Initialize selectedBook from query param only
  useEffect(() => {
    if (booksInitialized && books.length > 0) {
      const bookId = searchParams.get("bookId");
      if (bookId) {
        const book = books.find((b) => b.id === bookId);
        if (book) {
          setSelectedBook(book);
        } else {
          setSearchParams({});
          setSelectedBook(null);
        }
      } else {
        setSelectedBook(null);
      }
    }
  }, [books, booksInitialized, searchParams, setSearchParams]);

  // Calculate financial stats and budget progress
  const { totalIncome, totalExpense, monthlyBudget } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Filter transactions for the selected month
    const monthExpenses = transactions
      .filter((t) => t.date.startsWith(selectedMonth) && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get monthly budget for the selected book and month
    const monthlyBudget =
      selectedBook?.monthly_budgets?.find((b) => b.month === selectedMonth)
        ?.amount || 5000;

    return {
      totalIncome: income,
      totalExpense: expense,
      monthlyBudget,
    };
  }, [transactions, selectedBook, selectedMonth]);

  const handleAddTransaction = async (newTransaction: any) => {
    const filteredQuery = selectedBook
      ? { bookId: selectedBook.id, search: searchQuery }
      : { search: searchQuery };
    const { error } = await createTransaction(newTransaction, filteredQuery);
    if (!error) {
      setShowAddForm(false);
      toast({
        title: "Transaction Added",
        description: "Your transaction was successfully added.",
      });
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
      toast({
        title: "Transaction Deleted",
        description: "The transaction was successfully removed.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const handleImportCSV = () => {
    if (!selectedBook) {
      toast({
        title: "Select a book first",
        description: "Please select a book before importing transactions.",
        variant: "destructive",
      });
      return;
    }
    setShowImportDialog(true);
  };

  const handleExportPDF = async () => {
    if (!selectedBook) {
      toast({
        title: "Select a book first",
        description: "Please select a book before exporting data.",
        variant: "destructive",
      });
      return;
    }

    if (transactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`${selectedBook.name} - Transaction Report`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Total Transactions: ${transactions.length}`, 20, 45);
      doc.text(`Total Income: ৳${totalIncome.toLocaleString()}`, 20, 55);
      doc.text(`Total Expenses: ৳${totalExpense.toLocaleString()}`, 20, 65);
      doc.text(
        `Net Balance: ৳${(totalIncome - totalExpense).toLocaleString()}`,
        20,
        75
      );

      const tableData = transactions.map((t) => [
        t.date,
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        `৳${Number(t.amount).toLocaleString()}`,
        t.category,
        t.note || "",
      ]);

      autoTable(doc, {
        head: [["Date", "Type", "Amount", "Category", "Note"]],
        body: tableData,
        startY: 85,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Tailwind blue-500
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249], // Tailwind slate-100
        },
      });

      doc.save(`${selectedBook.name}-transactions.pdf`);
      toast({
        title: "Export Successful",
        description: `Exported ${transactions.length} transactions to PDF.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!selectedBook) {
      toast({
        title: "Select a book first",
        description: "Please select a book before exporting data.",
        variant: "destructive",
      });
      return;
    }

    if (transactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Type", "Amount", "Category", "Note"];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [t.date, t.type, t.amount, `"${t.category}"`, `"${t.note || ""}"`].join(
          ","
        )
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedBook.name}-transactions.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${transactions.length} transactions to CSV.`,
    });
  };

  const canAddTransaction = selectedBook !== null;

  // Generate last 12 months for budget selection
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 for 1-based month
      months.push({
        value: `${year}-${month}`, // e.g., "2025-07"
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }), // e.g., "July 2025"
      });
    }
    console.log("Month options:", months); // Debug
    return months;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <Header
        showImportExport={true}
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        title="CashBook"
        subtitle={selectedBook ? selectedBook.name : undefined}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Book and Month Selector */}
        <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {!booksInitialized ? (
            <BookSelectorSkeleton />
          ) : (
            <div className="flex-1 sm:flex-none">
              <BookSelector
                selectedBook={selectedBook}
                onSelectBook={setSelectedBook}
              />
            </div>
          )}

          {selectedBook && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              <Select
                key={selectedBook.id}
                value={selectedMonth}
                onValueChange={(value) => {
                  console.log("Selected month changed to:", value);
                  setSelectedMonth(value);
                }}
              >
                <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0 focus:ring-offset-0">
                  <SelectValue
                    placeholder="Select Month"
                    children={
                      getMonthOptions().find(
                        (month) => month.value === selectedMonth
                      )?.label || "Select Month"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!selectedBook ? (
          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 scale-150"></div>
                <BookOpen className="relative w-24 h-24 mx-auto mb-8 text-blue-500 dark:text-blue-400 animate-bounce drop-shadow-lg" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent mb-6">
                Welcome to CashBook
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
                Select a book above to start tracking your income and expenses
                with modern, intuitive design.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  Organize your finances by creating books for personal,
                  business, or project-specific expenses.
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            {transactionsLoading && !transactionsInitialized ? (
              <QuickStatsSkeleton />
            ) : (
              <QuickStats
                monthlyIncome={totalIncome}
                monthlyExpense={totalExpense}
                transactionCount={transactions.length}
                monthlyBudget={monthlyBudget}
              />
            )}

            {/* Recent Transactions */}
            {transactionsLoading && !transactionsInitialized ? (
              <TransactionsSkeleton />
            ) : (
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
                          onChange={(e) => setSearchQuery(e.target.value)}
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
                        onClick={handleImportCSV}
                        disabled={!canAddTransaction}
                        className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all rounded-xl backdrop-blur-sm disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Import</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setShowAddForm(true)}
                        disabled={!canAddTransaction}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">
                          Add Transaction
                        </span>
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
                            onDelete={() =>
                              handleDeleteTransaction(transaction)
                            }
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
                        {searchQuery
                          ? "No matching transactions"
                          : "No transactions yet"}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-500 mb-6">
                        {searchQuery
                          ? "Try adjusting your search terms."
                          : "Add your first transaction to get started with tracking your finances!"}
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={() => setShowAddForm(true)}
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
            )}
          </>
        )}
      </main>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
              Add New Transaction
              {selectedBook && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 block mt-1">
                  to {selectedBook.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <TransactionForm
              bookId={selectedBook.id}
              onSubmit={handleAddTransaction}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImport
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        selectedBook={selectedBook}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        transaction={transactionToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Index;
