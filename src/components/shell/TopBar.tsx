"use client";

import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { format } from "date-fns";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          aria-label="Financial Hive dashboard"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          <BrandMark withName className="h-8 w-8" />
        </Link>

        {/* Rendered on the client too; the date can differ from the server's */}
        <p
          suppressHydrationWarning
          className="hidden text-sm font-medium text-muted-foreground md:block"
        >
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationDropdown />
          <div className="ml-1 md:hidden">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
