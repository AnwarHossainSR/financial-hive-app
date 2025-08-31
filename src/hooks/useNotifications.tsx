import { supabase } from "@/integrations/supabase/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Query Keys Factory
const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (userId: string) => [...notificationKeys.lists(), userId] as const,
  unreadCount: (userId: string) =>
    [...notificationKeys.all, "unread", userId] as const,
};

// Fetch functions
const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50); // Limit to last 50 notifications

  if (error) throw error;
  //@ts-expect-error expect-error
  return data || [];
};

const fetchUnreadCount = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
  return count || 0;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: notificationKeys.list(user?.id || ""),
    queryFn: () => fetchNotifications(user?.id || ""),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: notificationKeys.unreadCount(user?.id || ""),
    queryFn: () => fetchUnreadCount(user?.id || ""),
    enabled: !!user,
    staleTime: 10000, // 10 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({
            queryKey: notificationKeys.list(user.id),
          });
          queryClient.invalidateQueries({
            queryKey: notificationKeys.unreadCount(user.id),
          });

          // Show toast for new notifications
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as Notification;
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant:
                newNotification.type === "error" ? "destructive" : "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async ({
      title,
      message,
      type = "info",
      metadata = {},
    }: {
      title: string;
      message: string;
      type?: Notification["type"];
      metadata?: Record<string, any>;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: user.id,
            title,
            message,
            type,
            metadata,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // The real-time subscription will handle cache invalidation
    },
    onError: (error: any) => {
      console.error("Error creating notification:", error);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Optimistically update cache
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(user?.id || ""),
      });
    },
    onError: (error: any) => {
      console.error("Error marking notification as read:", error);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      // Update cache
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(user?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(user?.id || ""),
      });
    },
    onError: (error: any) => {
      console.error("Error marking all notifications as read:", error);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // The real-time subscription will handle cache invalidation
    },
    onError: (error: any) => {
      console.error("Error deleting notification:", error);
    },
  });

  // Clear all notifications mutation
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(user?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(user?.id || ""),
      });
    },
    onError: (error: any) => {
      console.error("Error clearing all notifications:", error);
    },
  });

  // Wrapper functions
  const createNotification = useCallback(
    async (
      title: string,
      message: string,
      type: Notification["type"] = "info",
      metadata: Record<string, any> = {}
    ) => {
      try {
        await createNotificationMutation.mutateAsync({
          title,
          message,
          type,
          metadata,
        });
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [createNotificationMutation]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsReadMutation.mutateAsync(id);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await deleteNotificationMutation.mutateAsync(id);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    [deleteNotificationMutation]
  );

  const clearAllNotifications = useCallback(async () => {
    try {
      await clearAllNotificationsMutation.mutateAsync();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }, [clearAllNotificationsMutation]);

  return {
    notifications,
    unreadCount,
    loading,
    error: isError ? (error as Error)?.message : null,
    initialized: !loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refetch,
    refetchUnreadCount,
  };
};
