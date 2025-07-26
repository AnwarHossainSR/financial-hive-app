import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const TransactionsSkeleton = () => (
  <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-gray-800 overflow-hidden">
    <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-40" />
        <div className="flex gap-2">
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-64" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-20" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-24" />
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-32" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-20" />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
