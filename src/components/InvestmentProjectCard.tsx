"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPercent } from "@/lib/investments";
import { cn, formatTaka } from "@/lib/utils";
import { InvestmentProject } from "@/types/investment";
import { Clock, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: "bg-income/10 text-income ring-income/20",
  paused:
    "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  completed: "bg-muted text-muted-foreground ring-border",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
        PROJECT_STATUS_STYLES[status] ?? PROJECT_STATUS_STYLES.completed,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

interface InvestmentProjectCardProps {
  project: Pick<
    InvestmentProject,
    | "id"
    | "name"
    | "description"
    | "status"
    | "total_profit_loss"
    | "total_investment"
    | "remaining_capital"
    | "_count"
  >;
  /** Days until the latest entry matures; null when no entry has a date */
  daysLeft: number | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function InvestmentProjectCard({
  project,
  daysLeft,
  onEdit,
  onDelete,
}: InvestmentProjectCardProps) {
  const profitLoss = Number(project.total_profit_loss || 0);
  const investment = Number(project.total_investment || 0);
  const roi = investment > 0 ? (profitLoss / investment) * 100 : 0;
  const isCompleted = project.status === "completed";
  const entries = project._count?.entries;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated",
        isCompleted && "bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ProjectStatusBadge status={project.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${project.name}`}
              className="relative z-10 -mr-2 -mt-1 h-8 w-8 rounded-full text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={onEdit}>
              <Edit className="h-4 w-4 text-muted-foreground" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="mt-3 truncate text-base font-semibold transition-colors group-hover:text-primary">
        {/* Stretched link: the whole card opens the project */}
        <Link
          href={`/investments/projects/${project.id}`}
          className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {project.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {project.description || "No description"}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs text-muted-foreground">Invested</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatTaka(investment)}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs text-muted-foreground">Current</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatTaka(project.remaining_capital)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            profitLoss >= 0
              ? "bg-income/10 text-income"
              : "bg-expense/10 text-expense",
          )}
        >
          {formatTaka(profitLoss, { signed: true })}
          <span className="font-medium opacity-80">· {formatPercent(roi)}</span>
        </span>

        {daysLeft !== null && !isCompleted ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              daysLeft < 0
                ? "text-expense"
                : daysLeft <= 7
                  ? "text-expense"
                  : daysLeft <= 30
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {daysLeft >= 0
              ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : `${Math.abs(daysLeft)} days overdue`}
          </span>
        ) : (
          entries !== undefined && (
            <span className="text-xs text-muted-foreground">
              {entries} entr{entries === 1 ? "y" : "ies"}
            </span>
          )
        )}
      </div>
    </article>
  );
}
