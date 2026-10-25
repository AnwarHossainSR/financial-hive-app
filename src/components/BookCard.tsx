"use client";

import { usePrefetchBook } from "@/hooks/useTransactions";
import { cn, formatTaka, getCurrentMonth } from "@/lib/utils";
import { Book } from "@/types/book";
import { ArrowUpRight, Building2, Star, UserRound } from "lucide-react";
import Link from "next/link";

export function BookCard({ book }: { book: Book }) {
  const prefetchBook = usePrefetchBook();
  const isBusiness = book.type === "business";
  const Icon = isBusiness ? Building2 : UserRound;
  const budget = book.monthly_budgets?.find(
    (b) => b.month === getCurrentMonth(),
  )?.amount;

  return (
    <Link
      href={`/book/${book.id}`}
      onPointerEnter={() => prefetchBook(book.id)}
      onFocus={() => prefetchBook(book.id)}
      onTouchStart={() => prefetchBook(book.id)}
      className="group relative flex flex-col rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            isBusiness
              ? "bg-income/10 text-income"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {book.is_default && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            <Star className="h-3 w-3 fill-current" />
            Default
          </span>
        )}
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
          {book.name}
        </h3>
        <p className="text-xs capitalize text-muted-foreground">
          {book.type} book
        </p>
      </div>

      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {book.description || "No description"}
      </p>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          {budget ? (
            <>
              Budget{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatTaka(budget)}
              </span>{" "}
              this month
            </>
          ) : (
            "No budget set this month"
          )}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
