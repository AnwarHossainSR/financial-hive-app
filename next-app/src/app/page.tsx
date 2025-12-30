"use client";

import { BookSelector } from "@/components/BookSelector";
import { Header } from "@/components/Header";
import { useBooks } from "@/hooks/useBooks";

export default function DashboardPage() {
  const { initialized: booksInitialized } = useBooks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <Header title="CashBook" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Manage Your Finances
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a book to track your expenses, or create a new one to get
              started.
            </p>
          </div>

          <BookSelector selectedBook={null} onSelectBook={() => {}} />
        </div>
      </main>
    </div>
  );
}
