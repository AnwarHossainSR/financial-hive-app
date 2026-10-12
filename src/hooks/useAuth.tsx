"use client";

import { ensureProfileExistsAction } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Lazy singleton to avoid module-level initialization during prerendering
let supabaseInstance: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-sync the profile at least daily, in case the row was changed elsewhere
const PROFILE_RESYNC_MS = 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Upserts the profile row only when the synced fields changed or a day has
   * passed, not on every page load or hourly token refresh. It's a server
   * action, and actions run one at a time, so a needless call delays the
   * page's own data requests.
   */
  const syncProfile = useCallback(async (user: User) => {
    const fields = {
      id: user.id,
      email: user.email,
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
    };
    const markerKey = `profile-synced:${user.id}`;
    const signature = JSON.stringify(fields);

    try {
      const marker = JSON.parse(localStorage.getItem(markerKey) ?? "null");
      if (
        marker?.signature === signature &&
        Date.now() - marker.at < PROFILE_RESYNC_MS
      ) {
        return;
      }
    } catch {
      // Storage unavailable or corrupt: just sync
    }

    try {
      const { error } = await ensureProfileExistsAction(fields);
      if (error) throw new Error(error);
      try {
        localStorage.setItem(
          markerKey,
          JSON.stringify({ signature, at: Date.now() }),
        );
      } catch {
        // Not persisting the marker only means syncing again next load
      }
    } catch (error) {
      console.error("Error syncing profile:", error);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await getSupabase().auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        // Resolve from the local session — no network call. The server
        // verifies the token itself on every request, so the client doesn't
        // need a getUser() round trip just to render.
        setSession(session);
        setUser(session.user);
        syncProfile(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [syncProfile]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        // Initial check
        await checkSession();

        const { data } = getSupabase().auth.onAuthStateChange(
          async (event: string, currentSession: Session | null) => {
            if (!mounted) return;

            if (event === "SIGNED_OUT") {
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }

            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);

              if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                syncProfile(currentSession.user);
              }
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
              // If event suggests we should have a user but don't, re-check
              await checkSession();
            }

            setLoading(false);
          },
        );

        subscription = data.subscription;
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // No polling: the Supabase client refreshes tokens itself and reports
    // changes through onAuthStateChange above.
    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [checkSession, syncProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        setLoading(true);
        const redirectUrl = `${window.location.origin}/`;

        const { data, error } = await getSupabase().auth.signUp({
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

        // With email confirmation there's no session yet; the profile is
        // created on first sign-in instead
        if (data.user && data.session) {
          await syncProfile(data.user);
        }

        return { error: null };
      } catch (error) {
        console.error("Sign up error:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    [syncProfile],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await getSupabase().auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
          return { error };
        }

        if (data.user) {
          await syncProfile(data.user);
        }

        return { error: null };
      } catch (error) {
        console.error("Sign in error:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    [syncProfile],
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
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
      const { error } = await getSupabase().auth.updateUser({
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
      const { error } = await getSupabase().auth.signOut();

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
