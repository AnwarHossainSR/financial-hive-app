"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { isExpression, parseCalcLine } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { Copy, CornerDownLeft, Delete, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface CalcEntry {
  id: string;
  expression: string;
  label: string;
  value: number;
}

interface QuickCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tape is saved per book so a day's running list survives reloads */
  storageKey: string;
  /** Expense already recorded today, shown for reconciliation */
  recordedToday?: number;
  onUseTotal: (amount: number, note: string) => void;
}

const KEYPAD = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "(", ")"];

const formatAmount = (value: number) =>
  `${value < 0 ? "-" : ""}৳${Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const loadEntries = (key: string): CalcEntry[] => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CalcEntry[]) : [];
  } catch {
    return [];
  }
};

export function QuickCalculator({
  open,
  onOpenChange,
  storageKey,
  recordedToday,
  onUseTotal,
}: QuickCalculatorProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<CalcEntry[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadEntries(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    // Skip until the tape for this key has been loaded, or we'd wipe it
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      // Storage unavailable (private mode) — tape just won't persist
    }
  }, [entries, storageKey, loadedKey]);

  useEffect(() => {
    const tape = tapeRef.current;
    if (tape) tape.scrollTop = tape.scrollHeight;
  }, [entries.length]);

  const total = useMemo(
    () => Math.round(entries.reduce((sum, e) => sum + e.value, 0) * 100) / 100,
    [entries],
  );
  const preview = input.trim() ? parseCalcLine(input) : null;
  const invalid = input.trim() !== "" && preview === null;

  const commit = () => {
    if (!preview) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...preview },
    ]);
    setInput("");
  };

  const pressKey = (key: string) => setInput((prev) => prev + key);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(total));
      toast({ title: "Copied", description: `${formatAmount(total)} copied.` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleUseTotal = () => {
    const note = entries
      .map((e) => e.label)
      .filter(Boolean)
      .join(", ");
    onUseTotal(Math.abs(total), note);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-4 p-4 sm:max-w-md sm:p-6"
        onOpenAutoFocus={(e) => {
          // Desktop: jump straight into typing. Phones: keep the on-screen
          // keyboard closed so the keypad below stays visible.
          e.preventDefault();
          if (window.matchMedia("(min-width: 640px)").matches) {
            inputRef.current?.focus();
          }
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Quick Calculator</SheetTitle>
          <SheetDescription>
            Type each spend and press Enter. Add a label after the number, e.g.{" "}
            <span className="font-mono text-foreground">120+30 rickshaw</span>.
            Start with <span className="font-mono text-foreground">-</span> to
            subtract.
          </SheetDescription>
        </SheetHeader>

        {/* Total */}
        <div className="rounded-2xl border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total · {entries.length} {entries.length === 1 ? "item" : "items"}
          </p>
          <p
            className={cn(
              "mt-1 text-4xl font-bold tabular-nums",
              total < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground",
            )}
          >
            {formatAmount(total)}
          </p>
          {recordedToday !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">
              Recorded as expense today:{" "}
              <span className="font-medium tabular-nums text-foreground">
                {formatAmount(recordedToday)}
              </span>
            </p>
          )}
        </div>

        {/* Tape */}
        <div
          ref={tapeRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border"
        >
          {entries.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nothing yet. Your list is saved on this device until you clear it.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry, index) => (
                <li
                  key={entry.id}
                  className="group flex items-center gap-3 px-3 py-2 text-sm"
                >
                  <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {entry.label || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </p>
                    {isExpression(entry.expression) && (
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {entry.expression}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular-nums",
                      entry.value < 0 && "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatAmount(entry.value)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove line"
                    onClick={() =>
                      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
                    }
                    className="h-7 w-7 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
          className="space-y-1"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 250 lunch"
              autoComplete="off"
              aria-invalid={invalid}
              className={cn(
                "h-11 rounded-xl font-mono text-base",
                invalid && "border-rose-400 focus-visible:ring-rose-400",
              )}
            />
            <Button
              type="submit"
              disabled={!preview}
              aria-label="Add line"
              className="h-11 rounded-xl px-4"
            >
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </div>
          <p className="h-4 pl-1 text-xs text-muted-foreground">
            {preview
              ? `= ${formatAmount(preview.value)}${preview.label ? ` · ${preview.label}` : ""}`
              : invalid
                ? "Start with a number or expression"
                : ""}
          </p>
        </form>

        {/* Keypad — handy on phones where the keyboard hides + and × */}
        <div className="grid grid-cols-4 gap-1.5 sm:hidden">
          {KEYPAD.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              onClick={() => pressKey(key)}
              className="h-10 rounded-xl font-mono text-base"
            >
              {key}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => pressKey("+")}
            className="col-span-2 h-10 rounded-xl font-mono text-base"
          >
            +
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-label="Backspace"
            onClick={() => setInput((prev) => prev.slice(0, -1))}
            className="col-span-2 h-10 rounded-xl"
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => setEntries([])}
            disabled={entries.length === 0}
            className="rounded-xl"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={entries.length === 0}
            className="rounded-xl"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Copy
          </Button>
          <Button
            onClick={handleUseTotal}
            disabled={total === 0}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
