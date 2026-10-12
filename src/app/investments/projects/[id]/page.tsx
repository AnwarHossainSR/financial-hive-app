"use client";

import { InvestmentEntryModal } from "@/components/InvestmentEntryModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Eye,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

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
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  if (isLoadingProject) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
          <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-lg border bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The project you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Link href="/dashboard">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={
              project.platform
                ? `/investments/platforms/${project.platform.id}`
                : "/"
            }
          >
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              {project.platform && (
                <Badge variant="outline" className="text-muted-foreground">
                  {project.platform.name}
                </Badge>
              )}
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
              >
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Investment Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Invested Amount
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(project.total_investment)}
            </div>
            <p className="text-xs text-white/70 mt-1">Initial capital</p>
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
              {formatCurrency(project.remaining_capital)}
            </div>
            <p className="text-xs text-white/70 mt-1">Current value</p>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-600 dark:via-green-600 dark:to-teal-600">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total Profit
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(project.total_profit)}
            </div>
            <p className="text-xs text-white/70 mt-1">Earnings received</p>
          </CardContent>
        </Card>

        {/* Total Loss Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 dark:from-rose-600 dark:via-red-600 dark:to-pink-600">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/90">
              Total Loss / Fees
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(project.total_loss)}
            </div>
            <p className="text-xs text-white/70 mt-1">Expenses & losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Entries Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold">Investment Entries</h2>
          <Button size="sm" className="gap-2" onClick={() => {
            setModalMode("add");
            setSelectedEntry(null);
            setModalOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Entry</span>
          </Button>
        </div>

        <Card className="border shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold w-[100px]">
                    Order No
                  </TableHead>
                  <TableHead className="font-semibold w-[120px]">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">ROI</TableHead>
                  <TableHead className="font-semibold">Expected</TableHead>
                  <TableHead className="font-semibold">Actual P&L</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">
                    Maturity
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading entries...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-12 w-12 opacity-20" />
                        <p className="font-medium">No entries found</p>
                        <p className="text-sm">
                          Add your first investment entry to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry: any) => {
                    const daysLeft = entry.maturity_date 
                      ? Math.ceil((new Date(entry.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <TableRow
                        key={entry.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="font-mono text-xs">
                            #{entry.order_no || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {entry.order_date ? format(new Date(entry.order_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(entry.investment_amount || 0)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            {entry.roi_min && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.roi_min}%{entry.roi_max && entry.roi_max !== entry.roi_min ? `-${entry.roi_max}%` : ''}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                          {entry.expected_profit ? formatCurrency(entry.expected_profit) : '-'}
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${
                            (entry.actual_profit || 0) >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {Number(entry.actual_profit || 0) !== 0 ? (
                            <span className="flex items-center gap-1">
                              {Number(entry.actual_profit || 0) > 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {formatCurrency(Math.abs(Number(entry.actual_profit || 0)))}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge 
                            variant={entry.status === 'active' ? 'default' : entry.status === 'completed' ? 'secondary' : 'outline'} 
                            className="capitalize"
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {entry.maturity_date ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.maturity_date), "MMM d, yyyy")}
                              </span>
                              {daysLeft !== null && (
                                <Badge 
                                  variant={daysLeft <= 7 ? "destructive" : daysLeft <= 30 ? "secondary" : "outline"}
                                  className="text-xs w-fit"
                                >
                                  {daysLeft > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d over`}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedEntry(entry);
                                setModalMode("view");
                                setModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Investment Entry Modal */}
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
