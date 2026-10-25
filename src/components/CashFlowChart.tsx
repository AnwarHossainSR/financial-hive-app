"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatTaka } from "@/lib/utils";
import { BarChart3, Table2 } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

export interface CashFlowPoint {
  label: string;
  longLabel: string;
  income: number;
  expense: number;
}

const SERIES = [
  { key: "income", label: "Income", color: "hsl(var(--chart-income))" },
  { key: "expense", label: "Expense", color: "hsl(var(--chart-expense))" },
] as const;

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };

function CashFlowTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as CashFlowPoint;
  const net = point.income - point.expense;
  return (
    <div className="min-w-44 rounded-xl border bg-popover px-3 py-2.5 text-popover-foreground shadow-elevated">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {point.longLabel}
      </p>
      {SERIES.map((series) => (
        <div
          key={series.key}
          className="flex items-center justify-between gap-4 py-0.5"
        >
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatTaka(point[series.key])}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t pt-1.5">
        <span className="text-xs text-muted-foreground">Net</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatTaka(net, { signed: true })}
        </span>
      </div>
    </div>
  );
}

interface CashFlowChartProps {
  data: CashFlowPoint[];
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function CashFlowChart({
  data,
  loading,
  title = "Cash flow",
  description = "Income vs expense by month",
  className,
}: CashFlowChartProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const isEmpty = !loading && totalIncome === 0 && totalExpense === 0;

  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <ul className="flex items-center gap-3 text-xs text-muted-foreground">
            {SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </li>
            ))}
          </ul>
          <div
            role="group"
            aria-label="Display as"
            className="flex rounded-lg bg-muted p-0.5"
          >
            {(
              [
                { value: "chart", icon: BarChart3, label: "Chart" },
                { value: "table", icon: Table2, label: "Table" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                aria-label={`Show as ${label.toLowerCase()}`}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex-1">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : isEmpty ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs text-muted-foreground">
              Your monthly income and spending will chart here.
            </p>
          </div>
        ) : view === "chart" ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                barGap={2}
                barCategoryGap="30%"
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  width={52}
                  tickFormatter={(value: number) =>
                    formatTaka(value, { compact: true })
                  }
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }}
                  content={<CashFlowTooltip />}
                />
                {SERIES.map((series) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    fill={series.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Income</th>
                  <th className="px-3 py-2 text-right font-medium">Expense</th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {data.map((point) => (
                  <tr key={point.longLabel}>
                    <td className="px-3 py-2">{point.longLabel}</td>
                    <td className="px-3 py-2 text-right">
                      {formatTaka(point.income)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatTaka(point.expense)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium",
                        point.income - point.expense < 0
                          ? "text-expense"
                          : "text-income",
                      )}
                    >
                      {formatTaka(point.income - point.expense, {
                        signed: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !isEmpty && (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Total in</dt>
            <dd className="font-semibold tabular-nums">
              {formatTaka(totalIncome)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total out</dt>
            <dd className="font-semibold tabular-nums">
              {formatTaka(totalExpense)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Net</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                totalIncome - totalExpense < 0 ? "text-expense" : "text-income",
              )}
            >
              {formatTaka(totalIncome - totalExpense, { signed: true })}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
