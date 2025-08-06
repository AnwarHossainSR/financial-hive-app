import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Transaction } from "@/hooks/useTransactions";
import {
  cn,
  EXPENSE_CATEGORIES,
  formatDateForDisplay,
  getBangladeshTime,
  INCOME_CATEGORIES,
} from "@/lib/utils";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";

interface TransactionEditFormProps {
  transaction: Transaction;
  onSubmit: (transaction: any) => void;
  onCancel?: () => void;
}

export function TransactionEditForm({
  onSubmit,
  transaction,
}: TransactionEditFormProps) {
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note || "");
  const [date, setDate] = useState(getBangladeshTime(transaction.date));

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    const localDate = new Date(date);
    onSubmit({
      ...transaction,
      type,
      amount: parseFloat(amount),
      category,
      note: note || undefined,
      date: localDate,
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto animate-scale-in">
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Type</Label>
            <div className="flex space-x-2 mt-1">
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                onClick={() => setType("income")}
                className={cn(
                  "flex-1 transition-all duration-200",
                  type === "income" &&
                    "bg-income hover:bg-income text-income-foreground"
                )}
              >
                Income
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                onClick={() => setType("expense")}
                className={cn(
                  "flex-1 transition-all duration-200",
                  type === "expense" &&
                    "bg-expense hover:bg-expense text-expense-foreground"
                )}
              >
                Expense
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-medium"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {date && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                {formatDateForDisplay(date)}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Receipt Placeholder */}
          <div>
            <Label>Receipt (Optional)</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Receipt upload available after Supabase connection
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={cn(
              "w-full",
              type === "income"
                ? "bg-income hover:bg-income"
                : "bg-expense hover:bg-expense"
            )}
            disabled={!amount || !category}
          >
            <Plus className="w-4 h-4 mr-2" />
            Update {type === "income" ? "Income" : "Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
