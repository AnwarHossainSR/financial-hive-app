import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/book";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

// Query Keys Factory
const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (userId: string) => [...bookKeys.lists(), userId] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
};

// Fetch function
const fetchBooks = async (userId: string): Promise<Book[]> => {
  if (!userId) return [];

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
    .eq("owner_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (bookError) throw bookError;

  return bookData || [];
};

const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main query for books
  const {
    data: books = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: bookKeys.list(user?.id || ""),
    queryFn: () => fetchBooks(user?.id || ""),
    enabled: !!user,
    staleTime: 300000, // 5 minutes
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async ({
      name,
      type,
      description,
      is_default = false,
    }: {
      name: string;
      type: "personal" | "business";
      description?: string;
      is_default?: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // If this is going to be the default book, update all others first
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
      return data;
    },
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        bookKeys.list(user?.id || ""),
        (old: Book[] = []) => {
          // If this is the default book, make all others non-default
          if (data.is_default) {
            const updatedBooks = old.map((book) => ({
              ...book,
              is_default: false,
            }));
            return [data, ...updatedBooks];
          }
          return [data, ...old];
        }
      );

      toast({
        title: "Book created",
        description: `${data.name} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<Book, "name" | "type" | "description" | "is_default">
      >;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // If making this the default book, update all others first
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
      return data;
    },
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        bookKeys.list(user?.id || ""),
        (old: Book[] = []) => {
          return old.map((book) => {
            if (book.id === data.id) {
              return data;
            }
            // If the updated book is now default, make others non-default
            if (data.is_default) {
              return { ...book, is_default: false };
            }
            return book;
          });
        }
      );

      toast({
        title: "Book updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set monthly budget mutation
  const setMonthlyBudgetMutation = useMutation({
    mutationFn: async ({
      bookId,
      month,
      amount,
    }: {
      bookId: string;
      month: string;
      amount: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

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
      return data;
    },
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        bookKeys.list(user?.id || ""),
        (old: Book[] = []) => {
          return old.map((book) => {
            if (book.id === data.book_id) {
              const existingBudgets = book.monthly_budgets || [];
              const updatedBudgets = existingBudgets.some(
                (b) => b.month === data.month
              )
                ? existingBudgets.map((b) =>
                    b.month === data.month ? data : b
                  )
                : [...existingBudgets, data];

              return { ...book, monthly_budgets: updatedBudgets };
            }
            return book;
          });
        }
      );

      toast({
        title: "Budget updated",
        description: "Monthly budget has been set successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error setting monthly budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        bookKeys.list(user?.id || ""),
        (old: Book[] = []) => {
          return old.filter((book) => book.id !== deletedId);
        }
      );

      toast({
        title: "Book deleted",
        description: "The book has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Wrapper functions to match original API
  const createBook = useCallback(
    async (
      name: string,
      type: "personal" | "business",
      description?: string,
      is_default = false
    ) => {
      try {
        const data = await createBookMutation.mutateAsync({
          name,
          type,
          description,
          is_default,
        });
        return { data, error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [createBookMutation]
  );

  const updateBook = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<Book, "name" | "type" | "description" | "is_default">
      >
    ) => {
      try {
        const data = await updateBookMutation.mutateAsync({ id, updates });
        return { data, error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [updateBookMutation]
  );

  const setMonthlyBudget = useCallback(
    async (bookId: string, month: string, amount: number) => {
      try {
        const data = await setMonthlyBudgetMutation.mutateAsync({
          bookId,
          month,
          amount,
        });
        return { data, error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [setMonthlyBudgetMutation]
  );

  const deleteBook = useCallback(
    async (id: string) => {
      try {
        await deleteBookMutation.mutateAsync(id);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [deleteBookMutation]
  );

  return {
    books,
    loading,
    error: isError ? (error as Error)?.message : null,
    initialized: !loading,
    createBook,
    updateBook,
    setMonthlyBudget,
    deleteBook,
    refetch,
  };
};

export { useBooks };
