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
          <Link href="/investments">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investment
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(project.total_investment)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Capital
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(project.remaining_capital)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profit/Loss
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                project.total_profit_loss >= 0
                  ? "text-green-600"
                  : "text-red-600"
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
