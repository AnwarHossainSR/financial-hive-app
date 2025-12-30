import {
  createBookAction,
  deleteBookAction,
  getBooksAction,
  updateBookAction,
} from "@/app/actions/books";
import { setMonthlyBudgetAction } from "@/app/actions/profile";
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

export type { Book };

// Query Keys Factory
const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (userId: string) => [...bookKeys.lists(), userId] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
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
    queryFn: async () => {
      if (!user?.id) return [];
      const { books, error } = await getBooksAction(user.id);
      if (error) throw new Error(error);
      return books as any[];
    },
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
      const { book, error } = await createBookAction(user.id, {
        name,
        type,
        description,
        is_default,
      });
      if (error) throw new Error(error);
      return book;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
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
      const { book, error } = await updateBookAction(id, user.id, updates);
      if (error) throw new Error(error);
      return book;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
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
      const { budget, error } = await setMonthlyBudgetAction(
        bookId,
        month,
        amount
      );
      if (error) throw new Error(error);
      return budget;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });

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
      const { success, error } = await deleteBookAction(id);
      if (error) throw new Error(error);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
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
