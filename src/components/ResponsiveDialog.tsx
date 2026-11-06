"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A centered dialog on desktop and a bottom sheet on phones, where a dialog
 * would cover the whole screen and fight the keyboard. Content scrolls inside
 * either one; put sticky footers at `bottom-0` with `-mx-4 px-4 md:-mx-6
 * md:px-6` to span the edges.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        shouldScaleBackground={false}
        repositionInputs={false}
      >
        <DrawerContent
          className={cn(
            "max-h-[92dvh] rounded-t-3xl border-0 bg-card",
            className,
          )}
        >
          <DrawerHeader className="px-4 pb-2 pt-3 text-left">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="pb-safe flex-1 overflow-y-auto overscroll-contain px-4">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg gap-0 rounded-2xl bg-card p-0 sm:rounded-2xl",
          className,
        )}
      >
        <DialogHeader className="space-y-1 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="px-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
