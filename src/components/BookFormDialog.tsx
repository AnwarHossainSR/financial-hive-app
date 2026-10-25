"use client";

import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBooks } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";
import { Book } from "@/types/book";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Star, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const bookSchema = z.object({
  name: z.string().trim().min(1, "Give your book a name"),
  type: z.enum(["personal", "business"]),
  description: z.string().optional(),
  is_default: z.boolean(),
});

type BookFormValues = z.infer<typeof bookSchema>;

const BOOK_TYPES = [
  {
    value: "personal" as const,
    label: "Personal",
    hint: "Home, family, daily spending",
    icon: UserRound,
  },
  {
    value: "business" as const,
    label: "Business",
    hint: "Shop, side hustle, clients",
    icon: Building2,
  },
];

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this book; omit to create a new one */
  book?: Book | null;
}

export function BookFormDialog({
  open,
  onOpenChange,
  book,
}: BookFormDialogProps) {
  const router = useRouter();
  // The hook's mutations show success/error toasts
  const { createBook, updateBook, deleteBook } = useBooks();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEdit = !!book;

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: "",
      type: "personal",
      description: "",
      is_default: false,
    },
  });

  // Load the book being edited (or blank values) each time the dialog opens
  useEffect(() => {
    if (!open) return;
    form.reset({
      name: book?.name ?? "",
      type: book?.type ?? "personal",
      description: book?.description ?? "",
      is_default: book?.is_default ?? false,
    });
  }, [open, book, form]);

  const onSubmit = async (values: BookFormValues) => {
    const description = values.description?.trim() || undefined;
    if (book) {
      const { error } = await updateBook(book.id, { ...values, description });
      if (!error) onOpenChange(false);
      return;
    }
    const { data, error } = await createBook(
      values.name,
      values.type,
      description,
      values.is_default,
    );
    if (!error && data) {
      onOpenChange(false);
      router.push(`/book/${data.id}`);
    }
  };

  const handleDelete = async () => {
    if (!book) return;
    setIsDeleting(true);
    const { error } = await deleteBook(book.id);
    setIsDeleting(false);
    if (!error) {
      setShowDelete(false);
      onOpenChange(false);
      router.push("/dashboard");
    }
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl bg-card p-6 sm:max-w-lg sm:rounded-2xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg font-semibold">
                {isEdit ? "Book settings" : "Create a new book"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Rename, change the type, or set this as your default book."
                  : "Each book keeps its own transactions and monthly budget."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="book-name">Name</Label>
              <Input
                id="book-name"
                placeholder="e.g. Personal, Shop, Family"
                autoComplete="off"
                className="h-11 rounded-xl"
                aria-invalid={!!errors.name}
                {...form.register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label="Book type"
                    className="grid grid-cols-2 gap-3"
                  >
                    {BOOK_TYPES.map(({ value, label, hint, icon: Icon }) => {
                      const selected = field.value === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(value)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:border-primary/40 hover:bg-muted/50",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg",
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="book-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="book-description"
                placeholder="What is this book for?"
                rows={2}
                className="resize-none rounded-xl"
                {...form.register("description")}
              />
            </div>

            <Controller
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <label
                  htmlFor="book-default"
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-muted/30 p-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Star className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">
                        Default book
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Pinned first on your dashboard
                      </span>
                    </span>
                  </span>
                  <Switch
                    id="book-default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </label>
              )}
            />

            <DialogFooter className="flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
              {isEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDelete(true)}
                  className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete book
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEdit ? "Save changes" : "Create book"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {book && (
        <DeleteConfirmationModal
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirmDelete={handleDelete}
          isDeleting={isDeleting}
          itemId={book.id}
          title="Delete this book?"
          description="All transactions and budgets in this book will be permanently deleted. This cannot be undone."
          deleteButtonText="Delete book"
          verificationText={book.name}
        />
      )}
    </>
  );
}
