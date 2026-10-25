import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import {
  cn,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  joinCategories,
  parseCategories,
} from "@/lib/utils";
import {
  AlertCircle,
  Check,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { useCallback, useState } from "react";

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBook: Book | null;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  book_id: string;
}

// Values older imports accepted that aren't in either category list; kept so
// re-importing an old export doesn't change how those rows are categorized.
const LEGACY_IMPORT_CATEGORIES = ["Income", "Transfer"];

// Canonical spelling by lowercase name, so "salary" or "SALARY" in a CSV maps
// to "Salary" instead of silently falling back to the default category.
const KNOWN_CATEGORIES = new Map(
  [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...LEGACY_IMPORT_CATEGORIES].map(
    (c) => [c.toLowerCase(), c],
  ),
);

const categoriesForType = (type: "income" | "expense") =>
  type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

/**
 * The default category only applies to rows of its own type: an income row
 * with the (expense) default "Other" becomes "Other Income" instead.
 */
const fallbackCategory = (
  defaultCategory: string,
  type: "income" | "expense",
) => {
  const belongsToType = categoriesForType(type).includes(defaultCategory);
  const belongsToOther = categoriesForType(
    type === "income" ? "expense" : "income",
  ).includes(defaultCategory);
  if (belongsToType || !belongsToOther) return defaultCategory;
  return type === "income" ? "Other Income" : "Other";
};

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "map", label: "Map columns" },
  { id: "preview", label: "Review" },
] as const;

type Step = "upload" | "map" | "preview" | "importing";

const EMPTY_MAPPING = {
  date: "none",
  amount: "none",
  description: "none",
  type: "none",
  category: "none",
};

