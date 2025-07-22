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

  // Calculate totals from filtered transactions
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
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
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

    // Create CSV content
    const headers = ["Date", "Type", "Amount", "Category", "Note"];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [t.date, t.type, t.amount, `"${t.category}"`, `"${t.note || ""}"`].join(
          ","
        )
      ),
    ].join("\n");

    // Create and download file
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
      title: "Export successful",
      description: `Exported ${transactions.length} transactions to CSV.`,
    });
  };

  const canAddTransaction = selectedBook !== null;

  return (
    <div className="min-h-screen bg-background">
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
        onExportData={handleExportCSV}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Book Selector */}
        <BookSelector
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
        />

        {!selectedBook ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to CashBook
                </h3>
                <p className="text-muted-foreground mb-6">
                  Select a book above to start tracking your income and expenses
                </p>
                <p className="text-sm text-muted-foreground">
                  Books help you organize different types of expenses like
                  personal, business, or project-specific costs.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <div className="flex items-center space-x-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>

                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportCSV}
                      disabled={!canAddTransaction}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Import
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                      disabled={!canAddTransaction}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {transactionsLoading && !transactionsInitialized ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
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
                  <div className="text-center py-8 text-muted-foreground">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add New Transaction
              {selectedBook && (
                <span className="text-sm font-normal text-muted-foreground block">
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
