import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

interface UserWithProfile extends Omit<User, "email"> {
  role?: string;
  display_name?: string;
  email: string;
}

interface UseUsersConfig {
  searchTerm?: string;
  roleFilter?: string;
  sortBy?: "created_at" | "email" | "last_sign_in";
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
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("user_id", currentUser.id)
          .single();

        if (error) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Fetch users from Supabase Auth
  const fetchUsers = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (!isAdmin) return;

      const isLoadingMore = page > 0;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setUsers([]);
      }

      try {
        // Build the query step by step
        let query = supabase.from("profiles").select(
          `
            user_id,
            email,
            display_name,
            role,
            created_at,
            updated_at
          `,
          { count: "exact" }
        ); // Add count: 'exact' to get total count

        // Apply search filter
        if (searchTerm) {
          query = query.ilike("email", `%${searchTerm}%`);
        }

        // Apply role filter
        if (roleFilter) {
          query = query.eq("role", roleFilter);
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === "asc" });

        // Apply pagination
        const from = page * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: profilesData, error: profilesError, count } = await query;

        if (profilesError) {
          console.error("Profiles error:", profilesError);
          throw profilesError;
        }

        if (!profilesData) {
          throw new Error("No data returned");
        }

        console.log(
          "Fetched profiles:",
          profilesData.length,
          "Total count:",
          count
        );

        // Get additional user data from auth.users if needed
        // For now, we'll work with profiles data and simulate auth user structure
        const formattedUsers: UserWithProfile[] = profilesData.map(
          (profile) => ({
            id: profile.user_id,
            email: profile.email || "",
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            role: profile.role || "user",
            display_name: profile.display_name,
            user_metadata: {
              display_name: profile.display_name,
            },
            // Simulate auth user fields
            aud: "authenticated",
            email_confirmed_at: profile.created_at,
            last_sign_in_at: profile.updated_at,
            app_metadata: {},
            identities: [],
          })
        );

        if (append && page > 0) {
          setUsers((prevUsers) => [...prevUsers, ...formattedUsers]);
        } else {
          setUsers(formattedUsers);
          setCurrentPage(0);
        }

        // Use count from query, fallback to data length if count is null
        const totalCount = count !== null ? count : formattedUsers.length;
        setTotalUsers(totalCount);
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
      if (!isAdmin) {
        throw new Error("Only admins can update user roles");
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          throw error;
        }

        // Update local state
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
    [isAdmin]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      if (!isAdmin) {
        throw new Error("Only admins can delete users");
      }

      if (userId === currentUser?.id) {
        throw new Error("You cannot delete your own account");
      }

      try {
        // Delete user-related data first - use explicit typing to avoid TS inference issues
        const deletePromises = [
          supabase
            .from("transactions")
            .delete()
            .eq("user_id", userId) as Promise<any>,
          supabase
            .from("book_members")
            .delete()
            .eq("user_id", userId) as Promise<any>,
          supabase
            .from("user_settings")
            .delete()
            .eq("user_id", userId) as Promise<any>,
          supabase
            .from("profiles")
            .delete()
            .eq("user_id", userId) as Promise<any>,
        ];

        // Only delete from books and monthly_budgets if those tables exist
        try {
          deletePromises.push(
            supabase
              .from("books")
              .delete()
              .eq("user_id", userId) as Promise<any>,
            supabase
              .from("monthly_budgets")
              .delete()
              .eq("user_id", userId) as Promise<any>
          );
        } catch (tableError) {
          console.log(
            "Some tables might not exist, continuing with deletion..."
          );
        }

        const results = await Promise.allSettled(deletePromises);

        // Log any failed deletions but don't stop the process
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            console.warn(
              `Failed to delete from table ${index}:`,
              result.reason
            );
          }
        });

        // Note: Deleting from auth.users requires admin privileges
        // This would typically be done through a server-side function
        // For now, we'll just remove from profiles and update local state

        // Update local state
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        setTotalUsers((prev) => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error("Error deleting user:", error);
        throw error;
      }
    },
    [isAdmin, currentUser?.id]
  );

  // Get user statistics
  const getUserStats = useCallback(async () => {
    if (!isAdmin) return null;

    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("role");

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      if (!profilesData) {
        return null;
      }

      const roleStats = profilesData.reduce((acc, profile) => {
        const role = profile.role || "user";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: profilesData.length,
        ...roleStats,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
  }, [isAdmin]);

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
