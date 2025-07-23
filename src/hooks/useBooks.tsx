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
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("owner_id", user.id)
        .order("is_default", { ascending: false })
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
    is_default = false
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      // Only reset other books' is_default if there are existing books and is_default is true
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
        .select()
        .single();

      if (error) throw error;

      // Refetch to ensure correct order with is_default first
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
    console.log("Updating book with ID:", id, "Updates:", updates);
    try {
      // Only reset other books' is_default if setting is_default to true and there are other books
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
        .select()
        .single();

      if (error) throw error;

      // Refetch to ensure correct order with is_default first
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

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("owner_id", user?.id);

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
        () => {
          // Refetch on any change to ensure is_default order is maintained
          fetchBooks();
        }
      )
      .subscribe((status) => {
        console.log("Books subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialized, fetchBooks]);

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
