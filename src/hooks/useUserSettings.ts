import {
  clearDatabaseAction,
  getProfileRole,
  getUserSettings,
  updateUserSettingsAction,
} from "@/app/actions/user-settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [settings, setSettings] = useState({
    default_book_id: null as string | null,
    notifications: {
      transactions: true,
      books: true,
      reports: false,
      email: true,
    },
    export_format: "csv",
    currency: "BDT",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user settings and admin status
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { settings: userSettings, error: settingsError } =
          await getUserSettings(user.id);

        if (settingsError) throw new Error(settingsError);

        if (userSettings) {
          setSettings({
            default_book_id: userSettings.default_book_id,
            notifications: userSettings.notifications as any,
            export_format: userSettings.export_format,
            currency: userSettings.currency,
          });
        }

        const { role, error: roleError } = await getProfileRole(user.id);
        if (roleError) throw new Error(roleError);

        setIsAdmin(role === "admin");
      } catch (error: any) {
        toast({
          title: "Error fetching settings",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, toast]);

  // Update settings
  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    if (!user) return;

    setLoading(true);
    try {
      const updates = { ...settings, ...newSettings };
      const { error } = await updateUserSettingsAction(user.id, updates);

      if (error) throw new Error(error);

      setSettings(updates);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const exportData = async (format: "csv" | "json") => {
    if (!user) return;
    toast({
      title: "Feature temporarily unavailable",
      description: "Data export is being refactored for the new architecture.",
    });
  };

  // Clear database (admin only)
  const clearDatabase = async () => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can clear the database.",
        variant: "destructive",
      });
      return;
    }
    // The settings page asks for typed confirmation before calling this

    setLoading(true);
    try {
      const { success, error } = await clearDatabaseAction(isAdmin);
      if (!success) throw new Error(error || "Failed to clear database");

      toast({
        title: "Database cleared",
        description: "All application data has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error clearing database",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    toast({
      title: "Feature temporarily unavailable",
      description:
        "Account deletion is being refactored for the new architecture.",
    });
  };

  return {
    settings,
    isAdmin,
    loading,
    updateSettings,
    exportData,
    clearDatabase,
    deleteAccount,
  };
};
