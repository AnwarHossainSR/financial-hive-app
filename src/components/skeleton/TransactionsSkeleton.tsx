import { Skeleton } from "@/components/ui/skeleton";

/** Matches TransactionsSection: toolbar, a day header, then rows */
export const TransactionsSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
    <div className="space-y-3 border-b p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
    <div className="space-y-1 p-3 sm:p-4">
      <Skeleton className="mb-3 ml-2 h-3 w-16" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);
