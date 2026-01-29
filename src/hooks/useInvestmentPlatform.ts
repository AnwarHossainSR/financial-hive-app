"use client";

import {
  deleteInvestmentPlatformAction,
  getInvestmentPlatformAction,
  updateInvestmentPlatformAction,
} from "@/app/actions/investments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useInvestmentPlatform = (platformId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

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

  const updatePlatform = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const result = await updateInvestmentPlatformAction(id, user.id, data);
      if (result.error) throw new Error(result.error);
      return result.platform;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-platform", platformId],
      });
      queryClient.invalidateQueries({
        queryKey: ["investment-platforms", user?.id],
      });
      toast({
        title: "Success",
        description: "Platform updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlatform = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const result = await deleteInvestmentPlatformAction(id, user.id);
      if (result.error) throw new Error(result.error);
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-platforms", user?.id],
      });
      toast({
        title: "Success",
        description: "Platform deleted successfully",
      });
      router.push("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    platform,
    isLoading,
    error,
    updatePlatform: updatePlatform.mutateAsync,
    deletePlatform: deletePlatform.mutateAsync,
  };
};
