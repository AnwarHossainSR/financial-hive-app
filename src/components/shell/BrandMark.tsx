import { cn } from "@/lib/utils";
import { Hexagon } from "lucide-react";

export function BrandMark({
  className,
  withName = false,
  nameClassName,
}: {
  className?: string;
  withName?: boolean;
  nameClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-gold shadow-primary ring-1 ring-inset ring-white/10",
          className,
        )}
      >
        <Hexagon className="h-5 w-5" strokeWidth={2.5} />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      {withName && (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            nameClassName,
          )}
        >
          Financial Hive
        </span>
      )}
    </span>
  );
}
