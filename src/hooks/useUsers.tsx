import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { prisma } from "@/lib/prisma";
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
        const profile = await prisma.profile.findUnique({
          where: { user_id: currentUser.id },
          select: { role: true },
        });

        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Fetch users using Prisma
  const fetchUsers = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (!isAdmin) return;

      const isLoadingMore = page > 0;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        if (!append) setUsers([]);
      }

      try {
        const where: any = {};
        if (searchTerm) {
          where.OR = [
            { email: { contains: searchTerm, mode: "insensitive" } },
            { display_name: { contains: searchTerm, mode: "insensitive" } },
          ];
        }
        if (roleFilter) {
          where.role = roleFilter;
        }

        const [profilesData, count] = await Promise.all([
          prisma.profile.findMany({
            where,
            orderBy: {
              [sortBy]: sortOrder,
            },
            skip: page * limit,
            take: limit,
          }),
          prisma.profile.count({ where }),
        ]);

        const formattedUsers: UserWithProfile[] = profilesData.map(
          (profile) => ({
            id: profile.user_id,
            email: profile.email || "",
            created_at: profile.created_at.toISOString(),
            updated_at: profile.updated_at.toISOString(),
            role: profile.role || "user",
            display_name: profile.display_name || undefined,
            user_metadata: {
              display_name: profile.display_name,
            },
            aud: "authenticated",
            email_confirmed_at: profile.created_at.toISOString(),
            last_sign_in_at: profile.updated_at.toISOString(),
            app_metadata: {},
            identities: [],
          })
        );

        if (append) {
          setUsers((prevUsers) => [...prevUsers, ...formattedUsers]);
        } else {
          setUsers(formattedUsers);
          setCurrentPage(0);
        }

        setTotalUsers(count);
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
        await prisma.profile.update({
          where: { user_id: userId },
          data: {
            role: newRole,
            updated_at: new Date(),
          },
        });

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
        await prisma.$transaction([
          prisma.transaction.deleteMany({ where: { user_id: userId } }),
          prisma.bookMember.deleteMany({
            where: {
              OR: [{ user_id: userId }, { book: { owner_id: userId } }],
            },
          }),
          prisma.monthlyBudget.deleteMany({
            where: {
              book: { owner_id: userId },
            },
          }),
          prisma.book.deleteMany({ where: { owner_id: userId } }),
          prisma.userSettings.deleteMany({ where: { user_id: userId } }),
          prisma.notification.deleteMany({ where: { user_id: userId } }),
          prisma.profile.delete({ where: { user_id: userId } }),
        ]);

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
      const profilesData = await prisma.profile.findMany({
        select: { role: true },
      });

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
