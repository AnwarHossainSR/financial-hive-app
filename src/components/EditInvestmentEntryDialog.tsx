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

const INVESTMENT_TYPES = ["Deposit", "Withdrawal", "Profit", "Loss", "Fee"];

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
  const [profitLoss, setProfitLoss] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setProfitLoss(entry.profit_loss ? entry.profit_loss.toString() : "");
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
          profit_loss: profitLoss ? parseFloat(profitLoss) : null,
          notes: notes || undefined,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Investment Entry</DialogTitle>
            <DialogDescription>
              Update the details of this investment transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
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
              <Label htmlFor="edit-type">Type</Label>
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

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount</Label>
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

            {/* Profit/Loss */}
            <div className="grid gap-2">
              <Label htmlFor="edit-profit-loss">Profit/Loss (Optional)</Label>
              <Input
                id="edit-profit-loss"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={profitLoss}
                onChange={(e) => setProfitLoss(e.target.value)}
              />
            </div>

            {/* Platform (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="edit-platform">Source / Details (Optional)</Label>
              <Input
                id="edit-platform"
                placeholder="e.g., Bank name, person, or specific source"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
