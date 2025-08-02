import { BookSelector } from "@/components/BookSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Book } from "@/hooks/useBooks";
import { Calendar } from "lucide-react";

interface BookAndMonthSelectorProps {
  selectedBook: Book | null;
  onSelectBook: (book: Book | null) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  booksInitialized: boolean;
}

export const BookAndMonthSelector = ({
  selectedBook,
  onSelectBook,
  selectedMonth,
  onSelectMonth,
  booksInitialized,
}: BookAndMonthSelectorProps) => {
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push({
        value: `${year}-${month}`,
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return months;
  };

  return (
    <div className="relative flex flex-row gap-4 items-center w-full flex-wrap">
      {!booksInitialized ? (
        <div className="relative flex-1 min-w-[200px]">
          <div className="h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="flex-1">
          <BookSelector
            selectedBook={selectedBook}
            onSelectBook={onSelectBook}
          />
        </div>
      )}

      {selectedBook && (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[200px]">
          <Calendar className="w-4 h-4 text-blue-500" />
          <Select
            key={selectedBook.id}
            value={selectedMonth}
            onValueChange={onSelectMonth}
          >
            <SelectTrigger className="w-[160px] border-none bg-transparent focus:ring-0 focus:ring-offset-0">
              <SelectValue
                placeholder="Select Month"
                children={
                  getMonthOptions().find(
                    (month) => month.value === selectedMonth
                  )?.label || "Select Month"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
