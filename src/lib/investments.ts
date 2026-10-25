import { PlatformProjectSummary } from "@/types/investment";

export interface PortfolioSummary {
  totalInvestment: number;
  totalProfitLoss: number;
  remainingCapital: number;
  activeProjects: number;
  completedProjects: number;
  projectCount: number;
  /** Profit/loss as a percent of money invested; 0 when nothing is invested */
  roi: number;
}

/** Sums project figures; ROI is total P&L over total invested, as before */
export const summarizeProjects = (
  projects: PlatformProjectSummary[] = [],
): PortfolioSummary => {
  const summary = projects.reduce(
    (acc, project) => ({
      ...acc,
      totalInvestment: acc.totalInvestment + (Number(project.total_investment) || 0),
      totalProfitLoss:
        acc.totalProfitLoss + (Number(project.total_profit_loss) || 0),
      remainingCapital:
        acc.remainingCapital + (Number(project.remaining_capital) || 0),
      activeProjects: acc.activeProjects + (project.status === "active" ? 1 : 0),
      completedProjects:
        acc.completedProjects + (project.status === "completed" ? 1 : 0),
    }),
    {
      totalInvestment: 0,
      totalProfitLoss: 0,
      remainingCapital: 0,
      activeProjects: 0,
      completedProjects: 0,
      projectCount: projects.length,
      roi: 0,
    },
  );
  summary.roi =
    summary.totalInvestment > 0
      ? (summary.totalProfitLoss / summary.totalInvestment) * 100
      : 0;
  return summary;
};

export const formatPercent = (value: number, { signed = true } = {}) =>
  `${signed && value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}%`;
