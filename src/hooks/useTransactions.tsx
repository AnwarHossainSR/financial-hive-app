import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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

export const useTransactions = (filters?: TransactionFilters) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.bookId) {
        query = query.eq("book_id", filters.bookId);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter on client side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(
          (t) =>
            t.note?.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower)
        );
      }

      setTransactions(filteredData);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error loading transactions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            ...transaction,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => [data, ...prev]);
      toast({
        title: "Transaction added",
        description: `${
          transaction.type === "income" ? "Income" : "Expense"
        } of $${transaction.amount} recorded.`,
      });

      return { data, error: null };
    } catch (error: any) {
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
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
      toast({
        title: "Transaction updated",
        description: "Your changes have been saved.",
      });

      return { data, error: null };
    } catch (error: any) {
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
        .eq("id", id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });

      return { error: null };
    } catch (error: any) {
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
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("receipts").getPublicUrl(fileName);

      return { data: { path: fileName, url: publicUrl }, error: null };
    } catch (error: any) {
      toast({
        title: "Error uploading receipt",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, filters]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          console.log("Transaction change received:", payload);
          fetchTransactions(); // Refetch to ensure we have the latest data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filters]);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    uploadReceipt,
    refetch: fetchTransactions,
  };
};
