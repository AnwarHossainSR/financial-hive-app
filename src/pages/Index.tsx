import { useState } from 'react';
import { Header } from '@/components/Header';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickStats } from '@/components/QuickStats';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionForm } from '@/components/TransactionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Transaction type definition
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
  image_url?: string;
}

// Mock data - will be replaced with Supabase data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income' as const,
    amount: 5000,
    category: 'Salary',
    note: 'Monthly salary payment',
    date: '2024-01-15',
  },
  {
    id: '2', 
    type: 'expense' as const,
    amount: 1200,
    category: 'Bills & Utilities',
    note: 'Monthly rent payment',
    date: '2024-01-14',
  },
  {
    id: '3',
    type: 'expense' as const,
    amount: 89.50,
    category: 'Food & Dining',
    note: 'Grocery shopping at Whole Foods',
    date: '2024-01-13',
  },
  {
    id: '4',
    type: 'income' as const,
    amount: 750,
    category: 'Freelance',
    note: 'Web design project completion',
    date: '2024-01-12',
  }
];

const Index = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(t =>
    t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [transaction, ...prev]);
    setShowAddForm(false);
    toast({
      title: "Transaction Added",
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of $${transaction.amount} has been recorded.`,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been removed.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentBook="Personal Finance"
        onAddTransaction={() => setShowAddForm(true)}
        onImportPDF={() => toast({ title: "Coming Soon", description: "PDF import will be available after Supabase connection" })}
        onExportData={() => toast({ title: "Coming Soon", description: "CSV export will be available after Supabase connection" })}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCard
            title="Total Balance"
            amount={balance}
            type="balance"
            subtitle="Current balance"
            trend={{ value: 12.5, isPositive: balance > 0 }}
          />
          <BalanceCard
            title="Total Income"
            amount={totalIncome}
            type="income"
            subtitle="This month"
          />
          <BalanceCard
            title="Total Expenses"
            amount={totalExpense}
            type="expense"
            subtitle="This month"
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
                
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No transactions match your search.' : 'No transactions yet. Add your first transaction to get started!'}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleAddTransaction}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
