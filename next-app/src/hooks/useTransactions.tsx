import {
  createTransactionAction,
  deleteTransactionAction,
  getTransactionsAction,
  importTransactionsAction,
  updateTransactionAction,
} from "@/app/actions/transactions";
import { supabase } from "@/integrations/supabase/client";
import {
  PaginationInfo,
  Transaction,
  TransactionFilters,
} from "@/types/transaction";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export type { PaginationInfo, Transaction, TransactionFilters };

const ITEMS_PER_PAGE = 50;

// Query Keys Factory
const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  infinite: (filters: TransactionFilters) =>
    [
      ...transactionKeys.all,
      "infinite",
      { ...filters, userId: filters.userId },
    ] as const,
  count: (filters: TransactionFilters) =>
    [...transactionKeys.all, "count", filters] as const,
};

const useTransactions = (filters: TransactionFilters = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create combined filters for the query
  const queryFilters = useMemo(
    () => ({
      ...filters,
      userId: user?.id || "",
    }),
    [filters, user?.id]
  );

  // Infinite query for transactions (includes count from server)
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: loadingMore,
    isLoading,
    isError,
    error,
    refetch: refresh,
  } = useInfiniteQuery({
    queryKey: transactionKeys.infinite(queryFilters),
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { data: [], nextPage: undefined, totalCount: 0 };

      const { transactions, total, error } = await getTransactionsAction({
        userId: user.id,
        bookId: filters.bookId,
        type: filters.type,
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
        page: pageParam,
        limit: ITEMS_PER_PAGE,
      });

      if (error) throw new Error(error);

      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const hasNextPage = pageParam < totalPages - 1;

      return {
        data: transactions,
        nextPage: hasNextPage ? pageParam + 1 : undefined,
        totalCount: total,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Flatten transactions from pages
  const transactions = infiniteData?.pages.flatMap((page) => page.data) || [];
  const totalCount = infiniteData?.pages[0]?.totalCount || 0;

  const pagination: PaginationInfo = {
    currentPage: infiniteData?.pages.length ? infiniteData.pages.length - 1 : 0,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    totalCount,
    hasNextPage: !!hasNextPage,
    hasPreviousPage: false,
  };

  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: async (
      transaction: Omit<
        Transaction,
        "id" | "user_id" | "created_at" | "updated_at"
      >
    ) => {
      if (!user) throw new Error("User not authenticated");
      const { transaction: newTx, error } = await createTransactionAction(
        user.id,
        transaction
      );
      if (error) throw new Error(error);
      return newTx;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast({
        title: "Transaction added",
        description: `${data.type === "income" ? "Income" : "Expense"} of ৳${
          data.amount
        } recorded.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">
      >;
    }) => {
      if (!user) throw new Error("User not authenticated");
      const { transaction, error } = await updateTransactionAction(
        id,
        user.id,
        updates
      );
      if (error) throw new Error(error);
      return transaction;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast({
        title: "Transaction updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await deleteTransactionAction(id, user.id);
      if (error) throw new Error(error);
      return id;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("receipts").getPublicUrl(fileName);

      return { path: fileName, url: publicUrl };
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading receipt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importTransactionsMutation = useMutation({
    mutationFn: async (
      transactions: Omit<
        Transaction,
        "id" | "user_id" | "created_at" | "updated_at"
      >[]
    ) => {
      if (!user) throw new Error("User not authenticated");
      const { count, error } = await importTransactionsAction(
        user.id,
        transactions
      );
      if (error) throw new Error(error);
      return { count };
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast({
        title: "Transactions imported",
        description: `Successfully imported ${data.count} transactions.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error importing transactions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Wrapper functions to match original API
  const createTransaction = useCallback(
    async (transaction: any) => {
      try {
        await createTransactionMutation.mutateAsync(transaction);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [createTransactionMutation]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: any) => {
      try {
        await updateTransactionMutation.mutateAsync({ id, updates });
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [updateTransactionMutation]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        await deleteTransactionMutation.mutateAsync(id);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [deleteTransactionMutation]
  );

  const uploadReceipt = useCallback(
    async (file: File) => {
      try {
        const result = await uploadReceiptMutation.mutateAsync(file);
        return { data: result, error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [uploadReceiptMutation]
  );

  const importTransactions = useCallback(
    async (transactions: any[]) => {
      try {
        const result = await importTransactionsMutation.mutateAsync(
          transactions
        );
        return { data: result, error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [importTransactionsMutation]
  );

  const loadMore = useCallback(async () => {
    if (hasNextPage && !loadingMore) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, loadingMore]);

  return {
    transactions,
    loading: isLoading,
    loadingMore,
    error: isError ? (error as Error)?.message : null,
    initialized: !isLoading,
    pagination,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    uploadReceipt,
    importTransactions,
    loadMore,
    refresh,
    refetch: refresh,
  };
};

export { useTransactions };
