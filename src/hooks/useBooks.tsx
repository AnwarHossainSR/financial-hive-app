import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface Book {
  id: string;
  name: string;
  type: "personal" | "business";
  owner_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to prevent initial blink
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Only show loading on initial fetch or manual refetch
    if (!initialized) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("owner_id", user.id) // Add explicit owner filter
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBooks(data || []);
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

  const createBook = async (
    name: string,
    type: "personal" | "business",
    description?: string,
    is_default?: boolean
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
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
        .select()
        .single();

      if (error) throw error;

      // Optimistically update the state
      setBooks((prev) => [data, ...prev]);
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
    try {
      const { data, error } = await supabase
        .from("books")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_id", user?.id) // Ensure user owns the book
        .select()
        .single();

      if (error) throw error;

      // Optimistically update the state
      setBooks((prev) => prev.map((book) => (book.id === id ? data : book)));
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

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("owner_id", user?.id); // Ensure user owns the book

      if (error) throw error;

      // Optimistically update the state
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

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setBooks([]);
      setInitialized(true);
      setLoading(false);
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user || !initialized) return;

    const channel = supabase
      .channel(`books-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "books",
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Books change received:", payload);

          // Handle realtime changes more efficiently
          if (payload.eventType === "INSERT" && payload.new) {
            setBooks((prev) => {
              const exists = prev.some((book) => book.id === payload.new.id);
              return exists ? prev : [payload.new as Book, ...prev];
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setBooks((prev) =>
              prev.map((book) =>
                book.id === payload.new.id ? (payload.new as Book) : book
              )
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setBooks((prev) =>
              prev.filter((book) => book.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Books subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialized]);

  return {
    books,
    loading,
    error,
    initialized,
    createBook,
    updateBook,
    deleteBook,
    refetch: fetchBooks,
  };
};

export { useBooks };
