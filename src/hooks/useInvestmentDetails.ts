"use client";

import {
  createBankStatementAction,
  createInvestmentEntryAction,
  deleteBankStatementAction,
  deleteInvestmentEntryAction,
  getBankStatementsAction,
  getInvestmentEntriesAction,
  getInvestmentProjectAction,
  updateInvestmentEntryAction,
} from "@/app/actions/investments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useInvestmentProject = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["investment-project", projectId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { project, error } = await getInvestmentProjectAction(
        projectId,
        user.id,
      );
      if (error) throw new Error(error);
      return project;
    },
    enabled: !!user?.id && !!projectId,
  });

  return { project, isLoading, error };
};

export const useInvestmentEntries = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: entries = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["investment-entries", projectId],
    queryFn: async () => {
      const { entries, error } = await getInvestmentEntriesAction(projectId);
      if (error) throw new Error(error);
      return entries;
    },
    enabled: !!projectId,
  });

  const createEntry = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { entry, error } = await createInvestmentEntryAction(
        projectId,
        user.id,
        data,
      );
      if (error) throw new Error(error);
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["investment-project", projectId],
      });
      toast({
        title: "Entry added",
        description: "Investment entry has been successfully added.",
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

  const updateEntry = useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: any }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { entry, error } = await updateInvestmentEntryAction(
        entryId,
        user.id,
        data,
      );
      if (error) throw new Error(error);
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["investment-project", projectId],
      });
      toast({
        title: "Entry updated",
        description: "Investment entry has been successfully updated.",
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

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { success, error } = await deleteInvestmentEntryAction(
        entryId,
        user.id,
      );
      if (error) throw new Error(error);
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["investment-project", projectId],
      });
      toast({
        title: "Entry deleted",
        description: "Investment entry has been removed.",
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
    entries,
    isLoading,
    error,
    createEntry: createEntry.mutateAsync,
    updateEntry: updateEntry.mutateAsync,
    deleteEntry: deleteEntry.mutateAsync,
  };
};

export const useBankStatements = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: statements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bank-statements", projectId],
    queryFn: async () => {
      const { statements, error } = await getBankStatementsAction(projectId);
      if (error) throw new Error(error);
      return statements;
    },
    enabled: !!projectId,
  });

  const createStatement = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { statement, error } = await createBankStatementAction(
        projectId,
        user.id,
        data,
      );
      if (error) throw new Error(error);
      return statement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-statements", projectId],
      });
      toast({
        title: "Statement added",
        description: "Bank statement has been successfully added.",
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

  const deleteStatement = useMutation({
    mutationFn: async (statementId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { success, error } = await deleteBankStatementAction(
        statementId,
        user.id,
      );
      if (error) throw new Error(error);
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-statements", projectId],
      });
      toast({
        title: "Statement deleted",
        description: "Bank statement has been removed.",
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
    statements,
    isLoading,
    error,
    createStatement: createStatement.mutateAsync,
    deleteStatement: deleteStatement.mutateAsync,
  };
};
