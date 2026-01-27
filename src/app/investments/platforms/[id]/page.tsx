"use client";

import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { InvestmentProjectCard } from "@/components/InvestmentProjectCard";
import { Button } from "@/components/ui/button";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { InvestmentProject } from "@/types/investment";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlatformDetailsPage() {
  const params = useParams();
  const platformId = params.id as string;
  const { platform, isLoading } = useInvestmentPlatform(platformId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
          <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
          <div className="h-[200px] rounded-lg border bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Platform Not Found</h1>
        <Link href="/investments">
          <Button variant="ghost" className="mt-4">
            Back to Investments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20 md:pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/investments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {platform.name}
            </h1>
            {platform.description && (
              <p className="text-muted-foreground">{platform.description}</p>
            )}
          </div>
        </div>
        <CreateProjectDialog platformId={platform.id}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </CreateProjectDialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        {(platform.projects || []).length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <h3 className="text-lg font-semibold mb-2">
              No projects in this platform
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by adding a project to {platform.name}.
            </p>
            <CreateProjectDialog platformId={platform.id}>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </CreateProjectDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(platform.projects || []).map((project: InvestmentProject) => (
              <InvestmentProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
