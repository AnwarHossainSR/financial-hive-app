"use client";

import { EmptyState } from "@/components/EmptyState";
import { InvestmentEntryModal } from "@/components/InvestmentEntryModal";
import { ProjectStatusBadge } from "@/components/InvestmentProjectCard";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useInvestmentEntries,
  useInvestmentProject,
} from "@/hooks/useInvestmentDetails";
import { formatPercent } from "@/lib/investments";
import { cn, formatTaka } from "@/lib/utils";
import { format } from "date-fns";
import {
  ChevronRight,
  FileText,
  FolderOpen,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Entry = ReturnType<typeof useInvestmentEntries>["entries"][number];

const ENTRY_STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary ring-primary/20",
  pending:
    "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  completed: "bg-income/10 text-income ring-income/20",
  withdrawn: "bg-muted text-muted-foreground ring-border",
};

function EntryStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
        ENTRY_STATUS_STYLES[status] ?? ENTRY_STATUS_STYLES.withdrawn,
      )}
    >
      {status}
    </span>
  );
}

const daysUntil = (date?: string | Date | null) =>
  date
    ? Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

function MaturityLabel({ date }: { date?: string | Date | null }) {
  const days = daysUntil(date);
  if (!date || days === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-col">
      <span className="text-sm">{format(new Date(date), "MMM d, yyyy")}</span>
      <span
        className={cn(
          "text-xs font-medium",
          days < 0 || days <= 7
            ? "text-expense"
            : days <= 30
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
        )}
      >
        {days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
      </span>
    </span>
  );
}

const roiRange = (entry: Entry) =>
  entry.roi_min
    ? `${entry.roi_min}%${entry.roi_max && entry.roi_max !== entry.roi_min ? `–${entry.roi_max}%` : ""}`
    : "—";

function ActualProfit({ value }: { value?: number | null }) {
  const amount = Number(value || 0);
  if (amount === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        amount > 0 ? "text-income" : "text-expense",
      )}
    >
      {formatTaka(amount, { signed: true })}
    </span>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, isLoading: isLoadingProject } =
    useInvestmentProject(projectId);
  const {
    entries,
    isLoading: isLoadingEntries,
    deleteEntry,
  } = useInvestmentEntries(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const openEntry = (entry: Entry) => {
    setSelectedEntry(entry);
    setModalMode("view");
    setModalOpen(true);
  };

  const openAdd = () => {
    setModalMode("add");
    setSelectedEntry(null);
    setModalOpen(true);
  };

  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Project not found"
        description="It may have been deleted, or you don't have access to it."
        action={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/investments">Back to investments</Link>
          </Button>
        }
      />
    );
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const investment = Number(project.total_investment || 0);
  const roi =
    investment > 0 ? (Number(project.total_profit_loss) / investment) * 100 : 0;
  const typedEntries = entries;

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          project.platform
            ? {
                href: `/investments/platforms/${project.platform.id}`,
                label: project.platform.name,
              }
            : { href: "/investments", label: "Investments" }
        }
        eyebrow={<ProjectStatusBadge status={project.status} />}
        title={project.name}
        description={project.description}
        actions={
          <Button onClick={openAdd} className="h-10 gap-2 rounded-xl shadow-primary">
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        }
      />

      <section
        aria-label="Project summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatTile
          featured
          label="Remaining capital"
          value={formatTaka(project.remaining_capital)}
          icon={Wallet}
          hint="Current value"
          className="col-span-2 lg:col-span-1"
        />
        <StatTile
          label="Invested"
          value={formatTaka(project.total_investment)}
          icon={Layers}
          tone="primary"
          hint={`${formatPercent(roi)} ROI so far`}
        />
        <StatTile
          label="Total profit"
          value={formatTaka(project.total_profit)}
          icon={TrendingUp}
          tone="income"
          toneValue={Number(project.total_profit) > 0}
          hint="Earnings received"
        />
        <StatTile
          label="Loss & fees"
          value={formatTaka(project.total_loss)}
          icon={TrendingDown}
          tone="expense"
          toneValue={Number(project.total_loss) > 0}
          hint="Expenses and losses"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Investment entries</h2>
            <p className="text-sm text-muted-foreground">
              {typedEntries.length} entr{typedEntries.length === 1 ? "y" : "ies"}{" "}
              · tap one to view or edit
            </p>
          </div>
        </div>

        {isLoadingEntries ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : typedEntries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No entries yet"
            description="Record each order you place: amount, expected ROI and maturity date."
            action={
              <Button onClick={openAdd} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Add first entry
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="divide-y md:hidden">
              {typedEntries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => openEntry(entry)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{entry.order_no || "—"}
                        </span>
                        <EntryStatusBadge status={entry.status} />
                      </div>
                      <p className="text-base font-semibold tabular-nums">
                        {formatTaka(entry.investment_amount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.order_date
                          ? format(new Date(entry.order_date), "MMM d, yyyy")
                          : "—"}{" "}
                        · ROI {roiRange(entry)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <ActualProfit value={entry.actual_profit} />
                      <div className="mt-1 text-xs">
                        <MaturityLabel date={entry.maturity_date} />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[90px] pl-5">Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Actual P&amp;L</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Maturity</TableHead>
                    <TableHead className="w-10 pr-5" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      onClick={() => openEntry(entry)}
                      className="cursor-pointer"
                    >
                      <TableCell className="pl-5 font-mono text-xs text-muted-foreground">
                        #{entry.order_no || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {entry.order_date
                          ? format(new Date(entry.order_date), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatTaka(entry.investment_amount || 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {roiRange(entry)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.expected_profit
                          ? formatTaka(entry.expected_profit)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActualProfit value={entry.actual_profit} />
                      </TableCell>
                      <TableCell>
                        <EntryStatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <MaturityLabel date={entry.maturity_date} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <button
                          type="button"
                          aria-label={`View entry ${entry.order_no ?? ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEntry(entry);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>

      <InvestmentEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        entry={selectedEntry}
        mode={modalMode}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}
