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
import { useState } from "react";

const INVESTMENT_TYPES = ["Deposit", "Withdrawal", "Profit", "Loss", "Fee"];

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
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { createEntry } = useInvestmentEntries(projectId);
  const { toast } = useToast();
  const supabase = createClient();

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
        notes: notes || undefined,
        image_url: imageUrl,
        status: "completed", // Default to completed for now
      });

      setOpen(false);
      // Reset form
      setAmount("");
      setType("Deposit");
      setPlatform("");
      setNotes("");
      setFile(null);
      setDate(getBangladeshTime());
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Investment Entry</DialogTitle>
            <DialogDescription>
              Record a new transaction for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
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
              <Label htmlFor="type">Type</Label>
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
              <Label htmlFor="amount">Amount</Label>
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

            {/* Platform (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="platform">Source / Details (Optional)</Label>
              <Input
                id="platform"
                placeholder="e.g., Bank name, person, or specific source"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
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
