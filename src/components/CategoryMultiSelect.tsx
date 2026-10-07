"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CategoryMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

// Rendered inline (no portal) so it scrolls and receives clicks correctly
// inside the scrollable transaction dialogs.
export function CategoryMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select categories",
  className,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep already-selected values visible even if they're no longer in the
  // option list (e.g. legacy or imported categories) so they can be removed.
  const allOptions = [
    ...options,
    ...value.filter((v) => !options.includes(v)),
  ];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-slate-50/50 px-3 py-2 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900/50"
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {v}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${v}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  className="rounded-sm hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-popover p-1 text-popover-foreground shadow-md dark:border-gray-700">
          {allOptions.map((option) => {
            const checked = value.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(option)}
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
