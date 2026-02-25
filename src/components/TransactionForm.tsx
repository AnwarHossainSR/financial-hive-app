import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  cn,
  EXPENSE_CATEGORIES,
  formatDateForDisplay,
  getBangladeshTime,
  INCOME_CATEGORIES,
} from "@/lib/utils";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";

interface TransactionFormProps {
  bookId: string;
  onSubmit: (transaction: any) => void;
  onCancel?: () => void;
}

export function TransactionForm({
  bookId,
  onSubmit,
  onCancel,
  className,
}: TransactionFormProps & { className?: string }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getBangladeshTime());

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    const localDate = new Date(date);
    onSubmit({
      book_id: bookId,
      type,
      amount: parseFloat(amount),
      category,
      note: note || undefined,
      date: localDate,
    });

    // Reset form
    setAmount("");
    setCategory("");
    setNote("");
    setDate(getBangladeshTime());
  };

  return (
    <div className={cn("w-full max-w-lg mx-auto animate-scale-in", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Type</Label>
          <div className="flex space-x-2 mt-1">
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => setType("income")}
              className={cn(
                "flex-1 transition-all duration-200 h-10 rounded-xl",
                type === "income" &&
                  "bg-income hover:bg-income text-income-foreground shadow-lg shadow-income/20",
              )}
            >
              Income
            </Button>
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 transition-all duration-200 h-10 rounded-xl",
                type === "expense" &&
                  "bg-expense hover:bg-expense text-expense-foreground shadow-lg shadow-expense/20",
              )}
            >
              Expense
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              ৳
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold pl-8 bg-slate-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="bg-slate-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl h-11 transition-all">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">
            Date
          </Label>
          <Input
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl h-11 transition-all"
            required
          />
          {date && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-1 italic">
              Selected: {formatDateForDisplay(date)}
            </p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note" className="text-sm font-medium">
            Note (Optional)
          </Label>
          <Textarea
            id="note"
            placeholder="Add a reference note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="bg-slate-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Receipt Upload Placeholder */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Receipt (Optional)</Label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center group hover:border-primary/50 transition-colors cursor-pointer bg-slate-50/30 dark:bg-gray-900/30">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
            <p className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
              Click or drag to upload receipt
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:flex-1 rounded-xl h-11 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all font-medium"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className={cn(
              "w-full sm:flex-[2] rounded-xl h-11 font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
              type === "income"
                ? "bg-income hover:bg-income/90 shadow-income/20"
                : "bg-expense hover:bg-expense/90 shadow-expense/20",
            )}
            disabled={!amount || !category}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {type === "income" ? "Income" : "Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
