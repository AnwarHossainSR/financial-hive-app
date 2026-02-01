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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { useInvestmentProjects } from "@/hooks/useInvestmentProjects";
import { formatCurrency } from "@/lib/utils";
import { InvestmentProject } from "@/types/investment";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Edit,
  Filter,
  Plus,
  Search,
  Settings,
  SortAsc,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
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

  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Calculate days until completion for a project based on investment entries
  const getDaysUntilCompletion = (project: any) => {
    if (!project.investment_entries || project.investment_entries.length === 0) return null;
    
    // Find the latest maturity date from all entries
    const latestMaturityDate = project.investment_entries.reduce((latest: Date | null, entry: any) => {
      if (!entry.maturity_date) return latest;
      const entryDate = new Date(entry.maturity_date);
      return !latest || entryDate > latest ? entryDate : latest;
    }, null);
    
    if (!latestMaturityDate) return null;
    
    const today = new Date();
    const diffTime = latestMaturityDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate aggregate stats from all projects
  const aggregateStats = useMemo(() => {
    if (!platform?.projects) {
      return {
        totalInvested: 0,
        totalProfitLoss: 0,
        remainingCapital: 0,
        activeProjects: 0,
        completedProjects: 0,
        avgROI: 0,
      };
    }

    const stats = platform.projects.reduce(
      (acc, project) => {
        const invested = Number(project.total_investment || 0);
        const profitLoss = Number(project.total_profit_loss || 0);
        const remaining = Number(project.remaining_capital || 0);
        
        return {
          totalInvested: acc.totalInvested + invested,
          totalProfitLoss: acc.totalProfitLoss + profitLoss,
          remainingCapital: acc.remainingCapital + remaining,
          activeProjects: acc.activeProjects + (project.status === 'active' ? 1 : 0),
          completedProjects: acc.completedProjects + (project.status === 'completed' ? 1 : 0),
          avgROI: invested > 0 ? acc.avgROI + (profitLoss / invested * 100) : acc.avgROI,
        };
      },
      { totalInvested: 0, totalProfitLoss: 0, remainingCapital: 0, activeProjects: 0, completedProjects: 0, avgROI: 0 },
    );

    stats.avgROI = platform.projects.length > 0 ? stats.avgROI / platform.projects.length : 0;
    return stats;
  }, [platform?.projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!platform?.projects) return [];

    let filtered = platform.projects.filter((project: any) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'investment':
          aValue = Number(a.total_investment || 0);
          bValue = Number(b.total_investment || 0);
          break;
        case 'profit':
          aValue = Number(a.total_profit_loss || 0);
          bValue = Number(b.total_profit_loss || 0);
          break;
        case 'days':
          aValue = getDaysUntilCompletion(a) || 999999;
          bValue = getDaysUntilCompletion(b) || 999999;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [platform?.projects, searchTerm, statusFilter, sortBy, sortOrder]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Invested Card */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total Invested
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.totalInvested)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Across {platform.projects?.length || 0} projects
            </p>
          </CardContent>
        </Card>

        {/* Remaining Capital Card */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Current Value
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Target className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.remainingCapital)}
            </div>
            <p className="text-xs text-white/70 mt-1">Portfolio value</p>
          </CardContent>
        </Card>

        {/* Total Profit/Loss Card */}
        <Card
          className={`relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
            aggregateStats.totalProfitLoss >= 0
              ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-600 dark:via-green-600 dark:to-teal-600"
              : "bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 dark:from-rose-600 dark:via-red-600 dark:to-pink-600"
          }`}
        >
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total P&L
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
            <div className="text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(aggregateStats.totalProfitLoss)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {aggregateStats.avgROI.toFixed(1)}% avg ROI
            </p>
          </CardContent>
        </Card>

        {/* Project Status Card */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 dark:from-amber-600 dark:via-orange-600 dark:to-red-600 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Project Status
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-white">
              {aggregateStats.activeProjects}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Active • {aggregateStats.completedProjects} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-0 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800 border-0 shadow-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800 border-0 shadow-sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="profit">Profit/Loss</SelectItem>
                  <SelectItem value="days">Days Left</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-white dark:bg-slate-800 border-0 shadow-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">
            Projects ({filteredAndSortedProjects.length})
          </h2>
        </div>
        
        {filteredAndSortedProjects.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto opacity-20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No matching projects' : 'No projects in this platform'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : `Start by adding a project to ${platform.name}.`
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <CreateProjectDialog platformId={platform.id}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                </CreateProjectDialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredAndSortedProjects.map((project: any) => {
              const daysLeft = getDaysUntilCompletion(project);
              const profitLoss = Number(project.total_profit_loss || 0);
              const investment = Number(project.total_investment || 0);
              const roi = investment > 0 ? (profitLoss / investment * 100) : 0;
              
              return (
                <Card
                  key={project.id}
                  className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg cursor-pointer overflow-hidden relative ${
                    project.status === "completed" 
                      ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 opacity-75" 
                      : "bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 hover:scale-[1.02]"
                  }`}
                  onClick={() =>
                    router.push(`/investments/projects/${project.id}`)
                  }
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate font-bold">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            project.status === "active" ? "default" : "secondary"
                          }
                          className={`shrink-0 ${
                            project.status === "completed" ? "bg-gray-400 text-white" : ""
                          }`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pb-12">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(project.total_investment)}
                        </div>
                        <div className="text-xs text-muted-foreground">Investment</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(project.remaining_capital)}
                        </div>
                        <div className="text-xs text-muted-foreground">Current</div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
                        profitLoss >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {profitLoss >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {formatCurrency(profitLoss)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      {/* Days countdown - bottom left */}
                      {daysLeft !== null && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          project.status === "completed" 
                            ? "bg-gray-200 text-gray-600" 
                            : daysLeft <= 7 
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                              : daysLeft <= 30 
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          <Clock className="h-3 w-3" />
                          {project.status === "completed" 
                            ? "Completed" 
                            : daysLeft > 0 
                              ? `${daysLeft} days left` 
                              : `${Math.abs(daysLeft)} days over`
                          }
                        </div>
                      )}
                      
                      {/* Edit/Delete buttons - bottom right */}
                      <div className="flex gap-1">
                        <EditProjectDialog project={project}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </EditProjectDialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-white/80 hover:bg-red-50 shadow-sm text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
        verificationText={platform.name}
      />
    </div>
  );
}
