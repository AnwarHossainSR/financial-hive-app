"use client";

import { AddInvestmentEntryDialog } from "@/components/AddInvestmentEntryDialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { InvestmentEntryDetailsDialog } from "@/components/InvestmentEntryDetailsDialog";
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleDeleteEntry = async (entryId: string) => {
    setIsDeleting(true);
    try {
      await deleteEntry(entryId);
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setIsDeleting(false);
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
              Total Investment
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
              {project.status === "completed"
                ? formatCurrency(project.total_profit)
                : "N/A"}
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
              {project.status === "completed"
                ? formatCurrency(project.total_loss)
                : "N/A"}
            </div>
            <p className="text-xs text-white/70 mt-1">Expenses & losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Entries Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold">Investment Entries</h2>
          <AddInvestmentEntryDialog projectId={projectId}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Entry</span>
            </Button>
          </AddInvestmentEntryDialog>
        </div>

        <Card className="border shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold w-[140px]">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Profit/Loss</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">
                    Remarks
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading entries...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                  entries.map((entry: any) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.investment_type === "Deposit"
                              ? "default"
                              : entry.investment_type === "Withdrawal"
                                ? "secondary"
                                : entry.investment_type === "Profit"
                                  ? "default"
                                  : "destructive"
                          }
                          className="font-medium"
                        >
                          {entry.investment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${
                          (entry.profit_loss || 0) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {entry.profit_loss ? (
                          <span className="flex items-center gap-1">
                            {entry.profit_loss >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {formatCurrency(entry.profit_loss)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[250px] truncate text-muted-foreground">
                        {entry.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <InvestmentEntryDetailsDialog
                            projectId={projectId}
                            entry={entry}
                            onDelete={(id) => {
                              setEntryToDelete(id);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </InvestmentEntryDetailsDialog>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setEntryToDelete(entry.id);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirmDelete={handleDeleteEntry}
          isDeleting={isDeleting}
          title="Delete Investment Entry"
          description="Are you sure you want to delete this entry? This action cannot be undone and will update your project totals."
          deleteButtonText="Delete Entry"
          itemId={entryToDelete}
        />
      )}
    </div>
  );
}
