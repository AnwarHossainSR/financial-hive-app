import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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
}

export const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBooks(data || []);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error loading books",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBook = async (
    name: string,
    type: "personal" | "business",
    description?: string
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
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setBooks((prev) => [data, ...prev]);
      toast({
        title: "Book created",
        description: `${name} has been created successfully.`,
      });

      return { data, error: null };
    } catch (error: any) {
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
    updates: Partial<Pick<Book, "name" | "type" | "description">>
  ) => {
    try {
      const { data, error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setBooks((prev) => prev.map((book) => (book.id === id ? data : book)));
      toast({
        title: "Book updated",
        description: "Your changes have been saved.",
      });

      return { data, error: null };
    } catch (error: any) {
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
      const { error } = await supabase.from("books").delete().eq("id", id);

      if (error) throw error;

      setBooks((prev) => prev.filter((book) => book.id !== id));
      toast({
        title: "Book deleted",
        description: "The book has been removed.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error deleting book",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("books-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "books",
        },
        (payload) => {
          console.log("Books change received:", payload);
          fetchBooks(); // Refetch to ensure we have the latest data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    books,
    loading,
    error,
    createBook,
    updateBook,
    deleteBook,
    refetch: fetchBooks,
  };
};
