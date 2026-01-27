"use client";

import { getInvestmentPlatformAction } from "@/app/actions/platforms";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export const useInvestmentPlatform = (platformId: string) => {
  const { user } = useAuth();

  const {
    data: platform,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["investment-platform", platformId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { platform, error } = await getInvestmentPlatformAction(platformId);
      if (error) throw new Error(error);
      return platform;
    },
    enabled: !!user?.id && !!platformId,
  });

  return { platform, isLoading, error };
};
