"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentPlatform } from "@/types/investment";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import Link from "next/link";

interface PlatformCardProps {
  platform: InvestmentPlatform;
}

export function PlatformCard({ platform }: PlatformCardProps) {
  return (
    <Link href={`/investments/platforms/${platform.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start">
            <span className="text-xl font-bold truncate">{platform.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
              {platform.description || "No description provided."}
            </p>

            <div className="pt-2 mt-2 border-t flex justify-between items-center">
              <span className="text-muted-foreground text-sm flex items-center">
                <Layers className="w-4 h-4 mr-1" /> Projects
              </span>
              <span className="font-semibold">
                {platform._count?.projects || 0}
              </span>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Created {format(new Date(platform.created_at), "MMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
