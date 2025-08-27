import { BookAndMonthSelector } from "@/components/BookAndMonthSelector";
import { CSVImport } from "@/components/CSVImport";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { EmptyBookState } from "@/components/EmptyBookState";
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
import { useBooks } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import { Book } from "@/types/book";
import { Transaction, TransactionFilters } from "@/types/transaction";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAllData, setShowAllData] = useState(false); // New state for all data toggle

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

  // Helper function to get month date range
  const getMonthDateRange = (monthString: string) => {
    const [year, month] = monthString.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0)
      .toISOString()
      .split("T")[0];
    return { startDate, endDate };
  };

  // Create combined filters for the hook
  const combinedFilters = useMemo(() => {
    let dateFilters = {};

    // If not showing all data and no custom date filters, use selected month
    if (!showAllData && !filters.startDate && !filters.endDate) {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      dateFilters = { startDate, endDate };
    }

    return {
      ...filters,
      ...dateFilters,
      bookId: selectedBook?.id || "",
      search: searchQuery,
    };
  }, [filters, selectedBook?.id, searchQuery, selectedMonth, showAllData]);

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
    refresh,
  } = useTransactions(combinedFilters);

  useEffect(() => {
    if (selectedBook) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${month}`;
      setSelectedMonth(currentMonth);
      setShowAllData(false); // Reset to current month when book changes
    }
  }, [selectedBook]);

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
    console.log("updatedTransaction", updatedTransaction);
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
      doc.text(
        `${showAllData ? "All Data" : `Month: ${selectedMonth}`}`,
        20,
        45
      );
      doc.text(`Total Transactions: ${pagination.totalCount}`, 20, 55);
      doc.text(`Total Income: ৳${totalIncome.toLocaleString()}`, 20, 65);
      doc.text(`Total Expenses: ৳${totalExpense.toLocaleString()}`, 20, 75);
      doc.text(
        `Net Balance: ৳${(totalIncome - totalExpense).toLocaleString()}`,
        20,
        85
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
        startY: 95,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249],
        },
      });

      const filename = showAllData
        ? `${selectedBook.name}-all-transactions.pdf`
        : `${selectedBook.name}-${selectedMonth}-transactions.pdf`;
      doc.save(filename);

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
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const filename = showAllData
      ? `${selectedBook.name}-all-transactions.csv`
      : `${selectedBook.name}-${selectedMonth}-transactions.csv`;
    link.setAttribute("download", filename);

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

  const handleFilterChange = (newFilters: TransactionFilters) => {
    console.log("newFilters", newFilters);
    setFilters(newFilters);
  };

  // New handler for month selector
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month === "all") {
      setShowAllData(true);
    } else {
      setShowAllData(false);
    }
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
        <BookAndMonthSelector
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
          selectedMonth={selectedMonth}
          onSelectMonth={handleMonthChange}
          booksInitialized={booksInitialized}
        />

        {!selectedBook ? (
          <EmptyBookState />
        ) : (
          <>
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
                canAddTransaction={canAddTransaction}
                pagination={pagination}
                onLoadMore={loadMore}
                loadingMore={loadingMore}
                loading={transactionsLoading}
                onFilterChange={handleFilterChange}
                onEditTransaction={handleEditTransaction}
                showEditForm={showEditForm}
                setShowEditForm={setShowEditForm}
              />
            )}
          </>
        )}
      </main>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
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
          {selectedBook && (
            <TransactionForm
              bookId={selectedBook.id}
              onSubmit={handleAddTransaction}
              onCancel={() => setShowAddForm(false)}
            />
          )}
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
};

export default Index;
