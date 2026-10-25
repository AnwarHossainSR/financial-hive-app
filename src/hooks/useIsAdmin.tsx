import { getProfileRole } from "@/app/actions/user-settings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

/** The signed-in user's role ("user", "moderator" or "admin") */
export const useProfileRole = () => {
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["profile-role", user?.id],
    queryFn: async () => {
      const { role, error } = await getProfileRole();
      if (error) throw new Error(error);
      return role;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
  return { role: query.data, isLoading: loading || query.isLoading };
};

/** Whether the signed-in user has the admin role (for admin-only navigation) */
export const useIsAdmin = () => useProfileRole().role === "admin";
