import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface Transaction {
  id: string;
  book_id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  bookId?: string;
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const ITEMS_PER_PAGE = 50; // Adjust based on your needs

const useTransactions = (filters?: TransactionFilters) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 0,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Track if we're fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  const currentFiltersRef = useRef<TransactionFilters | undefined>(filters);
  currentFiltersRef.current = filters;

  // Helper function to build query with filters
  const buildQuery = useCallback((baseQuery: any) => {
    const currentFilters = currentFiltersRef.current;
    let query = baseQuery;

    if (currentFilters?.bookId) {
      query = query.eq("book_id", currentFilters.bookId);
    }
    if (currentFilters?.type) {
      query = query.eq("type", currentFilters.type);
    }
    if (currentFilters?.category) {
      query = query.eq("category", currentFilters.category);
    }
    if (currentFilters?.startDate) {
      query = query.gte("date", currentFilters.startDate);
    }
    if (currentFilters?.endDate) {
      query = query.lte("date", currentFilters.endDate);
    }

    // Server-side search for better performance with large datasets
    if (currentFilters?.search && currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.trim();
      query = query.or(
        `note.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,amount::text.ilike.%${searchTerm}%`
      );
    }

    return query;
  }, []);

  // Get total count for pagination
  const getTotalCount = useCallback(async () => {
    if (!user) return 0;

    try {
      let countQuery = supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      countQuery = buildQuery(countQuery);
      const { count, error } = await countQuery;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting total count:", error);
      return 0;
    }
  }, [user, buildQuery]);

  // Fetch transactions with pagination
  const fetchTransactions = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (!user || isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        // Show loading state
        if (!append && !initialized) {
          setLoading(true);
        } else if (append) {
          setLoadingMore(true);
        }

        // Get total count first
        const totalCount = await getTotalCount();
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        // Build the main query
        let query = supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        query = buildQuery(query);

        const { data, error } = await query;

        if (error) throw error;

        const newTransactions = data || [];

        // Update transactions list
        if (append) {
          setTransactions((prev) => {
            // Remove duplicates based on ID
            const existingIds = new Set(prev.map((t) => t.id));
            const uniqueNew = newTransactions.filter(
              (t) => !existingIds.has(t.id)
            );
            return [...prev, ...uniqueNew];
          });
        } else {
          setTransactions(newTransactions);
        }

        // Update pagination info
        setPagination({
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages - 1,
          hasPreviousPage: page > 0,
        });

        setError(null);
      } catch (error: any) {
        console.error("Error loading transactions:", error);
        setError(error.message);
        toast({
          title: "Error loading transactions",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setInitialized(true);
        isFetchingRef.current = false;
      }
    },
    [user, toast, initialized, buildQuery, getTotalCount]
  );

  // Load more transactions (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasNextPage) return;
    await fetchTransactions(pagination.currentPage + 1, true);
  }, [
    fetchTransactions,
    pagination.currentPage,
    pagination.hasNextPage,
    loadingMore,
  ]);

  // Reset and fetch from beginning
  const refresh = useCallback(async () => {
    setTransactions([]);
    setPagination({
      currentPage: 0,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    await fetchTransactions(0, false);
  }, [fetchTransactions]);

  const createTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
    filteredQuery: any = {}
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const transactionData = {
        ...transaction,
        user_id: user.id,
        amount: Number(transaction.amount),
        date: transaction.date || new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      // Refresh transactions to maintain consistency
      await refresh();

      toast({
        title: "Transaction added",
        description: `${
          transaction.type === "income" ? "Income" : "Expense"
        } of $${transaction.amount} recorded.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error creating transaction",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<
      Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">
    >
  ) => {
    try {
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
        .eq("user_id", user?.id)
        .select()
        .single();

      if (error) throw error;

      // Update the state optimistically
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );

      toast({
        title: "Transaction updated",
        description: "Your changes have been saved.",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      // Remove from state optimistically
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // Update pagination count
      setPagination((prev) => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1),
        totalPages: Math.ceil(
          Math.max(0, prev.totalCount - 1) / ITEMS_PER_PAGE
        ),
      }));

      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });

      return { error: null };
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const uploadReceipt = async (file: File, transactionId?: string) => {
    if (!user) return { error: "User not authenticated" };

    try {
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

      return { data: { path: fileName, url: publicUrl }, error: null };
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Error uploading receipt",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const importTransactions = async (
    transactions: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >[]
  ) => {
    if (!user) return { error: "User not authenticated" };
    if (!transactions.length) return { error: "No transactions to import" };

    try {
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

      // Refresh transactions to show imported data
      await refresh();

      toast({
        title: "Transactions imported",
        description: `Successfully imported ${data.length} transactions.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Error importing transactions:", error);
      toast({
        title: "Error importing transactions",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  // Debounced effect for filter changes
  const prevFiltersRef = useRef<string>("");

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setInitialized(true);
      setLoading(false);
      return;
    }

    const currentFiltersStr = JSON.stringify({
      bookId: filters?.bookId,
      type: filters?.type,
      category: filters?.category,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      search: filters?.search,
    });

    // Reset and fetch when filters change
    if (currentFiltersStr !== prevFiltersRef.current) {
      prevFiltersRef.current = currentFiltersStr;

      // Debounce search queries
      const timeoutId = setTimeout(
        () => {
          refresh();
        },
        filters?.search ? 300 : 0
      ); // 300ms debounce for search, immediate for other filters

      return () => clearTimeout(timeoutId);
    }
  }, [
    user,
    filters?.bookId,
    filters?.type,
    filters?.category,
    filters?.startDate,
    filters?.endDate,
    filters?.search,
    refresh,
  ]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user || !initialized) return;

    console.log("Setting up realtime subscription for user:", user.id);

    const channel = supabase
      .channel(`transactions-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Transaction change received:", payload);

          if (payload.eventType === "INSERT" && payload.new) {
            // For inserts, we refresh to maintain proper ordering and pagination
            refresh();
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedTransaction = payload.new as Transaction;
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === updatedTransaction.id ? updatedTransaction : t
              )
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
            setPagination((prev) => ({
              ...prev,
              totalCount: Math.max(0, prev.totalCount - 1),
              totalPages: Math.ceil(
                Math.max(0, prev.totalCount - 1) / ITEMS_PER_PAGE
              ),
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log("Transactions subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user, initialized, refresh]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    initialized,
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
