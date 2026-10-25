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
import { useInvestmentProjects } from "@/hooks/useInvestmentProjects";
import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";

export function CreateProjectDialog({
  children,
  platformId,
}: {
  children: React.ReactNode;
  platformId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The hook's mutation shows the success/error toast and refreshes lists
  const { createProject } = useInvestmentProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        platform_id: platformId,
      });
      setOpen(false);
      setName("");
      setDescription("");
    } catch {
      // Toast already shown by the mutation; keep the form filled in
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl bg-card p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="items-start space-y-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderPlus className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                A project holds the individual investment entries you make
                in it.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cattle batch 4"
              className="h-11 rounded-xl"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Terms, contacts, anything worth remembering"
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
