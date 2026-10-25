"use client";

import { BookCard } from "@/components/BookCard";
import { BookFormDialog } from "@/components/BookFormDialog";
import { CashFlowChart } from "@/components/CashFlowChart";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatTile, type StatTrend } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useInvestmentPlatforms } from "@/hooks/useInvestmentPlatforms";
import { usePeriodTotals, useTransactionTotals } from "@/hooks/useTransactions";
import { formatPercent, summarizeProjects } from "@/lib/investments";
import {
  cn,
  formatTaka,
  getCurrentMonth,
  getMonthDateRange,
  getPreviousPeriodRange,
  getRecentMonths,
} from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Layers,
  PiggyBank,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const greetingFor = (hour: number) =>
  hour < 5
    ? "Good evening"
    : hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

/** No badge when there's nothing to compare against (avoids "+∞%") */
const trendFor = (
  current: number,
  before: number | undefined,
  upIsGood: boolean,
  label: string,
): StatTrend | undefined => {
  if (!before || before <= 0) return undefined;
  const value = Math.round(((current - before) / before) * 1000) / 10;
  return { value, isGood: value >= 0 === upIsGood, label };
};

export default function DashboardClient() {
  const { user } = useAuth();
  const { books, loading: booksLoading } = useBooks();
  const { platforms, isLoading: platformsLoading } = useInvestmentPlatforms();
  const [showCreateBook, setShowCreateBook] = useState(false);

  const firstName =
    (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "")
      .split(" ")[0];

  // This month across every book, compared with the same days last month
  const month = getCurrentMonth();
  const monthRange = useMemo(() => getMonthDateRange(month), [month]);
  const previousRange = useMemo(() => getPreviousPeriodRange(month), [month]);
  const { data: monthTotals, isLoading: monthLoading } =
    useTransactionTotals(monthRange);
  const { data: previousTotals } = useTransactionTotals({
    startDate: previousRange.startDate,
    endDate: previousRange.endDate,
  });

  const months = useMemo(() => getRecentMonths(6, month), [month]);
  const ranges = useMemo(
    () => months.map(({ startDate, endDate }) => ({ startDate, endDate })),
    [months],
  );
  const { data: periodTotals, isLoading: periodsLoading } = usePeriodTotals(
    {},
    ranges,
  );
  const cashFlow = months.map((m, i) => ({
    label: m.label,
    longLabel: m.longLabel,
    income: periodTotals?.[i]?.income ?? 0,
    expense: periodTotals?.[i]?.expense ?? 0,
  }));

  const income = monthTotals?.income ?? 0;
  const expense = monthTotals?.expense ?? 0;
  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : null;

  const portfolio = summarizeProjects(platforms.flatMap((p) => p.projects ?? []));
  const sortedBooks = [...books].sort(
    (a, b) =>
      Number(b.is_default) - Number(a.is_default) ||
      a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<span suppressHydrationWarning>{greetingFor(new Date().getHours())}{firstName ? `, ${firstName}` : ""}</span>}
        title="Your money at a glance"
        description="Everything across your books this month, plus how your investments are doing."
        actions={
          <Button
            onClick={() => setShowCreateBook(true)}
            className="gap-2 rounded-xl shadow-primary"
          >
            <Plus className="h-4 w-4" />
            New book
          </Button>
        }
      />

      {/* This month */}
      <section aria-label="This month" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {monthLoading ? (
          [0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              featured
              label="Net this month"
              value={formatTaka(net, { signed: true })}
              icon={Scale}
              hint={`${books.length} book${books.length === 1 ? "" : "s"}`}
              className="col-span-2 lg:col-span-1"
            />
            <StatTile
              label="Income"
              value={formatTaka(income)}
              icon={TrendingUp}
              tone="income"
              trend={trendFor(income, previousTotals?.income, true, previousRange.label)}
            />
            <StatTile
              label="Expense"
              value={formatTaka(expense)}
              icon={TrendingDown}
              tone="expense"
              trend={trendFor(expense, previousTotals?.expense, false, previousRange.label)}
            />
            <StatTile
              label="Savings rate"
              value={savingsRate === null ? "—" : `${Math.round(savingsRate)}%`}
              icon={PiggyBank}
              tone={savingsRate !== null && savingsRate < 0 ? "expense" : "primary"}
              hint={
                savingsRate === null
                  ? "No income recorded yet"
                  : "Of this month's income kept"
              }
              className="col-span-2 sm:col-span-1"
            />
          </>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <CashFlowChart
          className="lg:col-span-2"
          data={cashFlow}
          loading={periodsLoading}
          description="Income vs expense across all books, last 6 months"
        />

        {/* Portfolio snapshot */}
        <section className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Investments</h2>
              <p className="text-sm text-muted-foreground">
                Portfolio across {platforms.length} platform
                {platforms.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
          </div>

          {platformsLoading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : platforms.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <Layers className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No investments tracked</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Group projects by the platform you invest through.
              </p>
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/investments">Set up investments</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <p className="text-xs text-muted-foreground">Current value</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {formatTaka(portfolio.remainingCapital)}
                </p>
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-sm font-medium",
                    portfolio.totalProfitLoss >= 0 ? "text-income" : "text-expense",
                  )}
                >
                  {portfolio.totalProfitLoss >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {formatTaka(portfolio.totalProfitLoss, { signed: true })}
                  <span className="text-muted-foreground">
                    · {formatPercent(portfolio.roi)} ROI
                  </span>
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">Invested</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {formatTaka(portfolio.totalInvestment)}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">Active projects</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {portfolio.activeProjects}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      of {portfolio.projectCount}
                    </span>
                  </dd>
                </div>
              </dl>

              <ul className="mt-4 space-y-1">
                {platforms.slice(0, 3).map((platform) => {
                  const stats = summarizeProjects(platform.projects);
                  return (
                    <li key={platform.id}>
                      <Link
                        href={`/investments/platforms/${platform.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <span className="truncate font-medium">{platform.name}</span>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold tabular-nums",
                            stats.totalProfitLoss >= 0 ? "text-income" : "text-expense",
                          )}
                        >
                          {formatPercent(stats.roi)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-auto justify-between rounded-xl px-2 text-primary hover:text-primary"
              >
                <Link href="/investments">
                  View all investments
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </section>
      </div>

      {/* Books */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your books</h2>
            <p className="text-sm text-muted-foreground">
              Open a book to add transactions and track its budget.
            </p>
          </div>
        </div>

        {booksLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[196px] rounded-2xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50">
            <EmptyState
              icon={BookOpen}
              title="Create your first book"
              description="A book is a separate cashbook — one for personal spending, one for your shop, one for family."
              action={
                <Button
                  onClick={() => setShowCreateBook(true)}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Create a book
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            <button
              type="button"
              onClick={() => setShowCreateBook(true)}
              className="group flex min-h-[196px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">New book</span>
            </button>
          </div>
        )}
      </section>

      <BookFormDialog open={showCreateBook} onOpenChange={setShowCreateBook} />
    </div>
  );
}
