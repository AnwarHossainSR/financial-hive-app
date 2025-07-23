import { BalanceCard } from "@/components/BalanceCard";
import { BookSelector } from "@/components/BookSelector";
import { CSVImport } from "@/components/CSVImport";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Book } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import { BookOpen, Download, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

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

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    toast({
      title: "Transaction Deleted",
      description: "The transaction was successfully removed.",
    });
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
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header
        currentBook={selectedBook?.name || "No book selected"}
        user={user}
        onAddTransaction={() => {
          if (!canAddTransaction) {
            toast({
              title: "Select a book first",
              description: "Please select a book before adding transactions.",
              variant: "destructive",
            });
            return;
          }
          setShowAddForm(true);
        }}
        onSignOut={signOut}
        onImportPDF={handleImportCSV}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Book Selector */}
        <div className="relative">
          <BookSelector
            selectedBook={selectedBook}
            onSelectBook={setSelectedBook}
          />
        </div>

        {!selectedBook ? (
          <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-20 h-20 mx-auto mb-6 text-blue-500 dark:text-blue-400 animate-bounce" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Welcome to CashBook
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Select a book above to start tracking your income and expenses
                with ease.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organize your finances by creating books for personal, business,
                or project-specific expenses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BalanceCard
                title="Total Balance"
                amount={balance}
                type="balance"
                subtitle={`${selectedBook.name} • Current balance`}
                trend={{ value: 12.5, isPositive: balance > 0 }}
              />
              <BalanceCard
                title="Total Income"
                amount={totalIncome}
                type="income"
                subtitle={`${selectedBook.name} • All time`}
              />
              <BalanceCard
                title="Total Expenses"
                amount={totalExpense}
                type="expense"
                subtitle={`${selectedBook.name} • All time`}
              />
            </div>

            {/* Quick Stats */}
            <QuickStats
              monthlyIncome={totalIncome}
              monthlyExpense={totalExpense}
              transactionCount={transactions.length}
              savingsGoal={5000}
            />

            {/* Recent Transactions */}
            <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Recent Transactions
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-72 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportCSV}
                      disabled={!canAddTransaction}
                      className="border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Import
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                      disabled={!canAddTransaction}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {transactionsLoading && !transactionsInitialized ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={handleDeleteTransaction}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No transactions match your search."
                      : "No transactions yet. Add your first transaction to get started!"}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Add New Transaction
              {selectedBook && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 block">
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
    </div>
  );
};

export default Index;
