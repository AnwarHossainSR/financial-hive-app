import { cn, parseCategories } from "@/lib/utils";

interface CategoryTagsProps {
  category: string;
  type: "income" | "expense";
  /** Max tags to render before collapsing the rest into a "+N" chip */
  max?: number;
  className?: string;
}

export function CategoryTags({
  category,
  type,
  max,
  className,
}: CategoryTagsProps) {
  const categories = parseCategories(category);
  const visible = max ? categories.slice(0, max) : categories;
  const hidden = categories.slice(visible.length);

  const tagClass = cn(
    "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[11px] font-medium leading-none ring-1 ring-inset",
    type === "income"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20"
      : "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  );

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      {visible.map((cat) => (
        <span key={cat} className={tagClass}>
          {cat}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.join(", ")}
          className="inline-flex h-5 shrink-0 items-center rounded-md bg-gray-100 px-1.5 text-[11px] font-medium leading-none text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          +{hidden.length}
        </span>
      )}
    </div>
  );
}
