import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/hooks/useBooks";
import { useTransactions } from "@/hooks/useTransactions";
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
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

const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Business",
  "Investment",
  "Income",
  "Transfer",
  "Other",
];

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
  const [mapping, setMapping] = useState({
    date: "none",
    amount: "none",
    description: "none",
    type: "none",
    category: "none",
  });
  const [defaultType, setDefaultType] = useState<"income" | "expense">(
    "expense"
  );
  const [defaultCategory, setDefaultCategory] = useState("Other");
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing">(
    "upload"
  );
  const [previewData, setPreviewData] = useState<MappedTransaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const resetState = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({
      date: "none",
      amount: "none",
      description: "none",
      type: "none",
      category: "none",
    });
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
                /^(date|transaction_date|trans_date|dt)$/i.test(lowerHeaders[i])
              ) || "none",
            amount:
              csvHeaders.find((_, i) =>
                /^(cash in|cash out|amount|amt|value|sum|total)$/i.test(
                  lowerHeaders[i]
                )
              ) || "none",
            description:
              csvHeaders.find((_, i) =>
                /^(remark|description|desc|note|memo|details|transaction|reference)$/i.test(
                  lowerHeaders[i]
                )
              ) || "none",
            type:
              csvHeaders.find((_, i) =>
                /^(type|transaction_type|trans_type|debit_credit|cash in|cash out)$/i.test(
                  lowerHeaders[i]
                )
              ) || "none",
            category:
              csvHeaders.find((_, i) =>
                /^(category|cat|classification)$/i.test(lowerHeaders[i])
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
    [toast]
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
          h.toLowerCase().includes("cash in")
        );
        const cashOutCol = headers.find((h) =>
          h.toLowerCase().includes("cash out")
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
          const amountStr = row[mapping.amount].trim().replace(/[^0-9.-]/g, "");
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

        // Get category
        let category = defaultCategory;
        if (mapping.category !== "none" && row[mapping.category]) {
          const csvCategory = row[mapping.category].trim();
          if (TRANSACTION_CATEGORIES.includes(csvCategory)) {
            category = csvCategory;
          }
        }

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

    const { error } = await importTransactions(previewData);

    if (!error) {
      toast({
        title: "Import successful",
        description: `Successfully imported ${previewData.length} transactions.`,
      });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            {!selectedBook
              ? "Please select a book before importing transactions."
              : `Import transactions into "${selectedBook.name}"`}
          </DialogDescription>
        </DialogHeader>

        {!selectedBook ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Please select a book first
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload CSV File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-lg font-medium">
                        Choose CSV file
                      </span>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supports comma, tab, pipe, or semicolon delimited files
                      </p>
                    </Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Map Columns */}
            {step === "map" && (
              <Card>
                <CardHeader>
                  <CardTitle>Map CSV Columns</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Match your CSV columns to transaction fields. Required
                    fields are marked with *
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date-mapping">Date</Label>
                      <Select
                        value={mapping.date}
                        onValueChange={(value) =>
                          setMapping((prev) => ({ ...prev, date: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Skip --</SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount-mapping">Amount *</Label>
                      <Select
                        value={mapping.amount}
                        onValueChange={(value) =>
                          setMapping((prev) => ({ ...prev, amount: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select amount column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            -- Select Required --
                          </SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description-mapping">
                        Description/Note
                      </Label>
                      <Select
                        value={mapping.description}
                        onValueChange={(value) =>
                          setMapping((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select description column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Skip --</SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type-mapping">Transaction Type</Label>
                      <Select
                        value={mapping.type}
                        onValueChange={(value) =>
                          setMapping((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            -- Use default --
                          </SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category-mapping">Category</Label>
                      <Select
                        value={mapping.category}
                        onValueChange={(value) =>
                          setMapping((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            -- Use default --
                          </SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium">Default Values</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="default-type">
                          Default Transaction Type
                        </Label>
                        <Select
                          value={defaultType}
                          onValueChange={(value: "income" | "expense") =>
                            setDefaultType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="default-category">
                          Default Category
                        </Label>
                        <Select
                          value={defaultCategory}
                          onValueChange={setDefaultCategory}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSACTION_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Sample Data Preview */}
                  {csvData.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">
                        Sample Data (First 3 rows)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              {headers.map((header) => (
                                <th
                                  key={header}
                                  className="border border-muted px-2 py-1 text-left"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 3).map((row, index) => (
                              <tr key={index}>
                                {headers.map((header) => (
                                  <td
                                    key={header}
                                    className="border border-muted px-2 py-1"
                                  >
                                    {row[header] || "--"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep("upload")}>
                      Back
                    </Button>
                    <Button
                      onClick={generatePreview}
                      disabled={mapping.amount === "none"}
                    >
                      Preview Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Preview */}
            {step === "preview" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Import Preview
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review {previewData.length} transactions to be imported
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {errors.length > 0 && (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-600">
                          Import Errors
                        </span>
                      </div>
                      <ul className="text-sm text-red-600 space-y-1">
                        {errors.slice(0, 10).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {errors.length > 10 && (
                          <li>• ... and {errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {previewData.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Transactions to Import (First 10)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-muted px-2 py-1 text-left">
                                Date
                              </th>
                              <th className="border border-muted px-2 py-1 text-left">
                                Type
                              </th>
                              <th className="border border-muted px-2 py-1 text-left">
                                Amount
                              </th>
                              <th className="border border-muted px-2 py-1 text-left">
                                Category
                              </th>
                              <th className="border border-muted px-2 py-1 text-left">
                                Note
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData
                              .slice(0, 10)
                              .map((transaction, index) => (
                                <tr key={index}>
                                  <td className="border border-muted px-2 py-1">
                                    {transaction.date}
                                  </td>
                                  <td className="border border-muted px-2 py-1">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        transaction.type === "income"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {transaction.type}
                                    </span>
                                  </td>
                                  <td className="border border-muted px-2 py-1">
                                    ৳{transaction.amount.toFixed(2)}
                                  </td>
                                  <td className="border border-muted px-2 py-1">
                                    {transaction.category}
                                  </td>
                                  <td className="border border-muted px-2 py-1">
                                    {transaction.note || "--"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          ... and {previewData.length - 10} more transactions
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep("map")}>
                      Back to Mapping
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={previewData.length === 0 || errors.length > 0}
                    >
                      Import {previewData.length} Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Importing */}
            {step === "importing" && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="font-medium">Importing transactions...</p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process your data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
