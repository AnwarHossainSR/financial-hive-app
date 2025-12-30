import { prisma } from "@/lib/prisma";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
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

  const notifications = await prisma.notification.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 50,
  });

  return (notifications as any) || [];
};

const fetchUnreadCount = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  return await prisma.notification.count({
    where: {
      user_id: userId,
      read: false,
    },
  });
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

      return await prisma.notification.create({
        data: {
          user_id: user.id,
          title,
          message,
          type: type as any,
          metadata: metadata as any,
        },
      });
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
      console.error("Error creating notification:", error);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      return await prisma.notification.update({
        where: { id },
        data: {
          read: true,
          updated_at: new Date(),
        },
      });
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

      return await prisma.notification.updateMany({
        where: {
          user_id: user.id,
          read: false,
        },
        data: {
          read: true,
          updated_at: new Date(),
        },
      });
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

      await prisma.notification.delete({
        where: { id },
      });

      return id;
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
      console.error("Error deleting notification:", error);
    },
  });

  // Clear all notifications mutation
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await prisma.notification.deleteMany({
        where: {
          user_id: user.id,
        },
      });
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
        // invalidate cache
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(user?.id || ""),
        });
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
