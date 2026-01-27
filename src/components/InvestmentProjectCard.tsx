"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { InvestmentProject } from "@/types/investment";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

interface InvestmentProjectCardProps {
  project: InvestmentProject;
}

export function InvestmentProjectCard({ project }: InvestmentProjectCardProps) {
  const isPositive = project.total_profit_loss >= 0;

  return (
    <Link href={`/investments/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start">
            <span className="text-xl font-bold truncate">{project.name}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                project.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {project.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm flex items-center">
                <Wallet className="w-4 h-4 mr-1" /> Investment
              </span>
              <span className="font-semibold">
                {formatCurrency(project.total_investment)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm flex items-center">
                <DollarSign className="w-4 h-4 mr-1" /> Capital
              </span>
              <span className="font-semibold">
                {formatCurrency(project.remaining_capital)}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t flex justify-between items-center">
              <span className="text-muted-foreground text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> Profit/Loss
              </span>
              <div
                className={`flex items-center font-bold ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
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
