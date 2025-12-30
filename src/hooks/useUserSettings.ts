import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { prisma } from "@/lib/prisma";
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
        // Fetch settings - Model name is UserSettings (plural as in schema)
        const userSettings = await prisma.userSettings.findUnique({
          where: { user_id: user.id },
        });

        if (userSettings) {
          setSettings({
            default_book_id: userSettings.default_book_id,
            notifications: userSettings.notifications as any,
            export_format: userSettings.export_format,
            currency: userSettings.currency,
          });
        }

        // Check admin status
        const profile = await prisma.profile.findUnique({
          where: { user_id: user.id },
          select: { role: true },
        });

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

      await prisma.userSettings.upsert({
        where: { user_id: user.id },
        update: {
          default_book_id: updates.default_book_id,
          notifications: updates.notifications as any,
          export_format: updates.export_format,
          currency: updates.currency,
          updated_at: new Date(),
        },
        create: {
          user_id: user.id,
          default_book_id: updates.default_book_id,
          notifications: updates.notifications as any,
          export_format: updates.export_format,
          currency: updates.currency,
        },
      });

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
    setLoading(true);
    try {
      const [transactions, books] = await Promise.all([
        prisma.transaction.findMany({ where: { user_id: user.id } }),
        prisma.book.findMany({ where: { owner_id: user.id } }),
      ]);

      if (format === "csv") {
        const csv = [
          "Transactions",
          "id,book_id,date,category,amount,note",
          ...(transactions?.map(
            (t) =>
              `${t.id},${t.book_id},${t.date.toISOString()},${t.category},${
                t.amount
              },${t.note || ""}`
          ) || []),
          "",
          "Books",
          "id,name,created_at",
          ...(books?.map(
            (b) => `${b.id},${b.name},${b.created_at.toISOString()}`
          ) || []),
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
      // Use transaction to ensure all deletions happen or none
      await prisma.$transaction([
        prisma.transaction.deleteMany({}),
        prisma.bookMember.deleteMany({}),
        prisma.monthlyBudget.deleteMany({}),
        prisma.book.deleteMany({}),
        prisma.userSettings.deleteMany({}),
        prisma.notification.deleteMany({}),
        prisma.profile.deleteMany({}),
      ]);

      // Delete storage objects in receipts bucket
      const { data: files } = await supabase.storage.from("receipts").list("");
      if (files && files.length > 0) {
        await supabase.storage
          .from("receipts")
          .remove(files.map((f) => f.name));
      }

      toast({
        title: "Database cleared",
        description: "All application data has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Clear database error:", error);
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
      // Delete user-related data using Prisma
      // Order matters due to manual relations and cascade if configured
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { user_id: user.id } }),
        prisma.bookMember.deleteMany({
          where: {
            OR: [{ user_id: user.id }, { book: { owner_id: user.id } }],
          },
        }),
        prisma.monthlyBudget.deleteMany({
          where: {
            book: { owner_id: user.id },
          },
        }),
        prisma.book.deleteMany({ where: { owner_id: user.id } }),
        prisma.userSettings.deleteMany({ where: { user_id: user.id } }),
        prisma.notification.deleteMany({ where: { user_id: user.id } }),
        prisma.profile.delete({ where: { user_id: user.id } }),
      ]);

      await supabase.auth.signOut();

      toast({
        title: "Account deleted",
        description:
          "Your account data has been deleted and you have been signed out.",
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
