"use client";

import {
  createInvestmentProjectAction,
  deleteInvestmentProjectAction,
  getInvestmentProjectsAction,
  updateInvestmentProjectAction,
} from "@/app/actions/investments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useInvestmentProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["investment-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { projects, error } = await getInvestmentProjectsAction(user.id);
      if (error) throw new Error(error);
      return projects;
    },
    enabled: !!user?.id,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { project, error } = await createInvestmentProjectAction(
        user.id,
        data,
      );
      if (error) throw new Error(error);
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-projects"] });
      toast({
        title: "Project created",
        description: "Your investment project has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { project, error } = await updateInvestmentProjectAction(
        id,
        user.id,
        data,
      );
      if (error) throw new Error(error);
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-projects"] });
      toast({
        title: "Project updated",
        description: "Your investment project has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { success, error } = await deleteInvestmentProjectAction(
        id,
        user.id,
      );
      if (error) throw new Error(error);
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-projects"] });
      toast({
        title: "Project deleted",
        description: "Your investment project has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
  };
};
