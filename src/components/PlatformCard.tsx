import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentPlatform } from "@/types/investment";
import { format } from "date-fns";
import { ArrowRight, Box, Calendar, Layers } from "lucide-react";
import Link from "next/link";

interface PlatformCardProps {
  platform: InvestmentPlatform;
}

export function PlatformCard({ platform }: PlatformCardProps) {
  return (
    <Link
      href={`/investments/platforms/${platform.id}`}
      className="group h-full"
    >
      <Card className="h-full border-t-4 border-t-indigo-500 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 bg-gradient-to-br from-card to-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-500" />
              <span className="text-xl font-bold truncate group-hover:text-indigo-600 transition-colors">
                {platform.name}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
              {platform.description || "No description provided."}
            </p>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Total Projects
                </span>
                <span className="font-bold bg-secondary px-2 py-0.5 rounded-md text-foreground">
                  {platform._count?.projects || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Created
                </span>
                <span>
                  {format(new Date(platform.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
