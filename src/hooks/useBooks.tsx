import { supabase } from "@/integrations/supabase/client";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface MonthlyBudget {
  id: string;
  book_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  name: string;
  type: "personal" | "business";
  owner_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  monthly_budgets?: MonthlyBudget[];
}

const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (!initialized) {
      setLoading(true);
    }

    try {
      const minMonth = `${new Date().getFullYear() - 1}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}`;
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select(
          `
          *,
          monthly_budgets (
            id,
            book_id,
            month,
            amount,
            created_at,
            updated_at
          )
        `
        )
        .eq("owner_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (bookError) throw bookError;

      // Filter monthly_budgets client-side
      const filteredBooks = (bookData || []).map((book) => ({
        ...book,
        monthly_budgets:
          book.monthly_budgets?.filter(
            (budget: MonthlyBudget) => budget.month >= minMonth
          ) || [],
      }));

      setBooks(filteredBooks);
      setError(null);
    } catch (error: any) {
      console.error("Error loading books:", error);
      setError(error.message);
      toast({
        title: "Error loading books",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user, toast, initialized]);

  const debouncedFetchBooks = useCallback(debounce(fetchBooks, 500), [
    fetchBooks,
  ]);

  const createBook = async (
    name: string,
    type: "personal" | "business",
    description?: string,
    is_default = false
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      if (is_default && books.length > 0) {
        await supabase
          .from("books")
          .update({ is_default: false })
          .eq("owner_id", user.id);
      }

      const { data, error } = await supabase
        .from("books")
        .insert([
          {
            name,
            type,
            description,
            is_default,
            owner_id: user.id,
          },
        ])
        .select(
          `
          *,
          monthly_budgets (
            id,
            book_id,
            month,
            amount,
            created_at,
            updated_at
          )
        `
        )
        .single();

      if (error) throw error;

      await fetchBooks();

      toast({
        title: "Book created",
        description: `${name} has been created successfully.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Error creating book:", error);
      toast({
        title: "Error creating book",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateBook = async (
    id: string,
    updates: Partial<Pick<Book, "name" | "type" | "description" | "is_default">>
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      if (updates.is_default && books.length > 1) {
        await supabase
          .from("books")
          .update({ is_default: false })
          .eq("owner_id", user.id)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("books")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select(
          `
          *,
          monthly_budgets (
            id,
            book_id,
            month,
            amount,
            created_at,
            updated_at
          )
        `
        )
        .single();

      if (error) throw error;

      await fetchBooks();

      toast({
        title: "Book updated",
        description: "Your changes have been saved.",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating book:", error);
      toast({
        title: "Error updating book",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const setMonthlyBudget = async (
    bookId: string,
    month: string,
    amount: number
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("monthly_budgets")
        .upsert(
          {
            book_id: bookId,
            month,
            amount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "book_id,month" }
        )
        .select()
        .single();

      if (error) throw error;

      await fetchBooks();

      return { data, error: null };
    } catch (error: any) {
      console.error("Error setting monthly budget:", error);
      toast({
        title: "Error setting monthly budget",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("owner_id", user?.id);

      if (error) throw error;

      setBooks((prev) => prev.filter((book) => book.id !== id));
      toast({
        title: "Book deleted",
        description: "The book has been removed.",
      });

      return { error: null };
    } catch (error: any) {
      console.error("Error deleting book:", error);
      toast({
        title: "Error deleting book",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setBooks([]);
      setInitialized(true);
      setLoading(false);
    }
  }, [user, fetchBooks]);

  useEffect(() => {
    if (!user || !initialized || books.length === 0) return;

    const channel = supabase
      .channel(`books-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "books",
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Books insert:", payload);
          debouncedFetchBooks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "books",
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Books update:", payload);
          debouncedFetchBooks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "books",
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Books delete:", payload);
          debouncedFetchBooks();
        }
      )
      // Only subscribe to monthly_budgets if books exist
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "monthly_budgets",
          filter: `book_id=in.(${books.map((b) => b.id).join(",")})`,
        },
        (payload) => {
          console.log("Monthly budgets insert:", payload);
          debouncedFetchBooks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "monthly_budgets",
          filter: `book_id=in.(${books.map((b) => b.id).join(",")})`,
        },
        (payload) => {
          console.log("Monthly budgets update:", payload);
          debouncedFetchBooks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "monthly_budgets",
          filter: `book_id=in.(${books.map((b) => b.id).join(",")})`,
        },
        (payload) => {
          console.log("Monthly budgets delete:", payload);
          debouncedFetchBooks();
        }
      )
      .subscribe((status, err) => {
        console.log("Books subscription status:", status);
        if (err) {
          console.error("Subscription error:", err);
          toast({
            title: "Realtime subscription error",
            description: "Failed to subscribe to updates. Please refresh.",
            variant: "destructive",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user,
    initialized,
    debouncedFetchBooks,
    toast,
    books.map((b) => b.id).join(","),
  ]);

  return {
    books,
    loading,
    error,
    initialized,
    createBook,
    updateBook,
    setMonthlyBudget,
    deleteBook,
    refetch: fetchBooks,
  };
};

export { useBooks };
