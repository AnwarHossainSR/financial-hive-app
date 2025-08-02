import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const BookSelectorSkeleton = () => {
  return (
    <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md animate-scale-in">
      <CardHeader className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg text-foreground mr-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Select Book</span>
          </CardTitle>
          <div className="h-8 w-24 bg-muted rounded-lg animate-pulse"></div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="group relative p-4 rounded-lg border border-border bg-white dark:bg-gray-900 bg-opacity-90 backdrop-blur-sm animate-scale-in w-52"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 w-full">
                  {/* Icon skeleton */}
                  <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>

                  <div className="flex-1 space-y-2">
                    {/* Book name skeleton */}
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>

                    {/* Book type skeleton */}
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>

                    {/* Description skeleton (optional, varies per card) */}
                    {i % 2 === 0 && (
                      <div className="space-y-1">
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Random default badge skeleton for some cards */}
              {i === 0 && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
