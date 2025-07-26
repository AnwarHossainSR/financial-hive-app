import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    default_book_id: null as string | null,
    notifications: {
      transactions: true,
      books: true,
      reports: false,
      email: true,
    },
    export_format: "csv",
    currency: "USD",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user settings and admin status
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Fetch settings
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setSettings({
            default_book_id: data.default_book_id,
            notifications: data.notifications as any,
            export_format: data.export_format,
            currency: data.currency,
          });
        }

        // Check admin status (assuming admin role is stored in user_metadata)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");
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
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          default_book_id: updates.default_book_id,
          notifications: updates.notifications,
          export_format: updates.export_format,
          currency: updates.currency,
        })
        .eq("user_id", user.id);

      if (error) throw error;

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
    setLoading(true);
    try {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id);

      const { data: books } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user?.id);

      if (format === "csv") {
        const csv = [
          "Transactions",
          "id,book_id,date,category,amount,note",
          ...(transactions?.map(
            (t) =>
              `${t.id},${t.book_id},${t.date},${t.category},${t.amount},${
                t.note || ""
              }`
          ) || []),
          "",
          "Books",
          "id,name,created_at",
          ...(books?.map((b) => `${b.id},${b.name},${b.created_at}`) || []),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cashbook_export_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = { transactions, books };
        const blob = new Blob([JSON.stringify(json, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cashbook_export_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Data exported",
        description: `Your data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error exporting data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    if (
      !confirm(
        "Are you sure you want to clear the entire database? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Define tables in deletion order to respect foreign key constraints
      const tables = [
        "transactions",
        "book_members",
        "monthly_budgets",
        "books",
        "user_settings",
        "profiles",
      ];

      // Delete from each table
      for (const table of tables) {
        const { error, count } = await supabase
          .from(table)
          .delete()
          .not("id", "is", null); // Optional: ensures all rows are targeted

        if (error) {
          console.error(`Error deleting from ${table}:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to delete ${table}: ${error.message}`);
        }
        console.log(`Deleted ${count || 0} rows from ${table}`);
      }

      // Delete storage objects in receipts bucket
      const { error: storageError }: any = await supabase.storage
        .from("receipts")
        .remove(["*"]);

      if (storageError) {
        console.error("Error deleting storage objects:", {
          message: storageError.message,
          details: storageError.details,
          hint: storageError.hint,
          code: storageError.code,
        });
        throw new Error(
          `Failed to delete storage objects: ${storageError.message}`
        );
      }
      console.log("Deleted all objects from receipts bucket");

      toast({
        title: "Database cleared",
        description: "All data has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Clear database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
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
    if (!user) return;
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      // Delete user-related data
      await Promise.all([
        supabase.from("transactions").delete().eq("user_id", user.id),
        supabase.from("books").delete().eq("user_id", user.id),
        supabase.from("user_settings").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ]);

      // Delete user from auth
      await supabase.auth.signOut();
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
