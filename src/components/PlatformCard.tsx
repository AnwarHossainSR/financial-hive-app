import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvestmentPlatform } from "@/types/investment";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { 
  ArrowRight, 
  Box, 
  Calendar, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Target,
  Activity
} from "lucide-react";
import Link from "next/link";

interface PlatformCardProps {
  platform: InvestmentPlatform & {
    projects?: Array<{
      total_investment?: number;
      total_profit_loss?: number;
      remaining_capital?: number;
      status?: string;
    }>;
  };
}

export function PlatformCard({ platform }: PlatformCardProps) {
  // Calculate aggregate stats
  const stats = platform.projects?.reduce(
    (acc, project) => ({
      totalInvestment: acc.totalInvestment + (Number(project.total_investment) || 0),
      totalProfitLoss: acc.totalProfitLoss + (Number(project.total_profit_loss) || 0),
      remainingCapital: acc.remainingCapital + (Number(project.remaining_capital) || 0),
      activeProjects: acc.activeProjects + (project.status === 'active' ? 1 : 0),
    }),
    { totalInvestment: 0, totalProfitLoss: 0, remainingCapital: 0, activeProjects: 0 }
  ) || { totalInvestment: 0, totalProfitLoss: 0, remainingCapital: 0, activeProjects: 0 };

  const totalProjects = platform._count?.projects || 0;
  const roi = stats.totalInvestment > 0 ? (stats.totalProfitLoss / stats.totalInvestment * 100) : 0;

  return (
    <Link
      href={`/investments/platforms/${platform.id}`}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 transform group-hover:scale-[1.02]">
        {/* Gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full -translate-y-16 translate-x-16" />
        
        <CardHeader className="pb-3 relative">
          <CardTitle className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold truncate group-hover:text-blue-600 transition-colors">
                  {platform.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    {stats.activeProjects} Active
                  </Badge>
                  {totalProjects > 0 && (
                    <Badge 
                      variant={roi >= 0 ? "default" : "destructive"} 
                      className="text-xs"
                    >
                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:text-blue-600" />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
            {platform.description || "No description provided."}
          </p>

          {/* Stats Grid */}
          {totalProjects > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Invested</span>
                </div>
                <div className="text-sm font-bold text-green-800 dark:text-green-200">
                  {formatCurrency(stats.totalInvestment)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Current</span>
                </div>
                <div className="text-sm font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(stats.remainingCapital)}
                </div>
              </div>
            </div>
          )}

          {/* Profit/Loss Section */}
          {totalProjects > 0 && (
            <div className={`p-3 rounded-lg border ${
              stats.totalProfitLoss >= 0 
                ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-100 dark:border-emerald-800/30" 
                : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800/30"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stats.totalProfitLoss >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    stats.totalProfitLoss >= 0 
                      ? "text-emerald-700 dark:text-emerald-300" 
                      : "text-red-700 dark:text-red-300"
                  }`}>
                    {stats.totalProfitLoss >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </div>
                <div className={`text-sm font-bold ${
                  stats.totalProfitLoss >= 0 
                    ? "text-emerald-800 dark:text-emerald-200" 
                    : "text-red-800 dark:text-red-200"
                }`}>
                  {formatCurrency(Math.abs(stats.totalProfitLoss))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="w-3 h-3" />
              <span>{totalProjects} Project{totalProjects !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(platform.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
