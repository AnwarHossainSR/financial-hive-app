"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getCurrentMonth } from "@/lib/utils";
import { addMonths, format, parse, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_LISTED = 24;

const toDate = (month: string) => parse(month, "yyyy-MM", new Date());
const monthLabel = (month: string) => format(toDate(month), "MMMM yyyy");

interface MonthPickerProps {
  /** "YYYY-MM", or "all" for all time */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const current = getCurrentMonth();
  const isAll = value === "all";

  const options = Array.from({ length: MONTHS_LISTED }, (_, i) =>
    format(subMonths(toDate(current), i), "yyyy-MM"),
  );
  // Keep an older month selectable after stepping back past the list
  if (!isAll && !options.includes(value)) options.push(value);

  const step = (delta: number) =>
    onChange(format(addMonths(toDate(value), delta), "yyyy-MM"));

  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous month"
        disabled={isAll}
        onClick={() => step(-1)}
        className="h-9 w-9 rounded-l-xl rounded-r-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label="Choose month"
          className="h-9 w-[168px] gap-2 rounded-none border-0 border-x bg-transparent px-3 text-sm font-medium shadow-none focus:ring-0 focus:ring-offset-0"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <SelectValue>{isAll ? "All time" : monthLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="all" className="font-medium">
            All time
          </SelectItem>
          <SelectSeparator />
          {options.map((month) => (
            <SelectItem key={month} value={month}>
              {monthLabel(month)}
              {month === current && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Current
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next month"
        disabled={isAll || value >= current}
        onClick={() => step(1)}
        className="h-9 w-9 rounded-l-none rounded-r-xl"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
