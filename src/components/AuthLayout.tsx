import { BrandMark } from "@/components/shell/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, Calculator, LineChart } from "lucide-react";
import Link from "next/link";

const HIGHLIGHTS = [
  { icon: BookOpen, text: "Separate cashbooks for home, shop and family" },
  { icon: Calculator, text: "Type sums like 120+45 straight into the amount" },
  { icon: LineChart, text: "Budgets, trends and investment returns in ৳" },
];

/** Split screen: brand panel on large screens, the form on the right */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-primary p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />
        <Link href="/" className="relative w-fit">
          <BrandMark
            withName
            className="bg-white/15 shadow-none ring-1 ring-white/25"
            nameClassName="text-white"
          />
        </Link>

        <div className="relative my-auto max-w-md py-12">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Every taka,
            <br />
            accounted for.
          </h2>
          <p className="mt-4 text-base text-white/75">
            Jot down spends as they happen, watch the month add up against your
            budget, and keep investment returns in the same place.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Example of what the dashboard shows */}
        <div className="relative max-w-sm rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Net this month</span>
            <span>Example</span>
          </div>
          <p className="mt-1 text-3xl font-semibold tracking-tight">+৳18,250</p>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <p className="text-xs text-white/70">Income</p>
              <p className="font-semibold">৳62,000</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Expense</p>
              <p className="font-semibold">৳43,750</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[72%] rounded-full bg-white" />
          </div>
          <p className="mt-2 text-xs text-white/70">72% of monthly budget used</p>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <BrandMark withName />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 animate-fade-in">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Financial Hive
        </p>
      </main>
    </div>
  );
}
