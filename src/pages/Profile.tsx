import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  PlusCircle,
  Save,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

const Profile = () => {
  const { user } = useAuth();
  const { books, setMonthlyBudget } = useBooks();
  const { toast } = useToast();
  const [selectedBookId, setSelectedBookId] = useState<string | "all">("all");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [budgetMonth, setBudgetMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const initialMonth = `${year}-${month}`; // e.g., "2025-07"
    console.log("Initial budgetMonth:", initialMonth); // Debug
    return initialMonth;
  });
  const [newBudget, setNewBudget] = useState("");

  // Reset budgetMonth when book changes
  useEffect(() => {
    if (selectedBookId !== "all") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${month}`; // e.g., "2025-07"
      console.log("Reset budgetMonth on book change:", currentMonth); // Debug
      setBudgetMonth(currentMonth);
    }
  }, [selectedBookId]);

  // Dynamic transaction filters based on book and time period
  const getDateRange = () => {
    const now = new Date();
    if (selectedTimePeriod === "month") {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0],
      };
    } else if (selectedTimePeriod === "year") {
      return {
        startDate: new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date(now.getFullYear(), 11, 31)
          .toISOString()
          .split("T")[0],
      };
    }
    return {};
  };

  const { transactions, loading: transactionsLoading } = useTransactions({
    bookId: selectedBookId !== "all" ? selectedBookId : undefined,
    ...getDateRange(),
  });

  // Calculate statistics
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netWorth = totalIncome - totalExpenses;

  // Get monthly budget for selected book and month
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const monthlyBudget =
    selectedBookId === "all"
      ? 5000 // Default for all books
      : selectedBook?.monthly_budgets?.find((b) => b.month === budgetMonth)
          ?.amount || 5000;
  const currentMonthExpenses =
    selectedTimePeriod === "month" ? totalExpenses : 3200;
  const budgetProgress = (currentMonthExpenses / monthlyBudget) * 100;

  // Activity stats
  const joinDate = new Date(user?.created_at || Date.now());
  const daysActive = Math.floor(
    (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recent activity
  const recentTransactions = transactions.slice(0, 5);
  const categoriesUsed = [...new Set(transactions.map((t) => t.category))]
    .length;

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetBudget = async () => {
    if (!selectedBookId || selectedBookId === "all" || !newBudget) return;
    try {
      await setMonthlyBudget(selectedBookId, budgetMonth, Number(newBudget));
      toast({
        title: "Budget set",
        description: `Budget of ৳${newBudget} set for ${budgetMonth}.`,
      });
      setNewBudget("");
    } catch (error: any) {
      toast({
        title: "Error setting budget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const timePeriods = [
    { value: "all", label: "All Time" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  // Generate last 12 months for budget selection
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push({
        value: `${year}-${month}`, // e.g., "2025-07"
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }), // e.g., "July 2025"
      });
    }
    console.log("Profile month options:", months); // Debug
    return months;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header
        showImportExport={false}
        title="CashBook"
        subtitle="Profile & Statistics"
      />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {user?.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name"
                        className="max-w-md"
                      />
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Avatar URL"
                        className="max-w-md"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleProfileUpdate}
                          className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Profile
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {user?.user_metadata?.display_name ||
                            user?.email?.split("@")[0] ||
                            "User"}
                        </h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="rounded-full">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {joinDate.toLocaleDateString()}
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            {daysActive} days active
                          </Badge>
                        </div>
                      </div>

                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Budget Setting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTimePeriod}
                onValueChange={setSelectedTimePeriod}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Time Period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Set Monthly Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Select
                  key={selectedBookId} // Force re-render when book changes
                  value={budgetMonth}
                  onValueChange={(value) => {
                    console.log("Budget month changed to:", value); // Debug
                    setBudgetMonth(value);
                  }}
                  disabled={selectedBookId === "all"}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue
                      placeholder="Select Month"
                      children={
                        getMonthOptions().find(
                          (month) => month.value === budgetMonth
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
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="Enter budget amount"
                  disabled={selectedBookId === "all"}
                  className="w-full sm:w-[200px]"
                />
                <Button
                  onClick={handleSetBudget}
                  disabled={selectedBookId === "all" || !newBudget}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Set Budget
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Books
                </CardTitle>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books.length}</div>
                <p className="text-xs text-muted-foreground">
                  Expense tracking books
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Total recorded transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    netWorth >= 0
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${
                      netWorth >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    netWorth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ৳{netWorth.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Income minus expenses
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <PlusCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoriesUsed}</div>
                <p className="text-xs text-muted-foreground">
                  Different categories used
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Budget Progress */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Monthly Budget Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    This Month's Spending
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ৳{currentMonthExpenses.toLocaleString()} / ৳
                    {monthlyBudget.toLocaleString()}
                  </span>
                </div>

                <Progress value={budgetProgress} className="h-3" />

                <div className="flex justify-between text-sm">
                  <span
                    className={
                      budgetProgress > 100 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {budgetProgress > 100 ? "Over budget" : "On track"}
                  </span>
                  <span className="text-muted-foreground">
                    ৳{(monthlyBudget - currentMonthExpenses).toLocaleString()}{" "}
                    remaining
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium text-green-600">
                      Total Income
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +৳{totalIncome.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm font-medium text-red-600">
                      Total Expenses
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -৳{totalExpenses.toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm font-medium">Net Balance</span>
                    <span
                      className={`text-sm font-bold ${
                        netWorth >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {netWorth >= 0 ? "+" : ""}৳{netWorth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground font-medium">
                      Loading transactions...
                    </p>
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              transaction.type === "income"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {transaction.note || transaction.category}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}৳
                            {Number(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      No transactions yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start tracking your expenses to see activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
