"use client";

import { getInvestmentPlatformsAction } from "@/app/actions/platforms";
import { CreatePlatformDialog } from "@/components/CreatePlatformDialog";
import { PlatformCard } from "@/components/PlatformCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { InvestmentPlatform } from "@/types/investment";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

export default function InvestmentsPage() {
  const { user } = useAuth();

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ["investment-platforms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { platforms, error } = await getInvestmentPlatformsAction(user.id);
      if (error) throw new Error(error);
      return platforms;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">
            Manage your investment portfolios by platform.
          </p>
        </div>
        <CreatePlatformDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Platform
          </Button>
        </CreatePlatformDialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
        </div>
      ) : platforms.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-semibold mb-2">
            No investment platforms yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create a platform (e.g., i-Farmer, WeGrow) to start tracking
            projects.
          </p>
          <CreatePlatformDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Platform
            </Button>
          </CreatePlatformDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform: InvestmentPlatform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}
