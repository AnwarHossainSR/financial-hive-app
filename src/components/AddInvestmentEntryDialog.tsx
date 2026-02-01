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

const ENTRY_STATUS_OPTIONS = ["pending", "active", "completed", "withdrawn"];

interface AddInvestmentEntryDialogProps {
  children: React.ReactNode;
  projectId: string;
}

export function AddInvestmentEntryDialog({
  children,
  projectId,
}: AddInvestmentEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderId, setOrderId] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [roiMin, setRoiMin] = useState("");
  const [roiMax, setRoiMax] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [actualProfit, setActualProfit] = useState("");
  const [capitalAdded, setCapitalAdded] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { createEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

  // Auto-calculate expected profit and return when investment amount and ROI change
  useEffect(() => {
    if (investmentAmount && roiMin) {
      const amount = parseFloat(investmentAmount);
      const roi = parseFloat(roiMin);

      if (!isNaN(amount) && !isNaN(roi)) {
        const expectedProfit = amount * (roi / 100);
        const expectedReturn = amount + expectedProfit;

        // Auto-fill calculated values
        setCapitalAdded(amount.toString());
        // Note: expected_profit and expected_return will be calculated by database triggers
      }
    }
  }, [investmentAmount, roiMin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentAmount || !orderDate) return;

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
        order_no: orderNo ? parseInt(orderNo) : null,
        order_date: new Date(orderDate),
        order_id: orderId || null,
        investment_amount: parseFloat(investmentAmount),
        duration_months: durationMonths ? parseInt(durationMonths) : null,
        roi_min: roiMin ? parseFloat(roiMin) : null,
        roi_max: roiMax ? parseFloat(roiMax) : null,
        return_amount: returnAmount ? parseFloat(returnAmount) : null,
        actual_profit: actualProfit ? parseFloat(actualProfit) : null,
        capital_added: capitalAdded ? parseFloat(capitalAdded) : null,
        withdrawal_amount: withdrawalAmount
          ? parseFloat(withdrawalAmount)
          : null,
        is_completed: isCompleted,
        status: status as any,
        notes: notes || null,
        image_url: imageUrl,
      });

      setOpen(false);
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
    setOrderNo("");
    setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderId("");
    setInvestmentAmount("");
    setDurationMonths("");
    setRoiMin("");
    setRoiMax("");
    setReturnAmount("");
    setActualProfit("");
    setCapitalAdded("");
    setWithdrawalAmount("");
    setIsCompleted(false);
    setStatus("active");
    setNotes("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Investment Entry</DialogTitle>
            <DialogDescription>
              Record a new investment entry with order details and ROI
              information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Order Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="order-no">Order No</Label>
                  <Input
                    id="order-no"
                    type="number"
                    placeholder="1"
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="order-date">Order Date *</Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="order-id">Order ID</Label>
                  <Input
                    id="order-id"
                    placeholder="77209"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Investment Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="investment-amount">Investment Amount *</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    step="0.01"
                    placeholder="79500"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (Months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="14"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="roi-min">ROI Min (%) *</Label>
                  <Input
                    id="roi-min"
                    type="number"
                    step="0.01"
                    placeholder="21.0"
                    value={roiMin}
                    onChange={(e) => setRoiMin(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for profit calculation
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="roi-max">ROI Max (%)</Label>
                  <Input
                    id="roi-max"
                    type="number"
                    step="0.01"
                    placeholder="24.0"
                    value={roiMax}
                    onChange={(e) => setRoiMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Returns & Profit */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Returns & Profit
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="return-amount">Return Amount</Label>
                  <Input
                    id="return-amount"
                    type="number"
                    step="0.01"
                    placeholder="107500"
                    value={returnAmount}
                    onChange={(e) => setReturnAmount(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="actual-profit">Actual Profit</Label>
                  <Input
                    id="actual-profit"
                    type="number"
                    step="0.01"
                    placeholder="7500"
                    value={actualProfit}
                    onChange={(e) => setActualProfit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capital-added">Capital Added</Label>
                  <Input
                    id="capital-added"
                    type="number"
                    step="0.01"
                    placeholder="80000"
                    value={capitalAdded}
                    onChange={(e) => setCapitalAdded(e.target.value)}
                    className={
                      investmentAmount && !capitalAdded ? "bg-blue-50" : ""
                    }
                  />
                  {investmentAmount && !capitalAdded && (
                    <p className="text-xs text-blue-600">
                      Auto-filled from investment amount
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="withdrawal">Withdrawal</Label>
                  <Input
                    id="withdrawal"
                    type="number"
                    step="0.01"
                    placeholder="107500"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status & Completion */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Status
              </h3>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="completed"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="completed">Successful Completion</Label>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Additional Information
              </h3>

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
