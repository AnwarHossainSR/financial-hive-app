"use client";

import {
  setMonthlyBudgetAction,
  updateProfileAction,
} from "@/app/actions/profile";
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
import { createClient } from "@/lib/supabase/client";
import { TransactionFilters } from "@/types/transaction";
import {
  BookOpen,
  Calendar,
  Camera,
  CreditCard,
  DollarSign,
  Loader2,
  PlusCircle,
  Save,
  Target,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const supabase = createClient();

export default function ProfilePage() {
  const { user } = useAuth();
  const { books, setMonthlyBudget } = useBooks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBookId, setSelectedBookId] = useState<string | "all">("all");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [newBudget, setNewBudget] = useState("");

  // Update state when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
    }
  }, [user]);

  // Reset budgetMonth when book changes
  useEffect(() => {
    if (selectedBookId !== "all") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${month}`;
      setBudgetMonth(currentMonth);
    }
  }, [selectedBookId]);

  // Create transaction filters based on selections
  const transactionFilters: TransactionFilters = useMemo(() => {
    const filters: TransactionFilters = {};

    // Set book filter
    if (selectedBookId !== "all") {
      filters.bookId = selectedBookId;
    }

    // Set date range based on time period
    const now = new Date();
    if (selectedTimePeriod === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filters.startDate = startOfMonth.toISOString().split("T")[0];
      filters.endDate = endOfMonth.toISOString().split("T")[0];
    } else if (selectedTimePeriod === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      filters.startDate = startOfYear.toISOString().split("T")[0];
      filters.endDate = endOfYear.toISOString().split("T")[0];
    }

    return filters;
  }, [selectedBookId, selectedTimePeriod]);

  // Fetch transactions with filters
  const { transactions, loading: transactionsLoading } =
    useTransactions(transactionFilters);

  // Separate filters for current month expenses (for budget calculation)
  const currentMonthFilters: TransactionFilters = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      bookId: selectedBookId !== "all" ? selectedBookId : undefined,
      type: "expense",
      startDate: startOfMonth.toISOString().split("T")[0],
      endDate: endOfMonth.toISOString().split("T")[0],
    };
  }, [selectedBookId]);

  // Fetch current month expenses for budget calculation
  const { transactions: currentMonthTransactions } =
    useTransactions(currentMonthFilters);

  // Calculate statistics from filtered transactions
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netWorth = totalIncome - totalExpenses;

  // Calculate current month expenses for budget progress
  const currentMonthExpenses = currentMonthTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // Get monthly budget for selected book and month
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const monthlyBudget = useMemo(() => {
    if (selectedBookId === "all") {
      // For "all books", sum up all budgets for the current month or use default
      const totalBudget = books.reduce((sum, book) => {
        const budget = book.monthly_budgets?.find(
          (b) => b.month === budgetMonth
        );
        return sum + (budget?.amount || 5000); // Default 5000 per book if no budget set
      }, 0);
      return totalBudget || 5000;
    } else {
      // For specific book
      const budget = selectedBook?.monthly_budgets?.find(
        (b) => b.month === budgetMonth
      );
      return budget?.amount || 5000;
    }
  }, [selectedBookId, selectedBook, budgetMonth, books]);

  const budgetProgress =
    monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;

  // Activity stats
  const joinDate = new Date(user?.created_at || Date.now());
  const daysActive = Math.floor(
    (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const categoriesUsed = [...new Set(transactions.map((t) => t.category))]
    .length;

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  // Handle image file selection and upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      toast({
        title: "Image uploaded successfully",
        description:
          "Your profile image has been uploaded. Don't forget to save your profile.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description:
          error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const { success, error } = await updateProfileAction({
        displayName,
        avatarUrl,
      });

      if (error) throw new Error(error);

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
    if (!selectedBookId || selectedBookId === "all" || !newBudget) {
      toast({
        title: "Invalid selection",
        description: "Please select a specific book and enter a budget amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await setMonthlyBudgetAction(
        selectedBookId,
        budgetMonth,
        Number(newBudget)
      );

      if (error) throw new Error(error);

      toast({
        title: "Budget set",
        description: `Budget of ৳${Number(
          newBudget
        ).toLocaleString()} set for ${budgetMonth}.`,
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

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push({
        value: `${year}-${month}`,
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return months;
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const getFilterDisplayText = () => {
    const bookText =
      selectedBookId === "all"
        ? "All Books"
        : books.find((b) => b.id === selectedBookId)?.name || "Unknown Book";
    const periodText =
      timePeriods.find((p) => p.value === selectedTimePeriod)?.label ||
      "All Time";
    return `${bookText} • ${periodText}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100  ">
      <Header
        showImportExport={false}
        title="CashBook"
        subtitle="Profile & Statistics"
      />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-none shadow-xl bg-white  rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                      {user?.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>

                  {isEditingProfile && (
                    <div className="absolute -bottom-2 -right-2">
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 p-0"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name"
                        className="max-w-md"
                      />
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Profile Image
                        </label>
                        <div className="flex gap-2 max-w-md">
                          <Input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Avatar URL (or upload image above)"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                          >
                            {isUploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
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

          {/* Current Filter Display */}
          <Card className="border-none shadow-card rounded-lg bg-blue-50  border-blue-200 ">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600  font-medium">
                    Currently showing data for:
                  </p>
                  <p className="text-lg font-semibold text-blue-800 ">
                    {getFilterDisplayText()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {totalTransactions} transactions found
                  </p>
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

            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Set Monthly Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={budgetMonth}
                  onValueChange={setBudgetMonth}
                  disabled={selectedBookId === "all"}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select Month" />
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
            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Books
                </CardTitle>
                <div className="w-8 h-8 bg-blue-100  rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600 " />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books.length}</div>
                <p className="text-xs text-muted-foreground">
                  Expense tracking books
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <div className="w-8 h-8 bg-purple-100  rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600 " />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedTimePeriod === "all"
                    ? "Total"
                    : selectedTimePeriod === "month"
                    ? "This month"
                    : "This year"}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    netWorth >= 0
                      ? "bg-green-100 "
                      : "bg-red-100 "
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${
                      netWorth >= 0
                        ? "text-green-600 "
                        : "text-red-600 "
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
                  {formatCurrency(netWorth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Income minus expenses
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <div className="w-8 h-8 bg-orange-100  rounded-lg flex items-center justify-center">
                  <PlusCircle className="h-4 w-4 text-orange-600 " />
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
            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100  rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600 " />
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
                    {formatCurrency(currentMonthExpenses)} /{" "}
                    {formatCurrency(monthlyBudget)}
                  </span>
                </div>

                <Progress
                  value={Math.min(budgetProgress, 100)}
                  className="h-3"
                />

                <div className="flex justify-between text-sm">
                  <span
                    className={
                      budgetProgress > 100 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {budgetProgress > 100
                      ? `Over budget by ${formatCurrency(
                          currentMonthExpenses - monthlyBudget
                        )}`
                      : "On track"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(
                      Math.max(0, monthlyBudget - currentMonthExpenses)
                    )}{" "}
                    remaining
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="border-none shadow-card rounded-lg bg-white  bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100  rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600 " />
                  </div>
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50  rounded-lg">
                    <span className="text-sm font-medium text-green-600">
                      Total Income
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +{formatCurrency(totalIncome)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50  rounded-lg">
                    <span className="text-sm font-medium text-red-600">
                      Total Expenses
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -{formatCurrency(totalExpenses)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center p-3 bg-gray-50  rounded-lg">
                    <span className="text-sm font-medium">Net Balance</span>
                    <span
                      className={`text-sm font-bold ${
                        netWorth >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {netWorth >= 0 ? "+" : ""}
                      {formatCurrency(netWorth)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
