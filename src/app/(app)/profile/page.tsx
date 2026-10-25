"use client";

import { updateProfileAction } from "@/app/actions/profile";
import { PageHeader } from "@/components/PageHeader";
import { getInitials } from "@/components/shell/nav";
import { StatTile } from "@/components/StatTile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import {
  useCategoryTotals,
  useTransactionTotals,
  useTransactions,
} from "@/hooks/useTransactions";
import { createClient } from "@/lib/supabase/client";
import { cn, formatTaka, getCurrentMonth, getMonthDateRange } from "@/lib/utils";
import { Book } from "@/types/book";
import { TransactionFilters } from "@/types/transaction";
import { format, parse, subMonths } from "date-fns";
import {
  BookOpen,
  CalendarDays,
  Camera,
  Loader2,
  Pencil,
  Receipt,
  Save,
  Scale,
  Shapes,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const TIME_PERIODS = [
  { value: "all", label: "All time" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const monthOptions = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
  });
};

export default function ProfilePage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { books, setMonthlyBudget } = useBooks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBookId, setSelectedBookId] = useState<string>("all");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  // Edits start from the account's values; null means "not edited yet"
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonth);
  const [newBudget, setNewBudget] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  const displayName =
    displayNameDraft ?? (user?.user_metadata?.display_name || "");
  const avatarUrl = avatarDraft ?? (user?.user_metadata?.avatar_url || "");
  const shownName =
    displayName || user?.email?.split("@")[0] || "User";

  const transactionFilters: TransactionFilters = useMemo(() => {
    const filters: TransactionFilters = {};
    if (selectedBookId !== "all") filters.bookId = selectedBookId;

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

  // Count and income/expense totals come from the server over every matching
  // row, not just the first page of transactions
  const {
    pagination,
    totals,
    loading: statsLoading,
  } = useTransactions(transactionFilters);
  const { data: categoryTotals } = useCategoryTotals(transactionFilters);
  const categoriesUsed = new Set(
    (categoryTotals ?? []).map((c) => c.category),
  ).size;
  const net = totals.income - totals.expense;

  // Spending in the budget month, for the progress bar
  const budgetRange = useMemo(() => getMonthDateRange(budgetMonth), [budgetMonth]);
  const { data: budgetMonthTotals } = useTransactionTotals({
    ...budgetRange,
    type: "expense",
    bookId: selectedBookId !== "all" ? selectedBookId : undefined,
  });
  const monthExpenses = budgetMonthTotals?.expense ?? 0;

  const budgetFor = (book: Book) =>
    Number(book.monthly_budgets?.find((b) => b.month === budgetMonth)?.amount ?? 0);
  const typedBooks = books as Book[];
  const selectedBook = typedBooks.find((b) => b.id === selectedBookId);
  const monthlyBudget = selectedBook
    ? budgetFor(selectedBook)
    : typedBooks.reduce((sum, book) => sum + budgetFor(book), 0);
  const budgetProgress =
    monthlyBudget > 0 ? (monthExpenses / monthlyBudget) * 100 : 0;

  const joinDate = new Date(user?.created_at || Date.now());
  const daysActive = Math.floor(
    (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

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
      const filePath = `${user.id}/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      setAvatarDraft(publicUrl);
      toast({
        title: "Photo uploaded",
        description: "Save your profile to keep the new photo.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleProfileUpdate = async () => {
    setSavingProfile(true);
    try {
      const { error } = await updateProfileAction({ displayName, avatarUrl });
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
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSetBudget = async () => {
    if (!selectedBook || !newBudget) return;
    setSavingBudget(true);
    // The hook shows the toast and refreshes books so the bar updates
    const { error } = await setMonthlyBudget(
      selectedBook.id,
      budgetMonth,
      Number(newBudget),
    );
    setSavingBudget(false);
    if (!error) setNewBudget("");
  };

  const periodLabel =
    TIME_PERIODS.find((p) => p.value === selectedTimePeriod)?.label ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Your account and a summary of everything you've recorded."
      />

      {/* Identity */}
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
        <div
          aria-hidden
          className="h-24 bg-gradient-primary opacity-90 sm:h-28"
        />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative w-fit">
                <Avatar className="h-24 w-24 ring-4 ring-card sm:h-28 sm:w-28">
                  <AvatarImage src={avatarUrl} alt="" />
                  <AvatarFallback className="bg-gradient-primary text-2xl font-semibold text-white">
                    {getInitials(shownName)}
                  </AvatarFallback>
                </Avatar>
                {isEditingProfile && (
                  <Button
                    size="icon"
                    aria-label="Upload a new photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full ring-4 ring-card"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {!isEditingProfile && (
                <div className="pb-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {shownName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined {format(joinDate, "MMM d, yyyy")}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      {daysActive.toLocaleString()} days with Financial Hive
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!isEditingProfile && (
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(true)}
                className="gap-2 rounded-xl"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </Button>
            )}
          </div>

          {isEditingProfile && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayNameDraft(e.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avatar-url">Photo URL</Label>
                <Input
                  id="avatar-url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarDraft(e.target.value)}
                  placeholder="Paste a link, or use the camera button"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  onClick={handleProfileUpdate}
                  disabled={savingProfile}
                  className="gap-2 rounded-xl"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setDisplayNameDraft(null);
                    setAvatarDraft(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Statistics</h2>
            <p className="text-sm text-muted-foreground">
              {selectedBook?.name ?? "All books"} · {periodLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
              <SelectTrigger
                aria-label="Book"
                className="h-10 w-full rounded-xl bg-card sm:w-[180px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All books</SelectItem>
                {typedBooks.map((book) => (
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
              <SelectTrigger
                aria-label="Time period"
                className="h-10 w-full rounded-xl bg-card sm:w-[150px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statsLoading ? (
            [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[124px] rounded-2xl" />
            ))
          ) : (
            <>
              <StatTile
                featured
                label="Net balance"
                value={formatTaka(net, { signed: true })}
                icon={Scale}
                hint="Income minus expenses"
                className="col-span-2 lg:col-span-1"
              />
              <StatTile
                label="Transactions"
                value={pagination.totalCount.toLocaleString()}
                icon={Receipt}
                tone="primary"
                hint={periodLabel}
              />
              <StatTile
                label="Categories used"
                value={categoriesUsed}
                icon={Shapes}
                tone="warning"
                hint="Distinct categories"
              />
              <StatTile
                label="Books"
                value={typedBooks.length}
                icon={BookOpen}
                tone="neutral"
                hint="Personal & business"
                className="col-span-2 sm:col-span-1"
              />
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overview */}
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold">Money in &amp; out</h2>
          <p className="text-sm text-muted-foreground">
            {selectedBook?.name ?? "All books"} · {periodLabel}
          </p>
          <dl className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-income/5 p-3">
              <dt className="flex items-center gap-2 text-sm font-medium">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/10 text-income">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Income
              </dt>
              <dd className="font-semibold tabular-nums text-income">
                {formatTaka(totals.income, { signed: true })}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-expense/5 p-3">
              <dt className="flex items-center gap-2 text-sm font-medium">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense/10 text-expense">
                  <TrendingDown className="h-4 w-4" />
                </span>
                Expenses
              </dt>
              <dd className="font-semibold tabular-nums text-expense">
                {formatTaka(-totals.expense)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t px-3 pt-3">
              <dt className="text-sm font-medium">Net balance</dt>
              <dd
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  net >= 0 ? "text-income" : "text-expense",
                )}
              >
                {formatTaka(net, { signed: true })}
              </dd>
            </div>
          </dl>
        </section>

        {/* Budget */}
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Monthly budget</h2>
              <p className="text-sm text-muted-foreground">
                {selectedBook?.name ?? "All books"} ·{" "}
                {format(parse(budgetMonth, "yyyy-MM", new Date()), "MMMM yyyy")}
              </p>
            </div>
            <Select value={budgetMonth} onValueChange={setBudgetMonth}>
              <SelectTrigger
                aria-label="Budget month"
                className="h-9 w-[150px] rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl font-semibold tracking-tight">
                {formatTaka(monthExpenses)}
              </span>
              <span className="text-sm text-muted-foreground">
                {monthlyBudget > 0
                  ? `of ${formatTaka(monthlyBudget)}`
                  : "No budget set"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700",
                  budgetProgress > 100
                    ? "bg-expense"
                    : budgetProgress > 85
                      ? "bg-amber-500"
                      : "bg-primary",
                )}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>
            {monthlyBudget > 0 && (
              <p
                className={cn(
                  "text-xs font-medium",
                  budgetProgress > 100 ? "text-expense" : "text-muted-foreground",
                )}
              >
                {budgetProgress > 100
                  ? `Over budget by ${formatTaka(monthExpenses - monthlyBudget)}`
                  : `${formatTaka(monthlyBudget - monthExpenses)} left · ${Math.round(budgetProgress)}% used`}
              </p>
            )}
          </div>

          <div className="mt-5 border-t pt-4">
            {selectedBook ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSetBudget();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ৳
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder={
                      monthlyBudget > 0 ? String(monthlyBudget) : "Set amount"
                    }
                    aria-label="Budget amount"
                    className="h-10 rounded-xl pl-7"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newBudget || savingBudget}
                  className="gap-2 rounded-xl"
                >
                  {savingBudget ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  {monthlyBudget > 0 ? "Update" : "Set budget"}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                Choose a single book above to set its budget. With all books
                selected, budgets are added together.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
