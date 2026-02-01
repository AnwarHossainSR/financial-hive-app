"use client";

import { getIsolatedInvestmentPlatformsAction } from "@/app/actions/platform-actions";
import { BookSelector } from "@/components/BookSelector";
import { CreatePlatformDialog } from "@/components/CreatePlatformDialog";
import { Header } from "@/components/Header";
import { PlatformCard } from "@/components/PlatformCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { InvestmentPlatform } from "@/types/investment";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";

export default function DashboardClient() {
  const { user, loading } = useAuth();

  const { data: platforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ["investment-platforms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { platforms, error } = await getIsolatedInvestmentPlatformsAction(
        user.id,
      );
      if (error) throw new Error(error);
      return platforms;
    },
    enabled: !!user?.id && !loading,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <Header title="CashBook" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Books Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Financial Hive
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage your personal finances and investments in one place.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Books
                </h2>
              </div>
              <BookSelector selectedBook={null} onSelectBook={() => {}} />
            </div>
          </section>

          {/* Investments Section */}
          <section className="space-y-4 animate-slide-in-up delay-200">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Investments
              </h2>
              <CreatePlatformDialog>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  New Platform
                </Button>
              </CreatePlatformDialog>
            </div>

            {platformsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : platforms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map((platform: InvestmentPlatform) => (
                  <PlatformCard key={platform.id} platform={platform} />
                ))}

                {/* Add new card also in grid for easy access */}
                <CreatePlatformDialog>
                  <Card className="h-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 space-y-2 min-h-[200px] text-muted-foreground hover:text-primary">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">Create New Platform</span>
                  </Card>
                </CreatePlatformDialog>
              </div>
            ) : (
              <CreatePlatformDialog>
                <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground hover:text-primary">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      No Investment Platforms
                    </h3>
                    <p className="text-sm opacity-80">
                      Create a platform (e.g., i-Farmer) to start tracking
                      projects
                    </p>
                  </div>
                  <Button variant="ghost">Create Platform</Button>
                </Card>
              </CreatePlatformDialog>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
