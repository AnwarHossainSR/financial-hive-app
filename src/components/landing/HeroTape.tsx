"use client";

import { isExpression, parseCalcLine } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { ArrowRight, CornerDownLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface TapeLine {
  id: number;
  label: string;
  expression: string;
  value: number;
}

// What a normal Dhaka day of spending looks like when typed into the calculator
const DEMO_LINES = [
  "120+30 rickshaw",
  "250 lunch",
  "45 tea & biscuits",
  "1,200 groceries",
  "-200 refund from Rafiq",
];
const DAILY_LIMIT = 2000;
const TYPE_SPEED_MS = 42;
const LINE_PAUSE_MS = 420;

const formatTaka = (n: number) =>
  `${n < 0 ? "−" : ""}৳${Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const toLine = (input: string, id: number): TapeLine | null => {
  const parsed = parseCalcLine(input);
  return parsed ? { id, ...parsed } : null;
};

export function HeroTape() {
  const [lines, setLines] = useState<TapeLine[]>([]);
  const [input, setInput] = useState("");
  const [demoDone, setDemoDone] = useState(false);
  const nextId = useRef(0);
  const tapeRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopDemo = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const showAllDemoLines = () => {
    stopDemo();
    setLines(
      DEMO_LINES.map((l) => toLine(l, nextId.current++)).filter(
        (l): l is TapeLine => l !== null,
      ),
    );
    setInput("");
    setDemoDone(true);
  };

  // Type the demo lines out one character at a time, like someone using it
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.current.push(setTimeout(showAllDemoLines, 0));
      return stopDemo;
    }
    let delay = 600;
    DEMO_LINES.forEach((text, lineIndex) => {
      for (let i = 1; i <= text.length; i++) {
        timers.current.push(
          setTimeout(() => setInput(text.slice(0, i)), delay),
        );
        delay += TYPE_SPEED_MS;
      }
      delay += LINE_PAUSE_MS / 2;
      timers.current.push(
        setTimeout(() => {
          const line = toLine(text, nextId.current++);
          if (line) setLines((prev) => [...prev, line]);
          setInput("");
          if (lineIndex === DEMO_LINES.length - 1) setDemoDone(true);
        }, delay),
      );
      delay += LINE_PAUSE_MS;
    });
    return stopDemo;
    // Runs once on mount; helpers only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tape = tapeRef.current;
    if (tape) tape.scrollTop = tape.scrollHeight;
  }, [lines.length]);

  const total = lines.reduce((sum, l) => sum + l.value, 0);
  const preview = demoDone && input.trim() ? parseCalcLine(input) : null;
  const used = Math.min(100, Math.max(0, (total / DAILY_LIMIT) * 100));

  const commit = () => {
    const line = toLine(input, nextId.current++);
    if (!line) return;
    setLines((prev) => [...prev, line]);
    setInput("");
  };

  return (
    <div className="relative">
      {/* Rubber stamp: "today's account", the heading of a paper khata page */}
      <div
        aria-hidden
        className="absolute -right-2 -top-5 z-10 rotate-[-7deg] rounded-md border-2 border-[#F43F5E] bg-white/80 px-3 py-1 text-[#F43F5E] shadow-sm [font-family:var(--font-bangla)] dark:bg-[#121933]/90 sm:-right-5"
      >
        <span className="text-base font-semibold leading-none">
          আজকের হিসাব
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#141B34]/10 bg-white shadow-[0_30px_80px_-30px_rgba(20,27,52,0.35)] dark:border-white/10 dark:bg-[#121933]">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-[#141B34]/10 px-5 pb-4 pt-5 dark:border-white/10">
          <div>
            <p className="text-xs font-medium text-[#141B34]/55 dark:text-white/50">
              Today · {lines.length} {lines.length === 1 ? "entry" : "entries"}
            </p>
            <p
              className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-[#141B34] [font-family:var(--font-display)] dark:text-white"
              aria-live="polite"
            >
              {formatTaka(total)}
            </p>
          </div>
          <div className="w-28 text-right">
            <p className="text-[11px] text-[#141B34]/55 dark:text-white/50">
              of {formatTaka(DAILY_LIMIT)} daily limit
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#141B34]/10 dark:bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  used >= 100 ? "bg-[#F43F5E]" : "bg-[#3B5BFD]",
                )}
                style={{ width: `${used}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ruled ledger page with a red margin line */}
        <div
          ref={tapeRef}
          className="relative h-[200px] overflow-y-auto bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(59,91,253,0.13)_39px,rgba(59,91,253,0.13)_40px)] [scrollbar-width:none]"
        >
          {/* Wrapper grows with the list so the margin line scrolls with it */}
          <div className="relative min-h-full">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-11 w-px bg-[#F43F5E]/40"
            />
            <ul className="font-mono text-sm">
              {lines.map((line, i) => (
                <li
                  key={line.id}
                  className="flex h-10 items-center gap-3 pr-5 motion-safe:animate-[fadeInUp_0.3s_ease-out]"
                >
                  <span className="w-11 shrink-0 text-center text-[11px] text-[#141B34]/35 dark:text-white/30">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[#141B34] dark:text-white/90">
                    {line.label || "—"}
                    {isExpression(line.expression) && (
                      <span className="ml-2 font-mono text-xs text-[#141B34]/40 dark:text-white/35">
                        {line.expression}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      line.value < 0
                        ? "text-[#12B981]"
                        : "text-[#141B34] dark:text-white",
                    )}
                  >
                    {formatTaka(line.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Input: animated during the demo, then the visitor's to use */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (demoDone) commit();
          }}
          className="border-t border-[#141B34]/10 p-3 dark:border-white/10"
        >
          <label htmlFor="hero-tape-input" className="sr-only">
            Add a spend, for example 80 tea
          </label>
          <div className="flex items-center gap-2 rounded-2xl bg-[#F5F6FA] px-3 ring-[#3B5BFD] focus-within:ring-2 dark:bg-white/5">
            <input
              id="hero-tape-input"
              value={input}
              onFocus={() => !demoDone && showAllDemoLines()}
              onChange={(e) => setInput(e.target.value)}
              placeholder={demoDone ? "Your turn — try 80 tea" : ""}
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent font-mono text-sm text-[#141B34] outline-none placeholder:text-[#141B34]/40 dark:text-white dark:placeholder:text-white/35"
            />
            {preview && (
              <span className="shrink-0 font-mono text-xs text-[#141B34]/50 dark:text-white/45">
                = {formatTaka(preview.value)}
              </span>
            )}
            <button
              type="submit"
              disabled={!preview}
              aria-label="Add line"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#141B34] text-white transition-opacity disabled:opacity-25 dark:bg-white dark:text-[#141B34]"
            >
              <CornerDownLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-xs">
            <button
              type="button"
              onClick={() => {
                stopDemo();
                setLines([]);
                setInput("");
                setDemoDone(true);
              }}
              className="inline-flex items-center gap-1 rounded text-[#141B34]/50 hover:text-[#141B34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3B5BFD] dark:text-white/45 dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </button>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 rounded font-medium text-[#3B5BFD] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3B5BFD] dark:text-[#8EA2FF]"
            >
              Save this to a cashbook
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
