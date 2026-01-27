"use client";

import { BookSelector } from "@/components/BookSelector";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Header } from "@/components/Header";
import { InvestmentProjectCard } from "@/components/InvestmentProjectCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInvestmentProjects } from "@/hooks/useInvestmentProjects";
import { Plus, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { projects, isLoading: projectsLoading } = useInvestmentProjects();

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
              <CreateProjectDialog>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </CreateProjectDialog>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <InvestmentProjectCard key={project.id} project={project} />
                ))}

                {/* Add new card also in grid for easy access */}
                <CreateProjectDialog>
                  <Card className="h-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 space-y-2 min-h-[200px] text-muted-foreground hover:text-primary">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">Create New Project</span>
                  </Card>
                </CreateProjectDialog>
              </div>
            ) : (
              <CreateProjectDialog>
                <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground hover:text-primary">
                  <div className="p-4 rounded-full bg-primary/10">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      No Investment Projects
                    </h3>
                    <p className="text-sm opacity-80">
                      Start tracking your investments today
                    </p>
                  </div>
                  <Button variant="ghost">Create Project</Button>
                </Card>
              </CreateProjectDialog>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
