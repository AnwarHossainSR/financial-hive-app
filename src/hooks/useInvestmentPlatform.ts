"use client";

import { getInvestmentPlatformAction } from "@/app/actions/investments";
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
      const { platform, error } = await getInvestmentPlatformAction(
        platformId,
        user.id,
      );
      if (error) throw new Error(error);
      return platform;
    },
    enabled: !!user?.id && !!platformId,
  });

  return { platform, isLoading, error };
};
