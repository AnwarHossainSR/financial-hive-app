"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useInvestmentEntries } from "@/hooks/useInvestmentDetails";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

const INVESTMENT_TYPES = [
  "Deposit",
  "Withdrawal",
  "Capital Return",
  "Reinvestment",
  "Profit",
  "Loss",
  "Fee",
];
const PROFIT_STATUS_OPTIONS = ["received", "pending", "partial", "none"];
const ENTRY_STATUS_OPTIONS = [
  "pending",
  "active",
  "completed",
  "withdrawn",
  "paused",
];

interface EditInvestmentEntryDialogProps {
  children: React.ReactNode;
  projectId: string;
  entry: any;
}

export function EditInvestmentEntryDialog({
  children,
  projectId,
  entry,
}: EditInvestmentEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Deposit");
  const [platform, setPlatform] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("active");

  // New fields
  const [principal, setPrincipal] = useState("");
  const [duration, setDuration] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [profitCalculationDate, setProfitCalculationDate] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [expectedProfit, setExpectedProfit] = useState("");
  const [profitReceived, setProfitReceived] = useState("");
  const [profitPending, setProfitPending] = useState("");
  const [profitStatus, setProfitStatus] = useState("none");
  const [remarks, setRemarks] = useState("");

  const { updateEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open && entry) {
      // Format date for datetime-local input
      const entryDate = new Date(entry.date);
      const formattedDate = format(entryDate, "yyyy-MM-dd'T'HH:mm");
      setDate(formattedDate);
      setAmount(entry.amount.toString());
      setType(entry.investment_type);
      setPlatform(entry.platform || "");
      setNotes(entry.notes || "");
      setFile(null);
      setStatus(entry.status || "active");

      // New fields
      setPrincipal(entry.principal ? entry.principal.toString() : "");
      setDuration(entry.duration || "");
      setInterestRate(entry.interest_rate || "");
      setProfitCalculationDate(
        entry.profit_calculation_date
          ? format(
              new Date(entry.profit_calculation_date),
              "yyyy-MM-dd'T'HH:mm",
            )
          : "",
      );
      setInvestmentDate(
        entry.investment_date
          ? format(new Date(entry.investment_date), "yyyy-MM-dd'T'HH:mm")
          : "",
      );
      setMaturityDate(
        entry.maturity_date
          ? format(new Date(entry.maturity_date), "yyyy-MM-dd'T'HH:mm")
          : "",
      );
      setExpectedProfit(
        entry.expected_profit ? entry.expected_profit.toString() : "",
      );
      setProfitReceived(
        entry.profit_received ? entry.profit_received.toString() : "",
      );
      setProfitPending(
        entry.profit_pending ? entry.profit_pending.toString() : "",
      );
      setProfitStatus(entry.profit_status || "none");
      setRemarks(entry.remarks || "");
    }
  }, [open, entry]);

  // Auto-calculate maturity date when investment date and duration change
  useEffect(() => {
    if (investmentDate && duration) {
      const months = parseInt(duration.split(" ")[0]);
      const invDate = new Date(investmentDate);
      const matDate = new Date(invDate);
      matDate.setMonth(matDate.getMonth() + months);
      setMaturityDate(matDate.toISOString().slice(0, 16));
    }
  }, [investmentDate, duration]);

  // Auto-calculate expected profit when principal, interest rate, and duration change
  useEffect(() => {
    if (principal && interestRate && duration) {
      const principalAmount = parseFloat(principal);
      const months = parseInt(duration.split(" ")[0]);

      // Parse interest rate (handle ranges like "21.96 - 24.96" or single values like "24")
      let rate = 0;
      if (interestRate.includes("-")) {
        const rates = interestRate.split("-").map((r) => parseFloat(r.trim()));
        rate = (rates[0] + rates[1]) / 2; // Use average of range
      } else {
        rate = parseFloat(interestRate.replace("%", "").trim());
      }

      if (!isNaN(principalAmount) && !isNaN(rate) && !isNaN(months)) {
        // Calculate expected profit: principal * (rate / 100)
        // User confirmed flat rate for the duration is preferred.
        const profit = principalAmount * (rate / 100);
        setExpectedProfit(profit.toFixed(2));
      }
    }
  }, [principal, interestRate, duration]);

  // Auto-calculate profit pending when expected profit and profit received change
  useEffect(() => {
    if (expectedProfit && profitReceived) {
      const expected = parseFloat(expectedProfit);
      const received = parseFloat(profitReceived);
      if (!isNaN(expected) && !isNaN(received)) {
        // Auto-calculate profit pending
        const pending = Math.max(0, expected - received);
        setProfitPending(pending.toFixed(2));

        // Auto-update profit status
        if (received >= expected && expected > 0) {
          setProfitStatus("received");
        } else if (received > 0) {
          setProfitStatus("partial");
        } else if (expected > 0) {
          setProfitStatus("pending");
        } else {
          setProfitStatus("none");
        }
      }
    }
  }, [expectedProfit, profitReceived]);

  // Auto-fill Profit Received from Amount if type is 'Profit'
  useEffect(() => {
    if (type === "Profit" && amount && !profitReceived) {
      setProfitReceived(amount);
    }
  }, [type, amount, profitReceived]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !type || !date) return;

    setIsUploading(true);
    try {
      let imageUrl = entry.image_url;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("investment_documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("investment_documents")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      await updateEntry({
        entryId: entry.id,
        data: {
          date: new Date(date),
          amount: parseFloat(amount),
          investment_type: type,
          platform: platform || undefined,
          notes: notes || undefined,
          image_url: imageUrl,
          status: status as any,
          // New fields
          principal: principal ? parseFloat(principal) : null,
          duration: duration || null,
          interest_rate: interestRate || null,
          profit_calculation_date: profitCalculationDate
            ? new Date(profitCalculationDate)
            : null,
          investment_date: investmentDate ? new Date(investmentDate) : null,
          maturity_date: maturityDate ? new Date(maturityDate) : null,
          expected_profit: expectedProfit ? parseFloat(expectedProfit) : null,
          profit_received: profitReceived ? parseFloat(profitReceived) : null,
          profit_pending: profitPending ? parseFloat(profitPending) : null,
          profit_status: profitStatus as any,
          remarks: remarks || null,
        },
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Investment Entry</DialogTitle>
            <DialogDescription>
              Update the details of this investment transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Type */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRY_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Platform */}
              <div className="grid gap-2">
                <Label htmlFor="edit-platform">Source / Details</Label>
                <Input
                  id="edit-platform"
                  placeholder="e.g., Bank name, person, or specific source"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </div>
            </div>

            {/* Investment Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Investment Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Principal */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-principal">Principal Amount</Label>
                  <Input
                    id="edit-principal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Duration (Months)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="1"
                    placeholder="e.g., 12"
                    value={duration ? parseInt(duration.split(" ")[0]) : ""}
                    onChange={(e) => {
                      const months = e.target.value;
                      setDuration(months ? `${months} Months` : "");
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter number of months (e.g., 3, 6, 12, 24)
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {/* Interest Rate */}
                <Label htmlFor="edit-interest-rate">Interest Rate (%)</Label>
                <Input
                  id="edit-interest-rate"
                  placeholder="e.g., 24 or 21.96 - 24.96"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a fixed rate (e.g., &quot;24&quot;) or a range (e.g.,
                  &quot;21-24&quot;). Ranges use the average for profit
                  calculation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Investment Date */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-investment-date">Investment Date</Label>
                  <Input
                    id="edit-investment-date"
                    type="datetime-local"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                  />
                </div>

                {/* Maturity Date */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-maturity-date">Maturity Date</Label>
                  <Input
                    id="edit-maturity-date"
                    type="datetime-local"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                  />
                  {investmentDate && duration && (
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated from investment date + duration
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                {/* Profit Calculation Date */}
                <Label htmlFor="edit-profit-calc-date">
                  Profit Calculation Date
                </Label>
                <Input
                  id="edit-profit-calc-date"
                  type="datetime-local"
                  value={profitCalculationDate}
                  onChange={(e) => setProfitCalculationDate(e.target.value)}
                />
              </div>
            </div>

            {/* Profit Tracking Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Profit Tracking
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Expected Profit */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-expected-profit">Expected Profit</Label>
                  <Input
                    id="edit-expected-profit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expectedProfit}
                    onChange={(e) => setExpectedProfit(e.target.value)}
                  />
                  {principal && interestRate && duration && (
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated from principal × rate × duration
                    </p>
                  )}
                </div>

                {/* Profit Received */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-profit-received">Profit Received</Label>
                  <Input
                    id="edit-profit-received"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={profitReceived}
                    onChange={(e) => setProfitReceived(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Profit Pending (Read-only) */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-profit-pending">Profit Pending</Label>
                  <Input
                    id="edit-profit-pending"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={profitPending}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: Expected - Received
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {/* Profit Status */}
                <Label htmlFor="edit-profit-status">Profit Status</Label>
                <Select value={profitStatus} onValueChange={setProfitStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profit status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFIT_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Additional Information
              </h3>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Remarks */}
              <div className="grid gap-2">
                <Label htmlFor="edit-remarks">Remarks</Label>
                <Textarea
                  id="edit-remarks"
                  placeholder="Special remarks or observations..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div className="grid gap-2">
                <Label>Invoice/Receipt</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="edit-file-upload"
                    accept="image/*,application/pdf"
                  />
                  <Label
                    htmlFor="edit-file-upload"
                    className="flex items-center justify-center w-full h-10 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {file
                      ? file.name
                      : entry.image_url
                        ? "Replace File"
                        : "Upload File"}
                  </Label>
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {entry.image_url && !file && (
                  <p className="text-xs text-muted-foreground">
                    Current file attached
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Updating..." : "Update Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
