"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
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
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Edit, Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

const ENTRY_STATUS_OPTIONS = ["pending", "active", "completed", "withdrawn"];

interface InvestmentEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entry?: any;
  mode: "add" | "edit" | "view";
  onDelete?: (id: string) => void;
}

export function InvestmentEntryModal({
  open,
  onOpenChange,
  projectId,
  entry,
  mode,
  onDelete,
}: InvestmentEntryModalProps) {
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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
  const [editMode, setEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { createEntry, updateEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

  const isReadOnly = mode === "view" && !editMode;

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open) {
      if (entry && (mode === "edit" || mode === "view")) {
        const entryDate = new Date(entry.order_date);
        const formattedDate = format(entryDate, "yyyy-MM-dd");

        setOrderNo(entry.order_no?.toString() || "");
        setOrderDate(formattedDate);
        setOrderId(entry.order_id || "");
        setInvestmentAmount(entry.investment_amount?.toString() || "");
        setDurationMonths(entry.duration_months?.toString() || "");
        setRoiMin(entry.roi_min?.toString() || "");
        setRoiMax(entry.roi_max?.toString() || "");
        setReturnAmount(entry.return_amount?.toString() || "");
        setActualProfit(entry.actual_profit?.toString() || "");
        setCapitalAdded(entry.capital_added?.toString() || "");
        setWithdrawalAmount(entry.withdrawal_amount?.toString() || "");
        setIsCompleted(entry.is_completed || false);
        setStatus(entry.status || "active");
        setNotes(entry.notes || "");
        setFile(null);
      } else {
        resetForm();
      }
      setEditMode(false);
    }
  }, [open, entry, mode]);

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
      let imageUrl = entry?.image_url;

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

      const data = {
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
      };

      if (mode === "add") {
        await createEntry(data);
      } else {
        await updateEntry({ entryId: entry.id, data });
      }

      onOpenChange(false);
      if (mode === "view") setEditMode(false);
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
    setOrderDate(new Date().toISOString().split("T")[0]);
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

  const getTitle = () => {
    if (mode === "add") return "Add Investment Entry";
    if (mode === "edit" || editMode) return "Edit Investment Entry";
    return "Investment Entry Details";
  };

  const getDescription = () => {
    if (mode === "add")
      return "Record a new investment entry with order details and ROI information.";
    if (mode === "edit" || editMode)
      return "Update the details of this investment entry.";
    return "View the details of this investment entry.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:rounded-2xl">
        <div className="max-h-[90dvh] overflow-y-auto px-6 pt-6 scrollbar-hide">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="space-y-1 border-b pb-5 pr-10 text-left">
              <DialogTitle className="flex items-center justify-between gap-3 text-lg font-semibold">
                <span>{getTitle()}</span>
                {mode === "view" && !editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2 rounded-xl"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>
                {getDescription()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5">
              {/* Order Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="order-id">Order ID</Label>
                    <Input
                      id="order-id"
                      placeholder="77209"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="space-y-4 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Investment Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="investment-amount">
                      Investment Amount *
                    </Label>
                    <Input
                      id="investment-amount"
                      type="number"
                      step="0.01"
                      placeholder="79500"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      required
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* View Mode: Show calculated values */}
              {mode === "view" && !editMode && entry && (
                <div className="space-y-4 border-t pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Calculated Values
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-primary/5 p-3 ring-1 ring-inset ring-primary/15">
                      <Label className="text-xs text-muted-foreground">
                        Expected profit
                      </Label>
                      <div className="text-lg font-semibold tabular-nums text-primary">
                        {entry.expected_profit
                          ? formatCurrency(entry.expected_profit)
                          : "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-income/5 p-3 ring-1 ring-inset ring-income/15">
                      <Label className="text-xs text-muted-foreground">
                        Expected return
                      </Label>
                      <div className="text-lg font-semibold tabular-nums text-income">
                        {entry.expected_return
                          ? formatCurrency(entry.expected_return)
                          : "-"}
                      </div>
                    </div>
                  </div>

                  {entry.maturity_date && (
                    <div className="rounded-xl bg-muted/60 p-3">
                      <Label className="text-xs text-muted-foreground">
                        Maturity date
                      </Label>
                      <div className="text-lg font-semibold">
                        {format(new Date(entry.maturity_date), "MMM d, yyyy")}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Returns & Profit */}
              <div className="space-y-4 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
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
                      readOnly={isReadOnly}
                      className="h-10 rounded-xl read-only:bg-muted/40 read-only:focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Completion */}
              <div className="space-y-4 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
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
                    <Checkbox
                      id="completed"
                      checked={isCompleted}
                      onCheckedChange={(checked) =>
                        setIsCompleted(checked === true)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="completed">Successful Completion</Label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4 border-t pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    readOnly={isReadOnly}
                    className="resize-none rounded-xl read-only:bg-muted/40"
                  />
                </div>

                {!isReadOnly && (
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
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-input text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {file
                          ? file.name
                          : entry?.image_url
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
                    {entry?.image_url && !file && (
                      <p className="text-xs text-muted-foreground">
                        Current file attached
                      </p>
                    )}
                  </div>
                )}

                {/* Show current file in view mode */}
                {isReadOnly && entry?.image_url && (
                  <div className="grid gap-2">
                    <Label>Current File</Label>
                    <div className="rounded-xl border bg-muted/40 p-3">
                      <a
                        href={entry.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        View attached document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 -mx-6 flex flex-col-reverse gap-2 border-t bg-card/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-between sm:space-x-0">
              {mode === "view" && !editMode && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Entry
                </Button>
              )}

              <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
                {mode === "view" && editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                )}

                {(mode === "add" || mode === "edit" || editMode) && (
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="gap-2 rounded-xl"
                  >
                    {isUploading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isUploading
                      ? "Saving..."
                      : mode === "add"
                        ? "Add Entry"
                        : "Update Entry"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirmDelete={(id) => {
          onDelete?.(id);
          setShowDeleteDialog(false);
          onOpenChange(false);
        }}
        itemId={entry?.id || ""}
        title="Delete Investment Entry"
        description="Are you sure you want to delete this investment entry? This action cannot be undone."
        deleteButtonText="Delete Entry"
        verificationText="DELETE"
      />
    </Dialog>
  );
}
