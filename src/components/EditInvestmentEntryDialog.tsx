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

const ENTRY_STATUS_OPTIONS = ["pending", "active", "completed", "withdrawn"];

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
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
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

  const { updateEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open && entry) {
      const entryDate = new Date(entry.order_date);
      const formattedDate = format(entryDate, "yyyy-MM-dd'T'HH:mm");
      
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
    }
  }, [open, entry]);

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
          withdrawal_amount: withdrawalAmount ? parseFloat(withdrawalAmount) : null,
          is_completed: isCompleted,
          status: status as any,
          notes: notes || null,
          image_url: imageUrl,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Investment Entry</DialogTitle>
            <DialogDescription>
              Update the details of this investment entry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Order Information
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-order-no">Order No</Label>
                  <Input
                    id="edit-order-no"
                    type="number"
                    placeholder="1"
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-order-date">Order Date *</Label>
                  <Input
                    id="edit-order-date"
                    type="datetime-local"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-order-id">Order ID</Label>
                  <Input
                    id="edit-order-id"
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
                  <Label htmlFor="edit-investment-amount">Investment Amount *</Label>
                  <Input
                    id="edit-investment-amount"
                    type="number"
                    step="0.01"
                    placeholder="79500"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Duration (Months)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    placeholder="14"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-roi-min">ROI Min (%)</Label>
                  <Input
                    id="edit-roi-min"
                    type="number"
                    step="0.01"
                    placeholder="21.0"
                    value={roiMin}
                    onChange={(e) => setRoiMin(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-roi-max">ROI Max (%)</Label>
                  <Input
                    id="edit-roi-max"
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
                  <Label htmlFor="edit-return-amount">Return Amount</Label>
                  <Input
                    id="edit-return-amount"
                    type="number"
                    step="0.01"
                    placeholder="107500"
                    value={returnAmount}
                    onChange={(e) => setReturnAmount(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-actual-profit">Actual Profit</Label>
                  <Input
                    id="edit-actual-profit"
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
                  <Label htmlFor="edit-capital-added">Capital Added</Label>
                  <Input
                    id="edit-capital-added"
                    type="number"
                    step="0.01"
                    placeholder="80000"
                    value={capitalAdded}
                    onChange={(e) => setCapitalAdded(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-withdrawal">Withdrawal</Label>
                  <Input
                    id="edit-withdrawal"
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
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit-completed"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="edit-completed">Successful Completion</Label>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Additional Information
              </h3>
              
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
