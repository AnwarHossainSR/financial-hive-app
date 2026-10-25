import { HeroTape } from "@/components/landing/HeroTape";
import { SignedInRedirect } from "@/components/landing/SignedInRedirect";
import { BrandMark } from "@/components/shell/BrandMark";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  FileDown,
  FileUp,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Hind_Siliguri } from "next/font/google";
import Link from "next/link";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const bangla = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["500", "600"],
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  title: { absolute: "Financial Hive — Every taka, accounted for" },
  description:
    "A cashbook for daily spending, monthly budgets and investment returns. Type your spends as you go and see the month add up in ৳.",
};

// Shared visual tokens (also used in HeroTape):
// ink #141B34 · paper #F5F6FA · hive blue #3B5BFD · mint #12B981 · rose #F43F5E
const card =
  "rounded-3xl border border-[#141B34]/10 bg-white p-6 dark:border-white/10 dark:bg-[#121933]";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B5BFD]";
const primaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#141B34] px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-[#141B34]",
  focusRing,
);
const secondaryCta = cn(
  "inline-flex h-12 items-center justify-center rounded-full border border-[#141B34]/15 px-6 text-sm font-semibold text-[#141B34] transition-colors hover:bg-[#141B34]/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10",
  focusRing,
);

export default function LandingPage() {
  return (
    <div
      className={cn(
        display.variable,
        bangla.variable,
        "min-h-screen bg-[#F5F6FA] text-[#141B34] dark:bg-[#0B1020] dark:text-[#E7EAF6]",
      )}
    >
      <SignedInRedirect />

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className={cn("flex items-center gap-2.5 rounded-lg", focusRing)}
        >
          <BrandMark />
          <span className="text-lg font-bold tracking-tight [font-family:var(--font-display)]">
            Financial Hive
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#features"
            className={cn(
              "hidden rounded-full px-3 py-2 text-sm text-[#141B34]/70 hover:text-[#141B34] dark:text-white/60 dark:hover:text-white md:inline",
              focusRing,
            )}
          >
            Features
          </a>
          <a
            href="#investments"
            className={cn(
              "hidden rounded-full px-3 py-2 text-sm text-[#141B34]/70 hover:text-[#141B34] dark:text-white/60 dark:hover:text-white md:inline",
              focusRing,
            )}
          >
            Investments
          </a>
          <Link
            href="/login"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium hover:bg-[#141B34]/5 dark:hover:bg-white/10",
              focusRing,
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "rounded-full bg-[#3B5BFD] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F4BE0]",
              focusRing,
            )}
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16 lg:gap-20">
          <div>
            <p className="text-sm font-medium text-[#3B5BFD] dark:text-[#8EA2FF]">
              Cashbooks, budgets and investments in ৳
            </p>
            <h1 className="mt-4 text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[0.95] tracking-[-0.035em] [font-family:var(--font-display)]">
              Every taka,
              <br />
              accounted for.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#141B34]/70 dark:text-white/65">
              Jot down spends the moment they happen, watch the month add up
              against your budget, and keep investment returns in the same
              place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={primaryCta}>
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={secondaryCta}>
                I already have one
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#141B34]/55 dark:text-white/50">
              <li>Works on your phone</li>
              <li aria-hidden>·</li>
              <li>No bank login needed</li>
              <li aria-hidden>·</li>
              <li>Export to PDF &amp; CSV</li>
            </ul>
          </div>

          <HeroTape />
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-8 px-4 pb-20 pt-6 sm:px-6 md:pt-10"
        >
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight [font-family:var(--font-display)] sm:text-4xl">
            Everything your paper khata did, with the sums done for you.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            {/* Books */}
            <article className={cn(card, "md:col-span-4")}>
              <h3 className="text-lg font-semibold">
                A separate book for each part of life
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#141B34]/65 dark:text-white/60">
                Home, shop, family — each book keeps its own transactions and
                monthly budget.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { name: "Personal", used: 72, isDefault: true },
                  { name: "Shop", used: 41 },
                  { name: "Family", used: 93 },
                ].map((book) => (
                  <div
                    key={book.name}
                    className="rounded-2xl bg-[#F5F6FA] p-4 dark:bg-white/5"
                  >
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {book.name}
                      {book.isDefault && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#141B34]/10 dark:bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          book.used > 90 ? "bg-[#F43F5E]" : "bg-[#3B5BFD]",
                        )}
                        style={{ width: `${book.used}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#141B34]/55 dark:text-white/50">
                      {book.used}% of budget
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* Maths in the amount field */}
            <article className={cn(card, "md:col-span-2")}>
              <h3 className="text-lg font-semibold">Type the maths</h3>
              <p className="mt-1 text-sm text-[#141B34]/65 dark:text-white/60">
                Enter <span className="font-mono">120+45+30</span> and it works
                out the amount.
              </p>
              <div className="mt-6 rounded-2xl bg-[#F5F6FA] p-4 font-mono dark:bg-white/5">
                <p className="text-xs text-[#141B34]/50 dark:text-white/45">
                  Amount
                </p>
                <p className="mt-1 text-lg">৳ 120+45+30</p>
                <p className="mt-1 text-sm text-[#3B5BFD] dark:text-[#8EA2FF]">
                  = ৳195
                </p>
              </div>
            </article>

            {/* Daily totals */}
            <article className={cn(card, "md:col-span-2")}>
              <h3 className="text-lg font-semibold">See each day add up</h3>
              <p className="mt-1 text-sm text-[#141B34]/65 dark:text-white/60">
                Transactions are grouped by day with that day&apos;s total.
              </p>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-[#141B34]/50 dark:text-white/45">
                  <span>Today</span>
                  <span className="text-[#F43F5E]">−৳1,018</span>
                </div>
                {[
                  ["Groceries", "−৳768"],
                  ["Lunch", "−৳250"],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex justify-between rounded-xl bg-[#F5F6FA] px-3 py-2 dark:bg-white/5"
                  >
                    <span>{label}</span>
                    <span className="tabular-nums">{amount}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Trends */}
            <article className={cn(card, "md:col-span-2")}>
              <h3 className="text-lg font-semibold">
                Know if this month is worse
              </h3>
              <p className="mt-1 text-sm text-[#141B34]/65 dark:text-white/60">
                Spending is compared with the same days of last month.
              </p>
              <div className="mt-6 flex items-end justify-between rounded-2xl bg-[#F5F6FA] p-4 dark:bg-white/5">
                <div>
                  <p className="text-xs text-[#141B34]/50 dark:text-white/45">
                    Expense
                  </p>
                  <p className="text-2xl font-semibold tabular-nums [font-family:var(--font-display)]">
                    ৳21,491
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F43F5E]/10 px-2 py-0.5 text-xs font-medium text-[#F43F5E]">
                    <ArrowUpRight className="h-3 w-3" />
                    8.3%
                  </span>
                  <p className="mt-1 text-[11px] text-[#141B34]/45 dark:text-white/40">
                    vs Sep 1–12
                  </p>
                </div>
              </div>
            </article>

            {/* Import / export */}
            <article className={cn(card, "md:col-span-2")}>
              <h3 className="text-lg font-semibold">Bring it in, take it out</h3>
              <p className="mt-1 text-sm text-[#141B34]/65 dark:text-white/60">
                Import old records from CSV. Export statements and receipts as
                PDF.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-[#F5F6FA] px-3 py-3 dark:bg-white/5">
                  <FileUp className="h-4 w-4 text-[#12B981]" />
                  CSV in
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-[#F5F6FA] px-3 py-3 dark:bg-white/5">
                  <FileDown className="h-4 w-4 text-[#3B5BFD]" />
                  PDF out
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Investments */}
        <section
          id="investments"
          className="scroll-mt-8 bg-[#141B34] text-white dark:bg-[#121933]"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[#8EA2FF]">Investments</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight [font-family:var(--font-display)] sm:text-4xl">
                Your returns, next to your spending.
              </h2>
              <p className="mt-4 max-w-md text-white/65">
                Group projects by the platform you invested through, log what
                went in and what came back, and see profit and ROI for every
                project.
              </p>
            </div>

            <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="text-sm font-semibold">Agro platform</p>
              <p className="text-xs text-white/50">3 projects</p>
              <ul className="mt-4 space-y-2">
                {[
                  { name: "Cattle batch 4", invested: "৳50,000", roi: 12.4 },
                  { name: "Poultry cycle 2", invested: "৳20,000", roi: 8.1 },
                  { name: "Fish farm", invested: "৳35,000", roi: -2.6 },
                ].map((project) => (
                  <li
                    key={project.name}
                    className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-white/50">
                        Invested {project.invested}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-sm tabular-nums",
                        project.roi >= 0 ? "text-[#12B981]" : "text-[#F43F5E]",
                      )}
                    >
                      {project.roi >= 0 ? "+" : "−"}
                      {Math.abs(project.roi)}% ROI
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-[11px] text-white/40">
                Example data
              </p>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <h2 className="mx-auto max-w-xl text-3xl font-bold leading-tight tracking-tight [font-family:var(--font-display)] sm:text-5xl">
            Start with one book. Add today&apos;s spends.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={primaryCta}>
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={secondaryCta}>
              Log in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#141B34]/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[#141B34]/55 sm:flex-row sm:px-6 dark:text-white/45">
          <p>© {new Date().getFullYear()} Financial Hive</p>
          <div className="flex gap-5">
            <Link href="/login" className={cn("rounded", focusRing)}>
              Log in
            </Link>
            <Link href="/signup" className={cn("rounded", focusRing)}>
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
