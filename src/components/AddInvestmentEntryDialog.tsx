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
import { getBangladeshTime } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

const INVESTMENT_TYPES = ["Deposit", "Withdrawal", "Profit", "Loss", "Fee"];
const PROFIT_STATUS_OPTIONS = ["received", "pending", "partial", "none"];
const ENTRY_STATUS_OPTIONS = [
  "pending",
  "active",
  "completed",
  "withdrawn",
  "paused",
];

interface AddInvestmentEntryDialogProps {
  children: React.ReactNode;
  projectId: string;
}

export function AddInvestmentEntryDialog({
  children,
  projectId,
}: AddInvestmentEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getBangladeshTime());
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Deposit");
  const [platform, setPlatform] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
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
  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  const { createEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

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
        // Calculate expected profit: (principal * rate * months) / (12 * 100)
        const profit = (principalAmount * rate * months) / (12 * 100);
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
        const pending = expected - received;
        setProfitPending(pending.toFixed(2));

        // Auto-calculate profit/loss
        const profitLossValue = received - expected;
        setProfitLoss(profitLossValue.toFixed(2));

        // Auto-update profit status
        if (received >= expected) {
          setProfitStatus("received");
        } else if (received > 0) {
          setProfitStatus("partial");
        } else {
          setProfitStatus("pending");
        }
      }
    }
  }, [expectedProfit, profitReceived]);

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
      let imageUrl = null;

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

      await createEntry({
        date: new Date(date),
        amount: parseFloat(amount),
        investment_type: type,
        platform: platform || undefined,
        profit_loss: profitLoss ? parseFloat(profitLoss) : null,
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
        withdrawal_amount: withdrawalAmount
          ? parseFloat(withdrawalAmount)
          : null,
      });

      setOpen(false);
      // Reset form
      resetForm();
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

  const resetForm = () => {
    setAmount("");
    setType("Deposit");
    setPlatform("");
    setProfitLoss("");
    setNotes("");
    setFile(null);
    setDate(getBangladeshTime());
    setStatus("active");
    setPrincipal("");
    setDuration("");
    setInterestRate("");
    setProfitCalculationDate("");
    setInvestmentDate("");
    setMaturityDate("");
    setExpectedProfit("");
    setProfitReceived("");
    setProfitPending("");
    setProfitStatus("none");
    setRemarks("");
    setWithdrawalAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Investment Entry</DialogTitle>
            <DialogDescription>
              Record a new transaction for this project with comprehensive
              details.
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
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Type */}
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
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
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
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
                  <Label htmlFor="status">Status</Label>
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
                <Label htmlFor="platform">Source / Details</Label>
                <Input
                  id="platform"
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
                  <Label htmlFor="principal">Principal Amount</Label>
                  <Input
                    id="principal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (Months)</Label>
                  <Input
                    id="duration"
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
                <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                <Input
                  id="interest-rate"
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
                  <Label htmlFor="investment-date">Investment Date</Label>
                  <Input
                    id="investment-date"
                    type="datetime-local"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                  />
                </div>

                {/* Maturity Date */}
                <div className="grid gap-2">
                  <Label htmlFor="maturity-date">Maturity Date</Label>
                  <Input
                    id="maturity-date"
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
                <Label htmlFor="profit-calc-date">
                  Profit Calculation Date
                </Label>
                <Input
                  id="profit-calc-date"
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
                  <Label htmlFor="expected-profit">Expected Profit</Label>
                  <Input
                    id="expected-profit"
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
                  <Label htmlFor="profit-received">Profit Received</Label>
                  <Input
                    id="profit-received"
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
                  <Label htmlFor="profit-pending">Profit Pending</Label>
                  <Input
                    id="profit-pending"
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

                {/* Profit/Loss (Read-only) */}
                <div className="grid gap-2">
                  <Label htmlFor="profit-loss">Profit/Loss</Label>
                  <Input
                    id="profit-loss"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={profitLoss}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: Received - Expected
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {/* Profit Status */}
                <Label htmlFor="profit-status">Profit Status</Label>
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

              <div className="grid gap-2">
                {/* Withdrawal Amount */}
                <Label htmlFor="withdrawal-amount">Withdrawal Amount</Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Remarks */}
              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
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
                    id="file-upload"
                    accept="image/*,application/pdf"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full h-10 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {file ? file.name : "Upload File"}
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Saving..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
