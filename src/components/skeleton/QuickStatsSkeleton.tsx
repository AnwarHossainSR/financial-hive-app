import { Card, CardContent } from "@/components/ui/card";

export const QuickStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    {[...Array(4)].map((_, i) => (
      <Card
        key={i}
        className="border-none shadow-lg rounded-xl bg-white dark:bg-gray-800 overflow-hidden"
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-20" />
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-24" />
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
