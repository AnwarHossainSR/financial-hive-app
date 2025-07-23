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
        user={user}
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
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md animate-scale-in">
              <CardHeader className="px-4 sm:px-5 py-3 border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                    Recent Transactions
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all rounded-lg"
                    >
                      <Filter className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportCSV}
                      disabled={!canAddTransaction}
                      className="border-border text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all rounded-lg"
                    >
                      <Download className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                      disabled={!canAddTransaction}
                      className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Transaction</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-3">
                {transactionsLoading && !transactionsInitialized ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-muted rounded-lg animate-pulse"
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
                  <div className="text-center py-8 text-muted-foreground text-sm">
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
