import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const createOrUpdateProfile = useCallback(async (user: User) => {
    try {
      const profileData = {
        user_id: user.id,
        email: user.email,
        display_name:
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(profileData, {
        onConflict: "user_id",
      });

      if (error) {
        console.error("Error updating profile:", error);
        return { error };
      }
      console.log("Profile updated successfully for user:", user.id);
      return { error: null };
    } catch (error) {
      console.error("Error in createOrUpdateProfile:", error);
      return { error };
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking session:", error);
        throw error;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await createOrUpdateProfile(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setSession(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createOrUpdateProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      await checkSession();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        console.log("Auth state changed:", event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        if (
          session?.user &&
          (event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "PASSWORD_RECOVERY")
        ) {
          await createOrUpdateProfile(session.user);
        }

        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    initializeAuth().catch((error) => {
      console.error("Error initializing auth:", error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Periodic session refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      if (mounted) {
        checkSession().catch((error) => {
          console.error("Periodic session check failed:", error);
        });
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [checkSession, createOrUpdateProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        setLoading(true);
        const redirectUrl = `${window.location.origin}/`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          console.error("Sign up error:", error);
          return { error };
        }

        if (data.user) {
          await createOrUpdateProfile(data.user);
        }

        return { error: null };
      } catch (error) {
        console.error("Sign up error:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    [createOrUpdateProfile]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
          return { error };
        }

        if (data.user) {
          await createOrUpdateProfile(data.user);
        }

        return { error: null };
      } catch (error) {
        console.error("Sign in error:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    [createOrUpdateProfile]
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password,
      });

      return { error };
    } catch (error) {
      console.error("Update password error:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
