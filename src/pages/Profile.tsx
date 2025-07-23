import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import {
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  PlusCircle,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

export const Profile = () => {
  const { user } = useAuth();
  const { books } = useBooks();
  const { transactions } = useTransactions();

  // Calculate statistics
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netWorth = totalIncome - totalExpenses;

  // Monthly goals (mock data)
  const monthlyBudget = 5000;
  const currentMonthExpenses = 3200;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {user?.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {user?.user_metadata?.display_name ||
                          user?.email?.split("@")[0] ||
                          "User"}
                      </h1>
                      <p className="text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {joinDate.toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline">
                          {daysActive} days active
                        </Badge>
                      </div>
                    </div>

                    <Button>
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Books
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books.length}</div>
                <p className="text-xs text-muted-foreground">
                  Expense tracking books
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Total recorded transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Monthly Budget Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    This Month's Spending
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ৳{currentMonthExpenses.toLocaleString()} / $
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">
                      Total Income
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +৳{totalIncome.toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-600">
                      Total Expenses
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -৳{totalExpenses.toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction, index) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.type === "income"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
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
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start tracking your expenses to see activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
