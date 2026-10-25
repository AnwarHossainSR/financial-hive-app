"use client";

import { BookFormDialog } from "@/components/BookFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBooks } from "@/hooks/useBooks";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePrefetchBook } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { Building2, Plus, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./BrandMark";
import { NAV_ITEMS, isNavActive } from "./nav";
import { UserMenu } from "./UserMenu";

// At md the sidebar is an icon rail; labels show from lg up
const railTooltip = "lg:hidden";

function NavLink({
  href,
  label,
  active,
  icon,
  onPointerEnter,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onPointerEnter?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onPointerEnter={onPointerEnter}
          onFocus={onPointerEnter}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring md:justify-center lg:justify-start",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {active && (
            <span
              aria-hidden
              className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
            />
          )}
          {icon}
          <span className="truncate md:sr-only lg:not-sr-only">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className={railTooltip}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const { books, loading } = useBooks();
  const isAdmin = useIsAdmin();
  const prefetchBook = usePrefetchBook();
  const [showCreateBook, setShowCreateBook] = useState(false);

  // Default book first, then alphabetical, matching how people think of them
  const sortedBooks = [...books].sort(
    (a, b) =>
      Number(b.is_default) - Number(a.is_default) ||
      a.name.localeCompare(b.name),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar md:flex md:w-[76px] lg:w-64">
      <div className="flex h-16 shrink-0 items-center px-5 md:justify-center lg:justify-start">
        <Link
          href="/dashboard"
          aria-label="Financial Hive dashboard"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark
            withName
            nameClassName="hidden text-foreground lg:inline"
          />
        </Link>
      </div>

      <nav
        aria-label="Main"
        className="flex-1 space-y-7 overflow-y-auto px-3 py-4 scrollbar-hide"
      >
        <div className="space-y-1">
          <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 lg:block">
            Menu
          </p>
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
            ({ href, label, icon: Icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                active={isNavActive(pathname, href)}
                icon={<Icon className="h-[18px] w-[18px] shrink-0" />}
              />
            ),
          )}
        </div>

        <div className="space-y-1">
          <div className="mb-2 flex items-center justify-between px-3 md:justify-center lg:justify-between">
            <p className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 lg:block">
              Books
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowCreateBook(true)}
                  aria-label="Create book"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">New book</TooltipContent>
            </Tooltip>
          </div>

          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <Skeleton className="hidden h-3.5 flex-1 lg:block" />
                </div>
              ))
            : sortedBooks.map((book) => {
                const Icon = book.type === "business" ? Building2 : UserRound;
                return (
                  <NavLink
                    key={book.id}
                    href={`/book/${book.id}`}
                    label={book.name}
                    active={pathname === `/book/${book.id}`}
                    onPointerEnter={() => prefetchBook(book.id)}
                    icon={
                      <span
                        className={cn(
                          "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                          book.type === "business"
                            ? "bg-income/10 text-income"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {book.is_default && (
                          <Star className="absolute -right-1 -top-1 h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        )}
                      </span>
                    }
                  />
                );
              })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <UserMenu variant="full" />
      </div>

      <BookFormDialog open={showCreateBook} onOpenChange={setShowCreateBook} />
    </aside>
  );
}
