import { CategoryTags } from "@/components/CategoryTags";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { generateTransactionReceipt } from "@/lib/receiptGenerator";
import { cn, parseCategories } from "@/lib/utils";
import { Download, Edit2, MoreVertical, Paperclip, Trash2 } from "lucide-react";
import { createElement, useEffect, useRef, useState } from "react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const TIME_ZONE = "Asia/Dhaka";
// Width of the Edit/Delete actions revealed by swiping left on touch screens
const SWIPE_REVEAL = 144;
// Movement before deciding whether a touch is a swipe or a scroll
const SWIPE_SLOP = 8;

const formatShortDate = (date: Date) => {
  const sameYear =
    date.toLocaleString("en-US", { year: "numeric", timeZone: TIME_ZONE }) ===
    new Date().toLocaleString("en-US", {
      year: "numeric",
      timeZone: TIME_ZONE,
    });
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: TIME_ZONE,
  });
};

const formatTime = (date: Date) =>
  date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  });

const formatFullDate = (date: Date) =>
  `${date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  })} BD`;

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === "income";
  const date = new Date(transaction.date);
  const categoryIcon = getCategoryIcon(
    parseCategories(transaction.category)[0],
    transaction.type,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{
    x: number;
    y: number;
    startOffset: number;
    axis: "x" | "y" | null;
  } | null>(null);
  const offsetRef = useRef(0);
  const [offset, setOffsetState] = useState(0);
  const [dragging, setDragging] = useState(false);

  const setOffset = (value: number) => {
    offsetRef.current = value;
    setOffsetState(value);
  };

  // Close the revealed actions when the user touches anywhere else
  useEffect(() => {
    if (offset === 0 || dragging) return;
    const close = (e: TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOffset(0);
    };
    document.addEventListener("touchstart", close, { passive: true });
    return () => document.removeEventListener("touchstart", close);
  }, [offset, dragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
      startOffset: offsetRef.current,
      axis: null,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const state = touchRef.current;
    if (!state) return;
    const dx = e.touches[0].clientX - state.x;
    const dy = e.touches[0].clientY - state.y;
    if (!state.axis) {
      if (Math.abs(dx) < SWIPE_SLOP && Math.abs(dy) < SWIPE_SLOP) return;
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (state.axis === "x") setDragging(true);
    }
    if (state.axis === "x") {
      setOffset(Math.min(0, Math.max(-SWIPE_REVEAL, state.startOffset + dx)));
    }
  };

  const handleTouchEnd = () => {
    if (touchRef.current?.axis === "x") {
      setOffset(offsetRef.current < -SWIPE_REVEAL / 2 ? -SWIPE_REVEAL : 0);
      setDragging(false);
    }
    touchRef.current = null;
  };

  const runAction = (action?: (t: Transaction) => void) => {
    setOffset(0);
    action?.(transaction);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full touch-pan-y rounded-2xl",
        // Clip only while swiped so the hover shadow isn't cut off on desktop
        offset !== 0 && "overflow-hidden",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {offset < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex"
          style={{ width: SWIPE_REVEAL }}
        >
          <button
            type="button"
            onClick={() => runAction(onEdit)}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-blue-500 text-xs font-medium text-white"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => runAction(onDelete)}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-rose-500 text-xs font-medium text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
      <Card
        onClickCapture={(e) => {
          // While open, a tap on the card just closes the actions
          if (offsetRef.current !== 0) {
            e.stopPropagation();
            e.preventDefault();
            setOffset(0);
          }
        }}
        className={cn(
          "group relative h-full rounded-2xl border border-gray-100 bg-white shadow-sm",
          "hover:border-gray-200 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800 dark:hover:border-gray-600",
          dragging
            ? "transition-none"
            : "transition-[transform,box-shadow,border-color] duration-200",
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <CardContent className="flex h-full items-center gap-3 p-3 sm:gap-4 sm:px-4">
          {/* Category Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
              isIncome
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
            )}
          >
            {createElement(categoryIcon, { className: "h-5 w-5" })}
          </div>

          {/* Note + Categories */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {transaction.note ? (
                <p className="truncate text-sm font-medium leading-5 text-gray-900 dark:text-gray-100 sm:text-[15px]">
                  {transaction.note}
                </p>
              ) : (
                <p className="truncate text-sm italic leading-5 text-gray-400 dark:text-gray-500">
                  No note
                </p>
              )}
              {transaction.image_url && (
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <CategoryTags
              category={transaction.category}
              type={transaction.type}
              max={3}
              className="mt-1.5 h-5 flex-wrap overflow-hidden"
            />
          </div>

          {/* Amount + Date */}
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "whitespace-nowrap text-base font-semibold leading-5 tabular-nums sm:text-lg",
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {isIncome ? "+" : "-"}৳
              {Math.abs(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              title={formatFullDate(date)}
              className="mt-1.5 whitespace-nowrap text-[11px] leading-4 text-gray-500 dark:text-gray-400 sm:text-xs"
            >
              {formatShortDate(date)}
              <span className="hidden sm:inline"> · {formatTime(date)}</span>
            </p>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Transaction actions"
                className="-mr-1 h-8 w-8 shrink-0 rounded-full p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => generateTransactionReceipt(transaction)}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit?.(transaction)}
                className="cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(transaction)}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </div>
  );
}
