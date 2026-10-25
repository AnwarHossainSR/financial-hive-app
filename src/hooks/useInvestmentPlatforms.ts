"use client";

import { getIsolatedInvestmentPlatformsAction } from "@/app/actions/platform-actions";
import { useAuth } from "@/hooks/useAuth";
import { PlatformWithProjects } from "@/types/investment";
import { useQuery } from "@tanstack/react-query";

/** All of the user's investment platforms with per-project figures */
export const useInvestmentPlatforms = () => {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ["investment-platforms", user?.id],
    queryFn: async () => {
      const { platforms, error } = await getIsolatedInvestmentPlatformsAction();
      if (error) throw new Error(error);
      return platforms as PlatformWithProjects[];
    },
    enabled: !!user?.id && !loading,
    staleTime: 30000,
  });

  return {
    platforms: query.data ?? [],
    isLoading: query.isLoading || loading,
    error: query.error as Error | null,
  };
};
