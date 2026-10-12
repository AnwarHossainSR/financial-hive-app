import {
  createTransactionAction,
  deleteTransactionAction,
  getTransactionTotalsAction,
  getTransactionsAction,
  importTransactionsAction,
  updateTransactionAction,
} from "@/app/actions/transactions";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentMonth,
  getMonthDateRange,
  getPreviousPeriodRange,
} from "@/lib/utils";
import {
  PaginationInfo,
  Transaction,
  TransactionFilters,
} from "@/types/transaction";
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export type { PaginationInfo, Transaction, TransactionFilters };

const ITEMS_PER_PAGE = 50;

/**
 * Drops empty values (and the legacy userId field) so equivalent filter
 * objects — `{ search: "" }` vs `{}` — share one cache entry. This is what
 * lets a prefetch from the dashboard land in the same entry the page reads.
 */
const normalizeFilters = (filters: TransactionFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "userId" && value !== undefined && value !== null && value !== "",
    ),
  ) as TransactionFilters;

// Query Keys Factory
export const transactionKeys = {
  all: ["transactions"] as const,
  infiniteLists: () => [...transactionKeys.all, "infinite"] as const,
  infinite: (userId: string, filters: TransactionFilters) =>
    [
      ...transactionKeys.infiniteLists(),
      userId,
      normalizeFilters(filters),
    ] as const,
  totals: (userId: string, filters: TransactionFilters) =>
    [...transactionKeys.all, "totals", userId, normalizeFilters(filters)] as const,
};

const toActionFilters = (filters: TransactionFilters) => ({
  bookId: filters.bookId,
  type: filters.type,
  category: filters.category,
  startDate: filters.startDate,
  endDate: filters.endDate,
  search: filters.search,
  note: filters.note,
});

/** Shared by useTransactions and prefetching, so both hit the same cache entry */
export const transactionsQueryOptions = (
  userId: string,
  filters: TransactionFilters,
) =>
  infiniteQueryOptions({
    queryKey: transactionKeys.infinite(userId, filters),
    queryFn: async ({ pageParam }) => {
      const { transactions, total, totals, error } = await getTransactionsAction(
        { ...toActionFilters(filters), page: pageParam, limit: ITEMS_PER_PAGE },
      );
      if (error) throw new Error(error);

      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const hasNextPage = pageParam < totalPages - 1;

      return {
        data: transactions as Transaction[],
        nextPage: hasNextPage ? pageParam + 1 : undefined,
        totalCount: total,
        totals,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

type TransactionsPage = Awaited<
  ReturnType<
    NonNullable<ReturnType<typeof transactionsQueryOptions>["queryFn"]>
  >
>;
type TransactionsData = InfiniteData<TransactionsPage, number>;

export const transactionTotalsQueryOptions = (
  userId: string,
  filters: TransactionFilters,
) =>
  queryOptions({
    queryKey: transactionKeys.totals(userId, filters),
    queryFn: async () => {
      const { totals, error } = await getTransactionTotalsAction(
        toActionFilters(filters),
      );
      if (error) throw new Error(error);
      return totals;
    },
  });

/** Removes one transaction from cached lists, keeping counts and totals in step */
const withoutTransaction = (data: TransactionsData, id: string) => {
  const removed = data.pages
    .flatMap((page) => page.data)
    .find((t) => t.id === id);
  if (!removed) return data;
  return {
    ...data,
    pages: data.pages.map((page, index) => ({
      ...page,
      data: page.data.filter((t) => t.id !== id),
      // Count and totals live on the first page
      ...(index === 0 && {
        totalCount: page.totalCount - 1,
        totals: page.totals && {
          ...page.totals,
          [removed.type]: page.totals[removed.type] - Number(removed.amount),
        },
      }),
    })),
  };
};

const useTransactions = (filters: TransactionFilters = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    ...transactionsQueryOptions(user?.id ?? "", filters),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });

  // Server-side writes also create a notification, so refresh the bell too
  const refreshAfterWrite = () => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  // Flatten transactions from pages
  const transactions = infiniteData?.pages.flatMap((page) => page.data) || [];
  const totalCount = infiniteData?.pages[0]?.totalCount || 0;
  const totals = infiniteData?.pages[0]?.totals ?? { income: 0, expense: 0 };

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
      refreshAfterWrite();
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: transactionKeys.infiniteLists(),
      });
      const previous = queryClient.getQueriesData<TransactionsData>({
        queryKey: transactionKeys.infiniteLists(),
      });
      queryClient.setQueriesData<TransactionsData>(
        { queryKey: transactionKeys.infiniteLists() },
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      ...updates,
                      amount: Number(updates.amount ?? t.amount),
                      date: updates.date
                        ? new Date(updates.date).toISOString()
                        : t.date,
                    }
                  : t,
              ),
            })),
          },
      );
      return { previous };
    },
    onSuccess: async () => {
      toast({
        title: "Transaction updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any, _vars, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive",
      });
    },
    // Refetch either way so totals and ordering match the server
    onSettled: refreshAfterWrite,
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await deleteTransactionAction(id, user.id);
      if (error) throw new Error(error);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: transactionKeys.infiniteLists(),
      });
      const previous = queryClient.getQueriesData<TransactionsData>({
        queryKey: transactionKeys.infiniteLists(),
      });
      queryClient.setQueriesData<TransactionsData>(
        { queryKey: transactionKeys.infiniteLists() },
        (old) => old && withoutTransaction(old, id),
      );
      return { previous };
    },
    onSuccess: async () => {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });
    },
    onError: (error: any, _id, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: refreshAfterWrite,
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
      refreshAfterWrite();
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
    totals,
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

/**
 * Income/expense totals for an arbitrary filter set (e.g. last month, for
 * trends). Shares the transactions key prefix so mutations refresh it.
 */
const useTransactionTotals = (
  filters: TransactionFilters,
  enabled = true,
) => {
  const { user } = useAuth();
  return useQuery({
    ...transactionTotalsQueryOptions(user?.id ?? "", filters),
    enabled: enabled && !!user,
  });
};

/**
 * Warms everything the book page shows first — this month's transactions and
 * last month's totals for the trend badges — plus the route's code. Call on
 * hover/focus/touch of a link to a book so the page opens with data in place.
 * Skips work when the cache already holds fresh data.
 */
const usePrefetchBook = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = user?.id;

  return useCallback(
    (bookId: string) => {
      if (!userId) return;
      router.prefetch(`/book/${bookId}`);

      const month = getCurrentMonth();
      queryClient.prefetchInfiniteQuery(
        transactionsQueryOptions(userId, {
          bookId,
          ...getMonthDateRange(month),
        }),
      );
      const previous = getPreviousPeriodRange(month);
      queryClient.prefetchQuery(
        transactionTotalsQueryOptions(userId, {
          bookId,
          startDate: previous.startDate,
          endDate: previous.endDate,
        }),
      );
    },
    [userId, queryClient, router],
  );
};

export { usePrefetchBook, useTransactions, useTransactionTotals };
