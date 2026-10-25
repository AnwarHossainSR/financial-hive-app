"use client";

import { CreatePlatformDialog } from "@/components/CreatePlatformDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PlatformCard } from "@/components/PlatformCard";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestmentPlatforms } from "@/hooks/useInvestmentPlatforms";
import { formatPercent, summarizeProjects } from "@/lib/investments";
import { formatTaka } from "@/lib/utils";
import {
  Activity,
  Layers,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export default function InvestmentsPage() {
  const { platforms, isLoading } = useInvestmentPlatforms();
  const portfolio = summarizeProjects(platforms.flatMap((p) => p.projects ?? []));
  const isUp = portfolio.totalProfitLoss >= 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Investments"
        description="Track what you've put in and what's come back, grouped by the platform you invest through."
        actions={
          <CreatePlatformDialog>
            <Button className="gap-2 rounded-xl shadow-primary">
              <Plus className="h-4 w-4" />
              New platform
            </Button>
          </CreatePlatformDialog>
        }
      />

      <section
        aria-label="Portfolio"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              featured
              label="Portfolio value"
              value={formatTaka(portfolio.remainingCapital)}
              icon={Wallet}
              hint={`${platforms.length} platform${platforms.length === 1 ? "" : "s"}`}
              className="col-span-2 lg:col-span-1"
            />
            <StatTile
              label="Total invested"
              value={formatTaka(portfolio.totalInvestment)}
              icon={Layers}
              tone="primary"
              hint={`${portfolio.projectCount} project${portfolio.projectCount === 1 ? "" : "s"}`}
            />
            <StatTile
              label="Profit / loss"
              value={formatTaka(portfolio.totalProfitLoss, { signed: true })}
              icon={isUp ? TrendingUp : TrendingDown}
              tone={isUp ? "income" : "expense"}
              toneValue
              hint={`${formatPercent(portfolio.roi)} ROI`}
            />
            <StatTile
              label="Active projects"
              value={portfolio.activeProjects}
              icon={Activity}
              tone="warning"
              hint={`${portfolio.completedProjects} completed`}
            />
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Platforms</h2>
          <p className="text-sm text-muted-foreground">
            Open a platform to manage its projects and entries.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[230px] rounded-2xl" />
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50">
            <EmptyState
              icon={Layers}
              title="No investment platforms yet"
              description="Create a platform (for example i-Farmer or WeGrow), then add the projects you've invested in."
              action={
                <CreatePlatformDialog>
                  <Button className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Create platform
                  </Button>
                </CreatePlatformDialog>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
            <CreatePlatformDialog>
              <button
                type="button"
                className="group flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">New platform</span>
              </button>
            </CreatePlatformDialog>
          </div>
        )}
      </section>
    </div>
  );
}
