"use client";

import { BookAndMonthSelector } from "@/components/BookAndMonthSelector";
import { CSVImport } from "@/components/CSVImport";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { Header } from "@/components/Header";
import { QuickStats } from "@/components/QuickStats";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionPreview } from "@/components/TransactionPreview";
import { TransactionsSection } from "@/components/TransactionsSection";
import { QuickStatsSkeleton } from "@/components/skeleton/QuickStatsSkeleton";
import { TransactionsSkeleton } from "@/components/skeleton/TransactionsSkeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import { generateStatementReceipt } from "@/lib/receiptGenerator";
import { getMonthDateRange } from "@/lib/utils";
import { Book } from "@/types/book";
import { Transaction, TransactionFilters } from "@/types/transaction";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function BookDetailsPage() {
  const params = useParams();
  const bookId = params?.bookId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { books, initialized: booksInitialized } = useBooks();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllData, setShowAllData] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const [filters, setFilters] = useState<TransactionFilters>({
    type: undefined,
    category: undefined,
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    note: undefined,
  });

  // Combined filters for the hook
  const combinedFilters = useMemo(() => {
    let dateFilters = {};

    if (!showAllData && !filters.startDate && !filters.endDate) {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      dateFilters = { startDate, endDate };
    }

    return {
      ...filters,
      ...dateFilters,
      bookId: bookId || "",
      search: searchQuery,
    };
  }, [filters, bookId, searchQuery, selectedMonth, showAllData]);

  const {
    transactions,
    loading: transactionsLoading,
    loadingMore,
    initialized: transactionsInitialized,
    pagination,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadMore,
  } = useTransactions(combinedFilters);

  useEffect(() => {
    if (booksInitialized && books.length > 0 && bookId) {
      const book = books.find((b) => b.id === bookId);
      if (book) {
        setSelectedBook(book);
      } else {
        toast({
          title: "Book not found",
          description: "The book you're looking for doesn't exist.",
          variant: "destructive",
        });
        router.push("/");
      }
    }
  }, [books, booksInitialized, bookId, router, toast]);

  const { totalIncome, totalExpense, monthlyBudget } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

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
    const { error } = await createTransaction(newTransaction);
    if (!error) {
      setShowAddForm(false);
      toast({
        title: "Transaction Added",
        description: "Your transaction was successfully added.",
      });
    }
  };

  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    const { error } = await updateTransaction(updatedTransaction.id, {
      ...updatedTransaction,
      amount: Number(updatedTransaction.amount),
      date: updatedTransaction.date,
    });
    if (!error) {
      setShowEditForm(false);
      toast({
        title: "Transaction Updated",
        description: "Your transaction was successfully updated.",
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
      const { error } = await deleteTransaction(id);
      if (!error) {
        toast({
          title: "Transaction Deleted",
          description: "The transaction was successfully removed.",
        });
      } else {
        toast({
          title: "Deletion Failed",
          description: "There was an error deleting the transaction.",
          variant: "destructive",
        });
      }
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
    setShowImportDialog(true);
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
      const stats = {
        income: totalIncome,
        expense: totalExpense,
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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setShowAllData(month === "all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <Header
        showImportExport={true}
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        title="CashBook"
        subtitle={selectedBook?.name}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <BookAndMonthSelector
          selectedBook={selectedBook}
          onSelectBook={(book) =>
            book ? router.push(`/book/${book.id}`) : router.push("/")
          }
          selectedMonth={selectedMonth}
          onSelectMonth={handleMonthChange}
          booksInitialized={booksInitialized}
        />

        {transactionsLoading && !transactionsInitialized ? (
          <QuickStatsSkeleton />
        ) : (
          <QuickStats
            monthlyIncome={totalIncome}
            monthlyExpense={totalExpense}
            transactionCount={pagination.totalCount}
            monthlyBudget={monthlyBudget}
          />
        )}

        {transactionsLoading && !transactionsInitialized ? (
          <TransactionsSkeleton />
        ) : (
          <TransactionsSection
            transactions={transactions}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onDeleteTransaction={handleDeleteTransaction}
            onAddTransaction={() => setShowAddForm(true)}
            onImportCSV={handleImportCSV}
            canAddTransaction={!!selectedBook}
            pagination={pagination}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            loading={transactionsLoading}
            onFilterChange={setFilters}
            onEditTransaction={handleEditTransaction}
            onExportPDF={handleExportPDF}
            showEditForm={showEditForm}
            setShowEditForm={setShowEditForm}
          />
        )}
      </main>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <DialogHeader className="hidden sm:block">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent ">
              Add New Transaction
              {selectedBook && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 block mt-1">
                  to {selectedBook.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            bookId={bookId || ""}
            onSubmit={handleAddTransaction}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <CSVImport
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        selectedBook={selectedBook}
      />

      <DeleteConfirmationModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
        itemId={transactionToDelete?.id || ""}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        deleteButtonText="Delete Transaction"
        previewContent={
          transactionToDelete ? (
            <TransactionPreview transaction={transactionToDelete} />
          ) : null
        }
      />
    </div>
  );
}