export const CSVImport = ({
  open,
  onOpenChange,
  selectedBook,
}: CSVImportProps) => {
  const { toast } = useToast();
  const { importTransactions } = useTransactions();

  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState(EMPTY_MAPPING);
  const [defaultType, setDefaultType] = useState<"income" | "expense">(
    "expense",
  );
  const [defaultCategory, setDefaultCategory] = useState("Other");
  const [step, setStep] = useState<Step>("upload");
  const [previewData, setPreviewData] = useState<MappedTransaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const resetState = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping(EMPTY_MAPPING);
    setStep("upload");
    setPreviewData([]);
    setErrors([]);
  };

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = event.target.files?.[0];
      if (!uploadedFile) return;

      if (!uploadedFile.name.toLowerCase().endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }

      setFile(uploadedFile);

      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        delimitersToGuess: [",", "\t", "|", ";"],
        complete: (results) => {
          if (results.errors.length > 0) {
            toast({
              title: "CSV parsing error",
              description: "There was an error parsing your CSV file.",
              variant: "destructive",
            });
            return;
          }

          const data = results.data as ParsedRow[];
          const csvHeaders = Object.keys(data[0] || {}).map((h) => h.trim());

          setCsvData(data);
          setHeaders(csvHeaders);
          setStep("map");

          // Auto-detect common column names with your CSV format
          const lowerHeaders = csvHeaders.map((h) => h.toLowerCase());
          const autoMapping = {
            date:
              csvHeaders.find((_, i) =>
                /^(date|transaction_date|trans_date|dt)$/i.test(
                  lowerHeaders[i],
                ),
              ) || "none",
            amount:
              csvHeaders.find((_, i) =>
                /^(cash in|cash out|amount|amt|value|sum|total)$/i.test(
                  lowerHeaders[i],
                ),
              ) || "none",
            description:
              csvHeaders.find((_, i) =>
                /^(remark|description|desc|note|memo|details|transaction|reference)$/i.test(
                  lowerHeaders[i],
                ),
              ) || "none",
            type:
              csvHeaders.find((_, i) =>
                /^(type|transaction_type|trans_type|debit_credit|cash in|cash out)$/i.test(
                  lowerHeaders[i],
                ),
              ) || "none",
            category:
              csvHeaders.find((_, i) =>
                /^(category|cat|classification)$/i.test(lowerHeaders[i]),
              ) || "none",
          };

          setMapping(autoMapping);
        },
        error: (error) => {
          toast({
            title: "File reading error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    },
    [toast],
  );

  const generatePreview = () => {
    if (!selectedBook) return;

    const validationErrors: string[] = [];
    const transactions: MappedTransaction[] = [];

    csvData.forEach((row, index) => {
      try {
        // Parse date
        let date = "";
        if (mapping.date !== "none" && row[mapping.date]) {
          const parsedDate = new Date(row[mapping.date].trim());
          if (isNaN(parsedDate.getTime())) {
            validationErrors.push(`Row ${index + 1}: Invalid date format`);
            return;
          }
          date = parsedDate.toISOString().split("T")[0];
        } else {
          date = new Date().toISOString().split("T")[0];
        }

        // Parse amount - handle your CSV format with Cash In/Cash Out columns
        let amount = 0;
        let type: "income" | "expense" = defaultType;

        // Check if we have Cash In/Cash Out columns
        const cashInCol = headers.find((h) =>
          h.toLowerCase().includes("cash in"),
        );
        const cashOutCol = headers.find((h) =>
          h.toLowerCase().includes("cash out"),
        );

        if (cashInCol && cashOutCol) {
          const cashIn = row[cashInCol]?.trim().replace(/[^0-9.-]/g, "");
          const cashOut = row[cashOutCol]?.trim().replace(/[^0-9.-]/g, "");

          if (cashIn && parseFloat(cashIn) > 0) {
            amount = parseFloat(cashIn);
            type = "income";
          } else if (cashOut && parseFloat(cashOut) > 0) {
            amount = parseFloat(cashOut);
            type = "expense";
          } else {
            validationErrors.push(`Row ${index + 1}: No valid amount found`);
            return;
          }
        } else if (mapping.amount !== "none" && row[mapping.amount]) {
          const amountStr = row[mapping.amount]
            .trim()
            .replace(/[^0-9.-]/g, "");
          amount = parseFloat(amountStr);
          if (isNaN(amount) || amount <= 0) {
            validationErrors.push(`Row ${index + 1}: Invalid amount`);
            return;
          }

          // Determine type from separate column if not using Cash In/Out
          if (mapping.type !== "none" && row[mapping.type]) {
            const typeStr = row[mapping.type].trim().toLowerCase();
            if (
              typeStr.includes("income") ||
              typeStr.includes("credit") ||
              typeStr.includes("deposit") ||
              typeStr.includes("cash in")
            ) {
              type = "income";
            } else if (
              typeStr.includes("expense") ||
              typeStr.includes("debit") ||
              typeStr.includes("withdrawal") ||
              typeStr.includes("cash out")
            ) {
              type = "expense";
            }
          }
        } else {
          validationErrors.push(`Row ${index + 1}: Amount is required`);
          return;
        }

        // Category cells may hold several names ("Salary, Bonus"); keep the
        // ones we recognize, in canonical spelling.
        const matched =
          mapping.category !== "none" && row[mapping.category]
            ? parseCategories(row[mapping.category]).flatMap((c) => {
                const known = KNOWN_CATEGORIES.get(c.toLowerCase());
                return known ? [known] : [];
              })
            : [];
        const category =
          matched.length > 0
            ? joinCategories(matched)
            : fallbackCategory(defaultCategory, type);

        // Get description/note
        const note =
          mapping.description !== "none" && row[mapping.description]
            ? row[mapping.description].trim()
            : undefined;

        transactions.push({
          type,
          amount,
          category,
          note,
          date,
          book_id: selectedBook.id,
        });
      } catch (error) {
        validationErrors.push(`Row ${index + 1}: Processing error`);
      }
    });

    setErrors(validationErrors);
    setPreviewData(transactions);
    setStep("preview");
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setStep("importing");

    // The mutation shows the success/error toast
    const { error } = await importTransactions(previewData);

    if (!error) {
      onOpenChange(false);
      resetState();
    } else {
      setStep("preview");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const activeStepIndex =
    step === "importing" ? 2 : STEPS.findIndex((s) => s.id === step);

  const columnSelect = (
    field: keyof typeof EMPTY_MAPPING,
    label: string,
    noneLabel: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${field}-mapping`} className="text-xs font-medium">
        {label}
      </Label>
      <Select
        value={mapping[field]}
        onValueChange={(value) =>
          setMapping((prev) => ({ ...prev, [field]: value }))
        }
      >
        <SelectTrigger id={`${field}-mapping`} className="h-10 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{noneLabel}</SelectItem>
          {headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-3xl gap-0 overflow-y-auto rounded-2xl bg-card p-0 sm:w-full sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b px-6 pb-4 pr-12 pt-6 text-left">
          <DialogTitle className="text-lg font-semibold">
            Import transactions
          </DialogTitle>
          <DialogDescription>
            {!selectedBook
              ? "Open a book before importing transactions."
              : `Bring a CSV export into “${selectedBook.name}”.`}
          </DialogDescription>
          {selectedBook && (
            <ol className="flex items-center gap-2 pt-3">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                      i < activeStepIndex
                        ? "bg-primary text-primary-foreground"
                        : i === activeStepIndex
                          ? "bg-primary/10 text-primary ring-1 ring-primary/40"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i < activeStepIndex ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      i === activeStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="mx-1 h-px w-6 bg-border sm:w-10" />
                  )}
                </li>
              ))}
            </ol>
          )}
        </DialogHeader>

        <div className="px-6 pb-6 pt-5">
          {!selectedBook ? (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Please open a book first.
              </p>
            </div>
          ) : (
            <>
              {step === "upload" && (
                <div className="space-y-4">
                  <label
                    htmlFor="csv-upload"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                      <UploadCloud className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold">
                      Choose a CSV file
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Comma, tab, pipe or semicolon delimited
                    </span>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  {file && (
                    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <span className="truncate text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove file"
                        onClick={() => setFile(null)}
                        className="ml-auto h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {step === "map" && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold">Columns</h4>
                      <p className="text-xs text-muted-foreground">
                        Match your file&apos;s columns to transaction fields.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {columnSelect("amount", "Amount *", "— Select required —")}
                      {columnSelect("date", "Date", "— Use today —")}
                      {columnSelect("description", "Note", "— Skip —")}
                      {columnSelect("type", "Type", "— Use default —")}
                      {columnSelect("category", "Category", "— Use default —")}
                    </div>
                  </section>

                  <section className="space-y-3 rounded-2xl bg-muted/40 p-4">
                    <div>
                      <h4 className="text-sm font-semibold">Defaults</h4>
                      <p className="text-xs text-muted-foreground">
                        Used when a row has no type or an unrecognized
                        category. Income rows never get an expense default.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="default-type" className="text-xs">
                          Type
                        </Label>
                        <Select
                          value={defaultType}
                          onValueChange={(value: "income" | "expense") =>
                            setDefaultType(value)
                          }
                        >
                          <SelectTrigger
                            id="default-type"
                            className="h-10 rounded-xl bg-background"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="default-category" className="text-xs">
                          Category
                        </Label>
                        <Select
                          value={defaultCategory}
                          onValueChange={setDefaultCategory}
                        >
                          <SelectTrigger
                            id="default-category"
                            className="h-10 rounded-xl bg-background"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Income</SelectLabel>
                              {INCOME_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Expense</SelectLabel>
                              {EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {csvData.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        First rows of your file
                      </h4>
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              {headers.map((header) => (
                                <th
                                  key={header}
                                  className="whitespace-nowrap px-3 py-2 text-left font-medium"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {csvData.slice(0, 3).map((row, index) => (
                              <tr key={index}>
                                {headers.map((header) => (
                                  <td
                                    key={header}
                                    className="whitespace-nowrap px-3 py-2"
                                  >
                                    {row[header] || "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setStep("upload")}
                      className="rounded-xl"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={generatePreview}
                      disabled={mapping.amount === "none"}
                      className="rounded-xl"
                    >
                      Preview import
                    </Button>
                  </div>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-5">
                  {errors.length > 0 && (
                    <div className="rounded-xl border border-expense/30 bg-expense/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-expense">
                        <AlertCircle className="h-4 w-4" />
                        {errors.length} row{errors.length === 1 ? "" : "s"}{" "}
                        need attention
                      </div>
                      <ul className="space-y-1 text-xs text-expense">
                        {errors.slice(0, 10).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {errors.length > 10 && (
                          <li>• … and {errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {previewData.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        {previewData.length} transaction
                        {previewData.length === 1 ? "" : "s"} ready
                        {previewData.length > 10 && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · showing first 10
                          </span>
                        )}
                      </h4>
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              {["Date", "Type", "Amount", "Category", "Note"].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className={cn(
                                      "whitespace-nowrap px-3 py-2 text-left font-medium",
                                      h === "Amount" && "text-right",
                                    )}
                                  >
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {previewData.slice(0, 10).map((t, index) => (
                              <tr key={index}>
                                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                  {t.date}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                                      t.type === "income"
                                        ? "bg-income/10 text-income"
                                        : "bg-expense/10 text-expense",
                                    )}
                                  >
                                    {t.type}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
                                  ৳{t.amount.toLocaleString("en-US")}
                                </td>
                                <td className="px-3 py-2">{t.category}</td>
                                <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                                  {t.note || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setStep("map")}
                      className="rounded-xl"
                    >
                      Back to mapping
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={previewData.length === 0 || errors.length > 0}
                      className="rounded-xl"
                    >
                      Import {previewData.length} transaction
                      {previewData.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                </div>
              )}

              {step === "importing" && (
                <div className="flex flex-col items-center py-12 text-center">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-semibold">
                    Importing transactions…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This only takes a moment.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
