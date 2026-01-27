"use client";

import { AddInvestmentEntryDialog } from "@/components/AddInvestmentEntryDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBankStatements,
  useInvestmentEntries,
  useInvestmentProject,
} from "@/hooks/useInvestmentDetails";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  Download,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, isLoading: isLoadingProject } =
    useInvestmentProject(projectId);
  const { entries, isLoading: isLoadingEntries } =
    useInvestmentEntries(projectId);
  const { statements, isLoading: isLoadingStatements } =
    useBankStatements(projectId);

  if (isLoadingProject) {
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
        <Link href="/investments">
          <Button>Back to Investments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={
              project.platform
                ? `/investments/platforms/${project.platform.id}`
                : "/investments"
            }
          >
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
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
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        {/* Global Actions like Edit Project could go here */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Investment
            </CardTitle>
            <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-full">
              <Wallet className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(project.total_investment)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Remaining Capital
            </CardTitle>
            <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-full">
              <DollarSign className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(project.remaining_capital)}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`bg-gradient-to-br border ${
            project.total_profit_loss >= 0
              ? "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800"
              : "from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/10 border-rose-200 dark:border-rose-800"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${
                project.total_profit_loss >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }`}
            >
              Total Profit/Loss
            </CardTitle>
            <div
              className={`p-2 rounded-full ${
                project.total_profit_loss >= 0
                  ? "bg-emerald-200/50 dark:bg-emerald-800/50"
                  : "bg-rose-200/50 dark:bg-rose-800/50"
              }`}
            >
              <ArrowUpRight
                className={`h-4 w-4 ${
                  project.total_profit_loss >= 0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                project.total_profit_loss >= 0
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-rose-900 dark:text-rose-100"
              }`}
            >
              {formatCurrency(project.total_profit_loss)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="entries" className="w-full">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="statements">Bank Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Investment Entries</h3>
            <AddInvestmentEntryDialog projectId={projectId}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Entry
              </Button>
            </AddInvestmentEntryDialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading entries...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{entry.platform || "-"}</TableCell>
                      <TableCell>{entry.investment_type}</TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell
                        className={
                          (entry.profit_loss || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {entry.profit_loss
                          ? formatCurrency(entry.profit_loss)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {entry.image_url ? (
                          <a
                            href={entry.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" /> View
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bank Statements</h3>
            {/* Add Statement Button would go here */}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Capital</TableHead>
                  <TableHead>Withdrawal</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStatements ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading statements...
                    </TableCell>
                  </TableRow>
                ) : statements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No bank statements found.
                    </TableCell>
                  </TableRow>
                ) : (
                  statements.map((statement: any) => (
                    <TableRow key={statement.id}>
                      <TableCell>
                        {format(new Date(statement.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(statement.total_capital)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(statement.total_withdrawal)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(statement.balance)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {statement.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
