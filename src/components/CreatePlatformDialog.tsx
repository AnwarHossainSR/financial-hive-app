"use client";

import { createIsolatedInvestmentPlatformAction } from "@/app/actions/platform-actions";
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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreatePlatformDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const { platform, error } = await createIsolatedInvestmentPlatformAction(
        "",
        { name: name.trim(), description: description.trim() },
      );
      if (error || !platform) throw new Error(error ?? "Could not create platform");

      // The platform lists are React Query data, so refresh them directly
      await queryClient.invalidateQueries({
        queryKey: ["investment-platforms"],
      });
      toast({
        title: "Platform created",
        description: `${platform.name} is ready for its first project.`,
      });

      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/investments/platforms/${platform.id}`);
    } catch (error: any) {
      toast({
        title: "Couldn't create platform",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl bg-card p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="items-start space-y-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>New investment platform</DialogTitle>
              <DialogDescription>
                A platform groups the projects you invest in through one
                provider, e.g. i-Farmer or WeGrow.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="platform-name">Name</Label>
            <Input
              id="platform-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. i-Farmer"
              className="h-11 rounded-xl"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platform-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="platform-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything worth remembering about this platform"
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
              disabled={isLoading || !name.trim()}
              className="rounded-xl"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create platform
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
