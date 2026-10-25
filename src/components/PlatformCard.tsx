import { formatPercent, summarizeProjects } from "@/lib/investments";
import { cn, formatTaka } from "@/lib/utils";
import { PlatformWithProjects } from "@/types/investment";
import { format } from "date-fns";
import { ArrowUpRight, Layers } from "lucide-react";
import Link from "next/link";

export function PlatformCard({ platform }: { platform: PlatformWithProjects }) {
  const stats = summarizeProjects(platform.projects);
  const totalProjects = platform._count?.projects ?? stats.projectCount;
  const isUp = stats.totalProfitLoss >= 0;

  return (
    <Link
      href={`/investments/platforms/${platform.id}`}
      className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
            {platform.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
              {platform.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {totalProjects} project{totalProjects === 1 ? "" : "s"} ·{" "}
              {stats.activeProjects} active
            </p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {platform.description || "No description"}
      </p>

      {totalProjects > 0 ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Invested</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatTaka(stats.totalInvestment)}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Current value</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatTaka(stats.remainingCapital)}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                isUp ? "bg-income/10 text-income" : "bg-expense/10 text-expense",
              )}
            >
              {formatTaka(stats.totalProfitLoss, { signed: true })}
              <span className="font-medium opacity-80">
                · {formatPercent(stats.roi)}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              Since {format(new Date(platform.created_at), "MMM yyyy")}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-auto flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          No projects yet — open to add one
        </div>
      )}
    </Link>
  );
}
