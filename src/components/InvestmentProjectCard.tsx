"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { InvestmentProject } from "@/types/investment";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";

interface InvestmentProjectCardProps {
  project: InvestmentProject;
}

export function InvestmentProjectCard({ project }: InvestmentProjectCardProps) {
  const isPositive = project.total_profit_loss >= 0;

  return (
    <Link href={`/investments/projects/${project.id}`} className="group h-full">
      <Card className="h-full border-t-4 border-t-blue-500 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start gap-2">
            <span className="text-lg font-bold truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </span>
            <span
              className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold border ${
                project.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              }`}
            >
              {project.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <span className="text-muted-foreground text-xs flex items-center mb-1">
                  <Wallet className="w-3 h-3 mr-1" /> Investment
                </span>
                <span className="font-bold text-base">
                  {formatCurrency(project.total_investment)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs flex items-center mb-1">
                  <DollarSign className="w-3 h-3 mr-1" /> Capital
                </span>
                <span className="font-bold text-base">
                  {formatCurrency(project.remaining_capital)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-between items-center bg-muted/20 -mx-6 -mb-6 px-6 py-3 mt-2">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Profit / Loss
              </span>
              <div
                className={`flex items-center font-bold text-lg ${
                  isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-5 h-5 mr-1" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 mr-1" />
                )}
                {formatCurrency(Math.abs(project.total_profit_loss))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
