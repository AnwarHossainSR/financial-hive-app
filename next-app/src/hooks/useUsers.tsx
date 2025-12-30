import { getProfileRole } from "@/app/actions/user-settings";
import {
  deleteUserAction,
  getUsersAction,
  getUserStatsAction,
  updateUserRoleAction,
} from "@/app/actions/users";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

interface UserWithProfile {
  id: string;
  email: string;
  role?: string;
  display_name?: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

interface UseUsersConfig {
  searchTerm?: string;
  roleFilter?: string;
  sortBy?: "created_at" | "email";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export const useUsers = (config: UseUsersConfig = {}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const {
    searchTerm = "",
    roleFilter,
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 20,
  } = config;

  // Check if current user is admin
  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { role, error } = await getProfileRole(currentUser.id);
        if (!error) {
          setIsAdmin(role === "admin");
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Fetch users using Server Action
  const fetchUsers = useCallback(
    async (page: number = 0, append: boolean = false) => {
      // In a real app, you'd check server-side too (we do in the action)
      if (!isAdmin) return;

      const isLoadingMore = page > 0;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        if (!append) setUsers([]);
      }

      try {
        const {
          users: fetchedUsers,
          total,
          error,
        } = await getUsersAction({
          searchTerm,
          roleFilter,
          sortBy,
          sortOrder,
          page,
          limit,
        });

        if (error) throw new Error(error);

        const formattedUsers = (fetchedUsers as any[]).map((p) => ({
          ...p,
          id: p.user_id,
          user_metadata: {
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          },
        }));

        if (append) {
          setUsers((prevUsers) => [...prevUsers, ...formattedUsers]);
        } else {
          setUsers(formattedUsers);
          setCurrentPage(0);
        }

        setTotalUsers(total);
        setHasNextPage(formattedUsers.length === limit);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAdmin, searchTerm, roleFilter, sortBy, sortOrder, limit, toast]
  );

  // Load more users for infinite scroll
  const loadMoreUsers = useCallback(() => {
    if (!hasNextPage || loadingMore || loading) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchUsers(nextPage, true);
  }, [currentPage, hasNextPage, loadingMore, loading, fetchUsers]);

  // Update user role
  const updateUserRole = useCallback(
    async (userId: string, newRole: string) => {
      try {
        const { success, error } = await updateUserRoleAction(userId, newRole);
        if (error) throw new Error(error);

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      } catch (error: any) {
        console.error("Error updating user role:", error);
        throw error;
      }
    },
    []
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      if (userId === currentUser?.id) {
        throw new Error("You cannot delete your own account");
      }

      try {
        const { success, error } = await deleteUserAction(userId);
        if (error) throw new Error(error);

        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        setTotalUsers((prev) => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error("Error deleting user:", error);
        throw error;
      }
    },
    [currentUser?.id]
  );

  // Get user statistics
  const getUserStats = useCallback(async () => {
    try {
      const { stats, error } = await getUserStatsAction();
      if (error) throw new Error(error);
      return stats;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
  }, []);

  // Reset and refetch when config changes
  useEffect(() => {
    if (isAdmin) {
      setCurrentPage(0);
      setHasNextPage(true);
      fetchUsers(0, false);
    }
  }, [isAdmin, searchTerm, roleFilter, sortBy, sortOrder]);

  return {
    users,
    totalUsers,
    loading,
    loadingMore,
    isAdmin,
    hasNextPage,
    fetchUsers: () => fetchUsers(0, false),
    loadMore: loadMoreUsers,
    updateUserRole,
    deleteUser,
    getUserStats,
  };
};
