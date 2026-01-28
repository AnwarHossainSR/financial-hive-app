"use client";

import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { EditPlatformDialog } from "@/components/EditPlatformDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { useInvestmentProjects } from "@/hooks/useInvestmentProjects";
import { formatCurrency } from "@/lib/utils";
import { InvestmentProject } from "@/types/investment";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Edit,
  Plus,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function PlatformDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const platformId = params.id as string;
  const { platform, isLoading, deletePlatform } =
    useInvestmentPlatform(platformId);
  const { deleteProject } = useInvestmentProjects();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] =
    useState<InvestmentProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Platform management state
  const [platformEditOpen, setPlatformEditOpen] = useState(false);
  const [platformDeleteOpen, setPlatformDeleteOpen] = useState(false);
  const [isDeletingPlatform, setIsDeletingPlatform] = useState(false);

  // Calculate aggregate stats from all projects
  const aggregateStats = useMemo(() => {
    if (!platform?.projects) {
      return {
        totalInvested: 0,
        totalProfitLoss: 0,
        remainingCapital: 0,
      };
    }

    const stats = platform.projects.reduce(
      (acc, project) => {
        return {
          totalInvested:
            acc.totalInvested + Number(project.total_investment || 0),
          totalProfitLoss:
            acc.totalProfitLoss + Number(project.total_profit_loss || 0),
          remainingCapital:
            acc.remainingCapital + Number(project.remaining_capital || 0),
        };
      },
      { totalInvested: 0, totalProfitLoss: 0, remainingCapital: 0 },
    );

    return stats;
  }, [platform?.projects]);

  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      setDeleteModalOpen(false);
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
      await deletePlatform(id);
      setPlatformDeleteOpen(false);
      // Navigation to home is handled in the hook's onSuccess
    } catch (error) {
      console.error("Failed to delete platform:", error);
    } finally {
      setIsDeletingPlatform(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
          <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Platform Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The platform you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {platform.name}
            </h1>
            {platform.description && (
              <p className="text-muted-foreground mt-1">
                {platform.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <CreateProjectDialog platformId={platform.id}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </CreateProjectDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Platform Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPlatformEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Platform
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPlatformDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Platform
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Total Invested Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total Invested
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.totalInvested)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Across {platform.projects?.length || 0} projects
            </p>
          </CardContent>
        </Card>

        {/* Remaining Capital Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Remaining Capital
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <ArrowDownRight className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.remainingCapital)}
            </div>
            <p className="text-xs text-white/70 mt-1">Current total value</p>
          </CardContent>
        </Card>

        {/* Total Profit/Loss Card */}
        <Card
          className={`relative overflow-hidden border-0 shadow-lg ${
            aggregateStats.totalProfitLoss >= 0
              ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-600 dark:via-green-600 dark:to-teal-600"
              : "bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 dark:from-rose-600 dark:via-red-600 dark:to-pink-600"
          }`}
        >
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total Profit/Loss
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              {aggregateStats.totalProfitLoss >= 0 ? (
                <TrendingUp className="h-5 w-5 text-white" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white" />
              )}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.totalProfitLoss)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {aggregateStats.totalProfitLoss >= 0
                ? "Total Profit"
                : "Total Loss"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold">Projects</h2>
        {(platform.projects || []).length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto opacity-20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No projects in this platform
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by adding a project to {platform.name}.
              </p>
              <CreateProjectDialog platformId={platform.id}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </CreateProjectDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(platform.projects || []).map((project: any) => (
              <Card
                key={project.id}
                className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 cursor-pointer"
                onClick={() =>
                  router.push(`/investments/projects/${project.id}`)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        project.status === "active" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Investment</span>
                      <span className="font-semibold">
                        {formatCurrency(project.total_investment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-semibold">
                        {formatCurrency(project.remaining_capital)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Profit/Loss</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          Number(project.total_profit_loss) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {Number(project.total_profit_loss) >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatCurrency(project.total_profit_loss)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <EditProjectDialog project={project}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </EditProjectDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Investment Project Modal */}
      {projectToDelete && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirmDelete={handleDeleteProject}
          isDeleting={isDeleting}
          title="Delete Project"
          description={`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone and will delete all associated entries.`}
          deleteButtonText="Delete Project"
          itemId={projectToDelete.id}
        />
      )}

      {/* Edit Platform Dialog */}
      <EditPlatformDialog
        platform={platform}
        open={platformEditOpen}
        onOpenChange={setPlatformEditOpen}
      >
        <span />
      </EditPlatformDialog>

      {/* Delete Platform Modal */}
      <DeleteConfirmationModal
        open={platformDeleteOpen}
        onOpenChange={setPlatformDeleteOpen}
        onConfirmDelete={handleDeletePlatform}
        isDeleting={isDeletingPlatform}
        title="Delete Platform"
        description={`Are you sure you want to delete "${platform.name}"? This action cannot be undone and will delete all projects and data associated with this platform.`}
        deleteButtonText="Delete Platform"
        itemId={platform.id}
      />
    </div>
  );
}
