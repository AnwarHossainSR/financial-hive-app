"use client";

import { CategoryPicker } from "@/components/CategoryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { evaluateExpression, isExpression } from "@/lib/calc";
import {
  cn,
  EXPENSE_CATEGORIES,
  formatDateForDisplay,
  formatTaka,
  getBangladeshTime,
  INCOME_CATEGORIES,
  joinCategories,
  parseCategories,
} from "@/lib/utils";
import { Book } from "@/types/book";
import { Transaction, TransactionFormValues } from "@/types/transaction";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Check,
  Loader2,
  UserRound,
} from "lucide-react";
import { useState } from "react";

interface TransactionFormProps {
  /** The transaction's own book: the one it's added to, or edited in */
  bookId: string;
  /** The user's books, for "Also show in" */
  books?: Book[];
  /** Focus the amount on open; off on phones, where it pops the keyboard */
  autoFocusAmount?: boolean;
  /** Edit this transaction; omit to add a new one */
  transaction?: Transaction | null;
  /** Resolve to false when saving failed, so a new entry isn't cleared */
  onSubmit: (
    values: TransactionFormValues,
  ) => void | boolean | Promise<void | boolean>;
  onCancel?: () => void;
  initialAmount?: number;
  initialNote?: string;
  className?: string;
}

const TYPES = [
  { value: "expense" as const, label: "Expense", icon: ArrowUpRight },
  { value: "income" as const, label: "Income", icon: ArrowDownLeft },
];

const categoriesFor = (type: "income" | "expense") =>
  type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

export function TransactionForm({
  bookId,
  books = [],
  autoFocusAmount = true,
  transaction,
  onSubmit,
  onCancel,
  initialAmount,
  initialNote,
  className,
}: TransactionFormProps) {
  const isEdit = !!transaction;
  const [type, setType] = useState<"income" | "expense">(
    transaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    transaction
      ? String(transaction.amount)
      : initialAmount
        ? String(initialAmount)
        : "",
  );
  const [categories, setCategories] = useState<string[]>(
    parseCategories(transaction?.category),
  );
  const [note, setNote] = useState(transaction?.note ?? initialNote ?? "");
  const [date, setDate] = useState(() => getBangladeshTime(transaction?.date));
  const [sharedBookIds, setSharedBookIds] = useState<string[]>(
    transaction?.shared_book_ids ?? [],
  );
  const [submitting, setSubmitting] = useState(false);

  // The default book already shows every book, so sharing into it adds nothing
  const shareOptions = books.filter((b) => b.id !== bookId && !b.is_default);
  const defaultBook = books.find((b) => b.is_default && b.id !== bookId);
  const toggleShared = (id: string) =>
    setSharedBookIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // Amount accepts math like "120+45"; null means it doesn't parse
  const amountValue = evaluateExpression(amount);
  const isValid =
    amountValue !== null && amountValue > 0 && categories.length > 0 && !!date;

  const handleTypeChange = (newType: "income" | "expense") => {
    if (newType === type) return;
    // Drop selections that belong to the other transaction type
    const newOptions = categoriesFor(newType);
    setCategories((prev) => prev.filter((c) => newOptions.includes(c)));
    setType(newType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || amountValue === null) return;

    const trimmedNote = note.trim();
    setSubmitting(true);
    let saved: void | boolean = false;
    try {
      saved = await onSubmit({
        book_id: bookId,
        type,
        amount: amountValue,
        category: joinCategories(categories),
        // Editing to an empty note must clear it, not leave the old one
        note: trimmedNote || (isEdit ? null : undefined),
        date: new Date(date),
        // Only books still offered: one that became the default drops out
        shared_book_ids: sharedBookIds.filter((id) =>
          shareOptions.some((b) => b.id === id),
        ),
      });
    } finally {
      setSubmitting(false);
    }

    if (!isEdit && saved !== false) {
      setAmount("");
      setCategories([]);
      setNote("");
      setDate(getBangladeshTime());
      setSharedBookIds([]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full space-y-5 pb-1", className)}
    >
      {/* Type */}
      <div
        role="radiogroup"
        aria-label="Transaction type"
        className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
      >
        {TYPES.map(({ value, label, icon: Icon }) => {
          const selected = type === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleTypeChange(value)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? value === "income"
                    ? "bg-income text-income-foreground shadow-income"
                    : "bg-expense text-expense-foreground shadow-expense"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
          Amount
        </Label>
        <div className="relative">
          <span
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold",
              type === "income" ? "text-income" : "text-expense",
            )}
          >
            ৳
          </span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={!isEdit && autoFocusAmount}
            placeholder="0 or 120+45"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => {
              if (isExpression(amount) && amountValue !== null) {
                setAmount(String(amountValue));
              }
            }}
            className="h-14 rounded-2xl border-2 pl-11 text-2xl font-semibold tracking-tight tabular-nums focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-16 sm:text-3xl md:text-3xl"
            required
          />
        </div>
        <p className="h-4 pl-1 text-xs text-muted-foreground tabular-nums">
          {isExpression(amount)
            ? amountValue !== null
              ? `= ${formatTaka(amountValue)}`
              : "That calculation doesn't add up"
            : "Tip: type sums like 120+45+30"}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Category
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {categories.length === 0
              ? "Pick one or more"
              : `${categories.length} selected`}
          </span>
        </div>
        <CategoryPicker
          options={categoriesFor(type)}
          value={categories}
          onChange={setCategories}
          type={type}
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-xs font-medium text-muted-foreground">
          Date &amp; time
        </Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-xl"
          required
        />
        {date && (
          <p className="pl-1 text-xs text-muted-foreground">
            {formatDateForDisplay(date)}
          </p>
        )}
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-xs font-medium text-muted-foreground">
          Note <span className="font-normal">(optional)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="What was it for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="resize-none rounded-xl"
        />
      </div>

      {/* Also show in other books */}
      {shareOptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Also show in <span className="font-normal">(optional)</span>
            </Label>
            {sharedBookIds.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {sharedBookIds.length} selected
              </span>
            )}
          </div>
          <div
            role="group"
            aria-label="Also show in books"
            className="flex flex-wrap gap-2"
          >
            {shareOptions.map((book) => {
              const selected = sharedBookIds.includes(book.id);
              const Icon = book.type === "business" ? Building2 : UserRound;
              return (
                <button
                  key={book.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleShared(book.id)}
                  className={cn(
                    "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                  )}
                >
                  {selected ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{book.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            It will appear in, and count toward, each book you pick.
            {defaultBook && ` ${defaultBook.name} already shows everything.`}
          </p>
        </div>
      )}

      {/* Stays in view while the form scrolls inside its dialog or sheet */}
      <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || submitting}
          className={cn(
            "h-11 flex-[2] rounded-xl font-semibold",
            type === "income"
              ? "bg-income text-income-foreground hover:bg-income/90"
              : "bg-expense text-expense-foreground hover:bg-expense/90",
          )}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save" : "Add"} {type}
          {amountValue !== null && amountValue > 0 && (
            <span className="tabular-nums opacity-90">
              · {formatTaka(amountValue)}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
