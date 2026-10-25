import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export type StatTone = "primary" | "income" | "expense" | "warning" | "neutral";

const TONE_ICON: Record<StatTone, string> = {
  primary: "bg-primary/10 text-primary",
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  warning:
    "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  neutral: "bg-muted text-muted-foreground",
};

const TONE_BAR: Record<StatTone, string> = {
  primary: "bg-primary",
  income: "bg-income",
  expense: "bg-expense",
  warning: "bg-amber-500",
  neutral: "bg-muted-foreground",
};

export interface StatTrend {
  /** Signed percent change */
  value: number;
  /** Whether this direction is good news (more income, less expense) */
  isGood: boolean;
  label: string;
}

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  /** Color the value itself with the tone (for money in/out) */
  toneValue?: boolean;
  hint?: React.ReactNode;
  trend?: StatTrend;
  /** 0–100+, drawn as a bar; over 100 turns the bar to the expense color */
  progress?: number;
  /** Indigo gradient tile for the one number that matters most */
  featured?: boolean;
  className?: string;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  toneValue = false,
  hint,
  trend,
  progress,
  featured = false,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border p-4 sm:p-5",
        featured
          ? "border-transparent bg-gradient-primary text-primary-foreground shadow-primary"
          : "bg-card shadow-card",
        className,
      )}
    >
      {featured && (
        // Soft highlight so the gradient doesn't look flat
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-2xl"
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-medium sm:text-sm",
            featured ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9",
            featured ? "bg-white/15 text-primary-foreground" : TONE_ICON[tone],
          )}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
      </div>

      <div className="relative mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p
          className={cn(
            "truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
            !featured && toneValue && tone === "income" && "text-income",
            !featured && toneValue && tone === "expense" && "text-expense",
          )}
        >
          {value}
        </p>
        {trend && (
          <span
            title={trend.label}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              featured
                ? "bg-white/15 text-primary-foreground"
                : trend.isGood
                  ? "bg-income/10 text-income"
                  : "bg-expense/10 text-expense",
            )}
          >
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div
          className={cn(
            "relative mt-3 h-1.5 w-full overflow-hidden rounded-full",
            featured ? "bg-white/20" : "bg-muted",
          )}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700 ease-out",
              featured
                ? "bg-white"
                : progress > 100
                  ? "bg-expense"
                  : progress > 85
                    ? "bg-amber-500"
                    : TONE_BAR[tone],
            )}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}

      {(hint || trend) && (
        <p
          className={cn(
            "relative mt-auto truncate pt-2 text-xs",
            featured ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {hint}
          {hint && trend && " · "}
          {trend?.label}
        </p>
      )}
    </div>
  );
}
