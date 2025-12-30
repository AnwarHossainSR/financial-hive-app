import { supabase } from "@/integrations/supabase/client";
import {
  createTransactionNotification,
  importTransactionsNotification,
  updateTransactionNotification,
} from "@/lib/notificationHelpers";
import {
  PaginationInfo,
  Transaction,
  TransactionFilters,
} from "@/types/transaction";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
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

// Helper function to build query with filters
const buildQuery = (baseQuery: any, filters: TransactionFilters) => {
  let query = baseQuery;

  // Always filter by user_id first
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.bookId) {
    query = query.eq("book_id", filters.bookId);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters.note) {
    query = query.ilike("note", `%${filters.note}%`);
  }
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    query = query.ilike("note", `%${searchTerm}%`);
  }

  return query;
};

// Fetch functions
const fetchTransactions = async (
  filters: TransactionFilters,
  userId: string,
  page = 0
) => {
  if (!userId) {
    return [];
  }

  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

  // Include userId in filters for building the query
  const filtersWithUserId = { ...filters, userId };
  query = buildQuery(query, filtersWithUserId);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }

  return data || [];
};

const fetchTransactionCount = async (
  filters: TransactionFilters,
  userId: string
) => {
  if (!userId) return 0;

  let countQuery = supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  // Include userId in filters for building the query
  const filtersWithUserId = { ...filters, userId };
  countQuery = buildQuery(countQuery, filtersWithUserId);

  const { count, error } = await countQuery;
  if (error) {
    console.error("Error fetching transaction count:", error);
    throw error;
  }

  return count || 0;
};

const fetchTransactionsInfinite = async ({
  pageParam = 0,
  queryKey,
}: {
  pageParam: number;
  queryKey: readonly any[];
}) => {
  const [, , filters] = queryKey;
  const userId = filters.userId;

  if (!userId) {
    return {
      data: [],
      nextPage: undefined,
      totalCount: 0,
    };
  }

  // Fetch transactions and count in parallel
  const [transactions, totalCount] = await Promise.all([
    fetchTransactions(filters, userId, pageParam),
    fetchTransactionCount(filters, userId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = pageParam < totalPages - 1;

  return {
    data: transactions,
    nextPage: hasNextPage ? pageParam + 1 : undefined,
    totalCount,
    currentPage: pageParam,
    totalPages,
  };
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

  // Get transaction count
  const { data: totalCount = 0 } = useQuery({
    queryKey: transactionKeys.count(queryFilters),
    queryFn: () => fetchTransactionCount(queryFilters, user?.id || ""),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData,
  });

  // Infinite query for transactions
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
    queryFn: fetchTransactionsInfinite,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Flatten transactions from pages
  const transactions = infiniteData?.pages.flatMap((page) => page.data) || [];
  const pagination: PaginationInfo = {
    currentPage: infiniteData?.pages.length ? infiniteData.pages.length - 1 : 0,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    totalCount,
    hasNextPage: !!hasNextPage,
    hasPreviousPage: false, // Not needed for infinite scroll
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
      if (!transaction.book_id) throw new Error("No book selected");

      const transactionData = {
        ...transaction,
        user_id: user.id,
        amount: Number(transaction.amount),
        date: transaction.date,
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Create notification instead of toast
      await createTransactionNotification(user!.id, {
        id: data.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        note: data.note,
      });

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

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.amount !== undefined) {
        updateData.amount = Number(updates.amount);
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Create notification instead of toast
      await updateTransactionNotification(user!.id, {
        id: data.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
      });
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

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
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
      if (!transactions.length) throw new Error("No transactions to import");

      const transactionData = transactions.map((transaction) => ({
        ...transaction,
        user_id: user.id,
        amount: Number(transaction.amount),
        date: transaction.date || new Date().toISOString().split("T")[0],
      }));

      const { data, error } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      await importTransactionsNotification(user!.id, data.length);
      toast({
        title: "Transactions imported",
        description: `Successfully imported ${data.length} transactions.`,
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
