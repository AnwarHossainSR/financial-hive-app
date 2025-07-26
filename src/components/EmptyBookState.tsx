import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp } from "lucide-react";

export const EmptyBookState = () => (
  <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
    <CardContent className="py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 scale-150"></div>
        <BookOpen className="relative w-24 h-24 mx-auto mb-8 text-blue-500 dark:text-blue-400 animate-bounce drop-shadow-lg" />
      </div>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent mb-6">
        Welcome to CashBook
      </h3>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
        Select a book above to start tracking your income and expenses with
        modern, intuitive design.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-4 h-4" />
        <span>
          Organize your finances by creating books for personal, business, or
          project-specific expenses.
        </span>
      </div>
    </CardContent>
  </Card>
);
