"use client";

import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { EditPlatformDialog } from "@/components/EditPlatformDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { EmptyState } from "@/components/EmptyState";
import { InvestmentProjectCard } from "@/components/InvestmentProjectCard";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { useInvestmentProjects } from "@/hooks/useInvestmentProjects";
import { cn, formatTaka } from "@/lib/utils";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarClock,
  Edit,
  FolderOpen,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type PlatformProject = NonNullable<
  ReturnType<typeof useInvestmentPlatform>["platform"]
>["projects"][number];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

// Days until the latest entry matures; null when no entry has a date
const getDaysUntilCompletion = (project: {
  investment_entries?: { maturity_date?: string | Date | null }[];
}) => {
  const latest = (project.investment_entries ?? []).reduce<Date | null>(
    (acc, entry) => {
      if (!entry.maturity_date) return acc;
      const date = new Date(entry.maturity_date);
      return !acc || date > acc ? date : acc;
    },
    null,
  );
  if (!latest) return null;
  return Math.ceil((latest.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export default function PlatformDetailsPage() {
  const params = useParams();
  const platformId = params.id as string;
  const { platform, isLoading, deletePlatform } =
    useInvestmentPlatform(platformId);
  const { deleteProject } = useInvestmentProjects();

  const [projectToDelete, setProjectToDelete] =
    useState<PlatformProject | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<PlatformProject | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [platformEditOpen, setPlatformEditOpen] = useState(false);
  const [platformDeleteOpen, setPlatformDeleteOpen] = useState(false);
  const [isDeletingPlatform, setIsDeletingPlatform] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const projects = useMemo(
    () => platform?.projects ?? [],
    [platform?.projects],
  );

  const aggregateStats = useMemo(() => {
    const stats = projects.reduce(
      (acc, project) => {
        const invested = Number(project.total_investment || 0);
        const profitLoss = Number(project.total_profit_loss || 0);
        const remaining = Number(project.remaining_capital || 0);

        return {
          totalInvested: acc.totalInvested + invested,
          totalProfitLoss: acc.totalProfitLoss + profitLoss,
          remainingCapital: acc.remainingCapital + remaining,
          activeProjects:
            acc.activeProjects + (project.status === "active" ? 1 : 0),
          completedProjects:
            acc.completedProjects + (project.status === "completed" ? 1 : 0),
          avgROI:
            invested > 0
              ? acc.avgROI + (profitLoss / invested) * 100
              : acc.avgROI,
        };
      },
      {
        totalInvested: 0,
        totalProfitLoss: 0,
        remainingCapital: 0,
        activeProjects: 0,
        completedProjects: 0,
        avgROI: 0,
      },
    );
    stats.avgROI = projects.length > 0 ? stats.avgROI / projects.length : 0;
    return stats;
  }, [projects]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return counts;
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const valueOf = (project: PlatformProject): string | number => {
      switch (sortBy) {
        case "investment":
          return Number(project.total_investment || 0);
        case "profit":
          return Number(project.total_profit_loss || 0);
        case "days":
          return getDaysUntilCompletion(project) ?? 999999;
        default:
          return project.name.toLowerCase();
      }
    };

    return [...filtered].sort((a, b) => {
      // Completed projects always sink to the bottom
      const aCompleted = a.status === "completed" ? 1 : 0;
      const bCompleted = b.status === "completed" ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;

      const aValue = valueOf(a);
      const bValue = valueOf(b);
      const order = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === "asc" ? order : -order;
    });
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    setIsDeletingPlatform(true);
    try {
      // Navigation away is handled in the hook's onSuccess
      await deletePlatform(id);
      setPlatformDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete platform:", error);
    } finally {
      setIsDeletingPlatform(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <EmptyState
        icon={Layers}
        title="Platform not found"
        description="It may have been deleted, or you don't have access to it."
        action={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/investments">Back to investments</Link>
          </Button>
        }
      />
    );
  }

  const isUp = aggregateStats.totalProfitLoss >= 0;
  const isFiltering = !!searchTerm || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/investments", label: "Investments" }}
        icon={
          <span className="text-lg font-semibold">
            {platform.name.charAt(0).toUpperCase()}
          </span>
        }
        eyebrow="Investment platform"
        title={platform.name}
        description={platform.description}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Platform actions"
                  className="h-10 w-10 rounded-xl"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => setPlatformEditOpen(true)}
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                  Edit platform
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setPlatformDeleteOpen(true)}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete platform
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateProjectDialog platformId={platform.id}>
              <Button className="h-10 gap-2 rounded-xl shadow-primary">
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </CreateProjectDialog>
          </>
        }
      />

      <section
        aria-label="Platform summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatTile
          featured
          label="Current value"
          value={formatTaka(aggregateStats.remainingCapital)}
          icon={Wallet}
          hint="Portfolio value on this platform"
          className="col-span-2 lg:col-span-1"
        />
        <StatTile
          label="Total invested"
          value={formatTaka(aggregateStats.totalInvested)}
          icon={Layers}
          tone="primary"
          hint={`Across ${projects.length} project${projects.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Profit / loss"
          value={formatTaka(aggregateStats.totalProfitLoss, { signed: true })}
          icon={isUp ? TrendingUp : TrendingDown}
          tone={isUp ? "income" : "expense"}
          toneValue
          hint={`${aggregateStats.avgROI.toFixed(1)}% average ROI`}
        />
        <StatTile
          label="Active projects"
          value={aggregateStats.activeProjects}
          icon={CalendarClock}
          tone="warning"
          hint={`${aggregateStats.completedProjects} completed`}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="radiogroup"
            aria-label="Filter by status"
            className="flex w-full overflow-x-auto rounded-xl bg-muted p-1 scrollbar-hide lg:w-auto"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="radio"
                aria-checked={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  statusFilter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span className="rounded-full bg-muted-foreground/10 px-1.5 text-[10px] tabular-nums">
                  {statusCounts[tab.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-64 lg:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                aria-label="Search projects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl bg-card pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                aria-label="Sort by"
                className="h-10 w-[140px] rounded-xl bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="profit">Profit / loss</SelectItem>
                <SelectItem value="days">Days left</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              aria-label={
                sortOrder === "asc" ? "Sort descending" : "Sort ascending"
              }
              className="h-10 w-10 shrink-0 rounded-xl bg-card"
            >
              {sortOrder === "asc" ? (
                <ArrowUpNarrowWide className="h-4 w-4" />
              ) : (
                <ArrowDownWideNarrow className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {filteredAndSortedProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50">
            <EmptyState
              icon={isFiltering ? Search : FolderOpen}
              title={
                isFiltering ? "No matching projects" : "No projects here yet"
              }
              description={
                isFiltering
                  ? "Try a different search or status."
                  : `Add the first project you've invested in through ${platform.name}.`
              }
              action={
                !isFiltering && (
                  <CreateProjectDialog platformId={platform.id}>
                    <Button className="gap-2 rounded-xl">
                      <Plus className="h-4 w-4" />
                      Create project
                    </Button>
                  </CreateProjectDialog>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedProjects.map((project) => (
              <InvestmentProjectCard
                key={project.id}
                project={project}
                daysLeft={getDaysUntilCompletion(project)}
                onEdit={() => setProjectToEdit(project)}
                onDelete={() => setProjectToDelete(project)}
              />
            ))}
          </div>
        )}
      </section>

      {projectToEdit && (
        <EditProjectDialog
          project={projectToEdit}
          open={!!projectToEdit}
          onOpenChange={(open) => !open && setProjectToEdit(null)}
        />
      )}

      {projectToDelete && (
        <DeleteConfirmationModal
          open={!!projectToDelete}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
          onConfirmDelete={handleDeleteProject}
          isDeleting={isDeleting}
          title="Delete project?"
          description={`"${projectToDelete.name}" and all of its entries will be permanently deleted.`}
          deleteButtonText="Delete project"
          itemId={projectToDelete.id}
          verificationText={projectToDelete.name}
        />
      )}

      <EditPlatformDialog
        platform={platform}
        open={platformEditOpen}
        onOpenChange={setPlatformEditOpen}
      />

      <DeleteConfirmationModal
        open={platformDeleteOpen}
        onOpenChange={setPlatformDeleteOpen}
        onConfirmDelete={handleDeletePlatform}
        isDeleting={isDeletingPlatform}
        title="Delete platform?"
        description={`"${platform.name}" will be permanently deleted. Its ${projects.length} project${projects.length === 1 ? "" : "s"} won't be deleted, but will no longer be listed under any platform.`}
        deleteButtonText="Delete platform"
        itemId={platform.id}
        verificationText={platform.name}
      />
    </div>
  );
}
