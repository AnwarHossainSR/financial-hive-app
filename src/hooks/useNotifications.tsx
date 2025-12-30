import {
  clearAllNotificationsAction,
  deleteNotificationAction,
  getNotificationsAction,
  getUnreadCountAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/app/actions/notifications";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
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

export const useNotifications = () => {
  const { user } = useAuth();
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
    queryFn: async () => {
      if (!user?.id) return [];
      const { notifications, error } = await getNotificationsAction(user.id);
      if (error) throw new Error(error);
      return notifications as any[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: notificationKeys.unreadCount(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await getUnreadCountAction(user.id);
      if (error) throw new Error(error);
      return count;
    },
    enabled: !!user,
    staleTime: 10000, // 10 seconds
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await markAsReadAction(id);
      if (error) throw new Error(error);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: any) => {
      console.error("Error marking notification as read:", error);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await markAllAsReadAction(user.id);
      if (error) throw new Error(error);
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: any) => {
      console.error("Error marking all notifications as read:", error);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await deleteNotificationAction(id);
      if (error) throw new Error(error);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: any) => {
      console.error("Error deleting notification:", error);
    },
  });

  // Clear all notifications mutation
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { success, error } = await clearAllNotificationsAction(user.id);
      if (error) throw new Error(error);
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: any) => {
      console.error("Error clearing all notifications:", error);
    },
  });

  // Wrapper functions
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
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refetch,
    refetchUnreadCount,
  };
};
