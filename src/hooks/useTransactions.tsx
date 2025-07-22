import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const useTransactions = (filters?: TransactionFilters) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use ref to store current filters for realtime filtering
  const currentFiltersRef = useRef<TransactionFilters | undefined>(filters);
  currentFiltersRef.current = filters;

  // Memoize filter dependencies to prevent unnecessary refetches
  const filterDeps = useMemo(
    () => ({
      bookId: filters?.bookId,
      type: filters?.type,
      category: filters?.category,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      search: filters?.search,
    }),
    [filters]
  );

  // Helper function to check if a transaction matches current filters
  const matchesCurrentFilters = useCallback((transaction: Transaction) => {
    const currentFilters = currentFiltersRef.current;
    if (!currentFilters) return true;

    const searchLower = currentFilters.search?.toLowerCase().trim();

    return (
      (!currentFilters.bookId ||
        transaction.book_id === currentFilters.bookId) &&
      (!currentFilters.type || transaction.type === currentFilters.type) &&
      (!currentFilters.category ||
        transaction.category === currentFilters.category) &&
      (!currentFilters.startDate ||
        transaction.date >= currentFilters.startDate) &&
      (!currentFilters.endDate || transaction.date <= currentFilters.endDate) &&
      (!searchLower ||
        transaction.note?.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower))
    );
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Only show loading on initial fetch or manual refetch
    if (!initialized) {
      setLoading(true);
    }

    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      // Apply filters (except search which is done client-side)
      if (filterDeps.bookId) {
        query = query.eq("book_id", filterDeps.bookId);
      }
      if (filterDeps.type) {
        query = query.eq("type", filterDeps.type);
      }
      if (filterDeps.category) {
        query = query.eq("category", filterDeps.category);
      }
      if (filterDeps.startDate) {
        query = query.gte("date", filterDeps.startDate);
      }
      if (filterDeps.endDate) {
        query = query.lte("date", filterDeps.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter on client side for better performance
      if (filterDeps.search && filterDeps.search.trim()) {
        const searchLower = filterDeps.search.toLowerCase().trim();
        filteredData = filteredData.filter(
          (t) =>
            t.note?.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower) ||
            t.amount.toString().includes(searchLower)
        );
      }

      setTransactions(filteredData);
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
      setInitialized(true);
    }
  }, [user, toast, initialized, filterDeps]);

  const createTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >
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

      // Optimistically update the state if it matches current filters
      if (matchesCurrentFilters(data)) {
        setTransactions((prev) => [data, ...prev]);
      }

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

      // Update the state and filter based on current filters
      setTransactions((prev) => {
        const updated = prev.map((t) => (t.id === id ? data : t));
        // Re-filter if transaction no longer matches current filters
        return updated.filter(matchesCurrentFilters);
      });

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

      setTransactions((prev) => prev.filter((t) => t.id !== id));
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
      await fetchTransactions();

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

  // Initial fetch when user or filters change
  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setInitialized(true);
      setLoading(false);
    }
  }, [user, filterDeps]);

  // Set up realtime subscription - ONLY depends on user and initialized
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
            const newTransaction = payload.new as Transaction;

            // Only add if it matches current filters
            if (matchesCurrentFilters(newTransaction)) {
              setTransactions((prev) => {
                const exists = prev.some((t) => t.id === newTransaction.id);
                return exists ? prev : [newTransaction, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedTransaction = payload.new as Transaction;

            setTransactions((prev) => {
              const updated = prev.map((t) =>
                t.id === updatedTransaction.id ? updatedTransaction : t
              );
              // Re-filter in case the update makes it not match current filters
              return updated.filter(matchesCurrentFilters);
            });
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
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
  }, [user, initialized, matchesCurrentFilters]); // Removed filterDeps dependency

  return {
    transactions,
    loading,
    error,
    initialized,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    uploadReceipt,
    importTransactions,
    refetch: fetchTransactions,
  };
};

export { useTransactions };
