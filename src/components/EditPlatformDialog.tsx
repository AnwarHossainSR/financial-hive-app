"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { InvestmentPlatform } from "@/types/investment";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface EditPlatformDialogProps {
  platform: Pick<InvestmentPlatform, "id" | "name" | "description">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlatformDialog({
  platform,
  open,
  onOpenChange,
}: EditPlatformDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  // The hook's mutation shows the success/error toast
  const { updatePlatform } = useInvestmentPlatform(platform.id);

  // Load the current values each time the dialog opens
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(platform.name);
      setDescription(platform.description || "");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updatePlatform({
        id: platform.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch {
      // Toast already shown by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-card p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle>Edit platform</DialogTitle>
            <DialogDescription>
              Rename the platform or update its description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-platform-name">Name</Label>
            <Input
              id="edit-platform-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-platform-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="edit-platform-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
