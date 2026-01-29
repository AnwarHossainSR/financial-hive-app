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
import { Textarea } from "@/components/ui/textarea";
import { useInvestmentPlatform } from "@/hooks/useInvestmentPlatform";
import { useEffect, useState } from "react";

interface EditPlatformDialogProps {
  children: React.ReactNode;
  platform: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlatformDialog({
  children,
  platform,
  open,
  onOpenChange,
}: EditPlatformDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { updatePlatform } = useInvestmentPlatform(platform.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && platform) {
      setName(platform.name);
      setDescription(platform.description || "");
    }
  }, [open, platform]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await updatePlatform({
        id: platform.id,
        data: {
          name,
          description: description || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update platform:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update the details of your investment platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., i-Farmer"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform-description">
                Description (Optional)
              </Label>
              <Textarea
                id="platform-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief details about this platform..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Platform"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
