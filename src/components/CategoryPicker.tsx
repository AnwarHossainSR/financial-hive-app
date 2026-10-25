"use client";

import { getCategoryIcon } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { createElement } from "react";

interface CategoryPickerProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  type: "income" | "expense";
  className?: string;
}

/**
 * All categories visible at once as icon chips (multi-select). Selected
 * values that aren't in the list (legacy or imported names) are still shown
 * so they can be removed.
 */
export function CategoryPicker({
  options,
  value,
  onChange,
  type,
  className,
}: CategoryPickerProps) {
  const allOptions = [
    ...options,
    ...value.filter((v) => !options.includes(v)),
  ];

  const toggle = (option: string) =>
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );

  return (
    <div
      role="group"
      aria-label="Categories"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {allOptions.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
              selected
                ? type === "income"
                  ? "border-income/40 bg-income/10 text-income"
                  : "border-expense/40 bg-expense/10 text-expense"
                : "bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {selected ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              createElement(getCategoryIcon(option, type), {
                className: "h-3.5 w-3.5",
              })
            )}
            {option}
          </button>
        );
      })}
    </div>
  );
}
