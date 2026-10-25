import { cn, parseCategories } from "@/lib/utils";

interface CategoryTagsProps {
  category: string;
  /** Kept for callers; tags are neutral so the amount carries the color */
  type?: "income" | "expense";
  /** Max tags to render before collapsing the rest into a "+N" chip */
  max?: number;
  className?: string;
}

const tagClass =
  "inline-flex h-5 shrink-0 items-center rounded-md bg-muted px-1.5 text-[11px] font-medium leading-none text-muted-foreground";

export function CategoryTags({ category, max, className }: CategoryTagsProps) {
  const categories = parseCategories(category);
  const visible = max ? categories.slice(0, max) : categories;
  const hidden = categories.slice(visible.length);

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      {visible.map((cat) => (
        <span key={cat} className={tagClass}>
          {cat}
        </span>
      ))}
      {hidden.length > 0 && (
        <span title={hidden.join(", ")} className={tagClass}>
          +{hidden.length}
        </span>
      )}
    </div>
  );
}
