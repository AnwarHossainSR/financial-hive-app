import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Book, useBooks } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Loader2,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Switch } from "./ui/switch";

interface BookSelectorProps {
  selectedBook: Book | null;
  onSelectBook: (book: Book | null) => void;
}

export const BookSelector = ({
  selectedBook,
  onSelectBook,
}: BookSelectorProps) => {
  const { books, loading, createBook, updateBook, deleteBook } = useBooks();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "personal" as "personal" | "business",
    description: "",
    is_default: false,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const { error, data } = await createBook(
      formData.name,
      formData.type,
      formData.description,
      formData.is_default
    );

    setFormLoading(false);

    if (!error && data) {
      setShowCreateDialog(false);
      setFormData({
        name: "",
        type: "personal",
        description: "",
        is_default: false,
      });
      toast({
        title: "Book Created",
        description: "Your new book was successfully created.",
      });
      // Select the newly created book and update query param
      onSelectBook(data);
      setSearchParams({ bookId: data.id });
    } else {
      toast({
        title: "Error",
        description: "Failed to create the book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    setFormLoading(true);

    const { error, data } = await updateBook(selectedBook.id, {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      is_default: formData.is_default,
    });

    setFormLoading(false);

    if (!error) {
      setShowEditDialog(false);
      toast({
        title: "Book Updated",
        description: "Your book was successfully updated.",
      });
      // Update selected book to reflect changes
      onSelectBook(data);
      setSearchParams({ bookId: data.id });
    } else {
      toast({
        title: "Error",
        description: "Failed to update the book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    const { error } = await deleteBook(selectedBook.id);

    if (!error) {
      onSelectBook(null);
      setShowEditDialog(false);
      setSearchParams({}); // Clear query param
      toast({
        title: "Book Deleted",
        description: "The book was successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = () => {
    if (selectedBook) {
      setFormData({
        name: selectedBook.name,
        type: selectedBook.type,
        description: selectedBook.description || "",
        is_default: selectedBook.is_default || false,
      });
      setShowEditDialog(true);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 animate-scale-in">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {selectedBook ? (
        <div className="flex items-center justify-between mb-6 animate-scale-in">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectBook(null);
                setSearchParams({}); // Clear query param
              }}
              className="border-border text-foreground hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              {selectedBook.type === "business" ? (
                <Building2 className="w-6 h-6 text-income" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {selectedBook.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                  {selectedBook.type}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openEditDialog}
            className="text-foreground hover:bg-primary/10 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md animate-scale-in">
          <CardHeader className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg text-foreground mr-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Select Book</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="border-border text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2 sm:mr-2" />
                <span className="hidden sm:inline">New Book</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {books.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className={cn(
                      "group relative p-4 rounded-lg border border-border bg-white dark:bg-gray-900 bg-opacity-90 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-income hover:border-primary/50",
                      "animate-scale-in"
                    )}
                    onClick={() => {
                      onSelectBook(book);
                      setSearchParams({ bookId: book.id });
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {book.type === "business" ? (
                          <Building2 className="w-6 h-6 text-income transform transition-transform duration-300 group-hover:scale-110" />
                        ) : (
                          <User className="w-6 h-6 text-primary transform transition-transform duration-300 group-hover:scale-110" />
                        )}
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {book.name}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {book.type}
                          </p>
                          {book.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {book.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Book Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-card">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-foreground">
              Create New Book
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4 p-2">
            <div className="space-y-2">
              <Label htmlFor="book-name" className="text-sm text-foreground">
                Book Name
              </Label>
              <Input
                id="book-name"
                placeholder="My Expense Book"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-type" className="text-sm text-foreground">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "personal" | "business") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={formLoading}
              >
                <SelectTrigger className="border-border bg-background text-foreground focus:ring-primary rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>Personal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-income" />
                      <span>Business</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="book-description"
                className="text-sm text-foreground"
              >
                Description (Optional)
              </Label>
              <Textarea
                id="book-description"
                placeholder="Brief description of this book..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2 flex flex-col gap-1">
              <Label
                htmlFor="book-description"
                className="text-sm text-foreground"
              >
                Default Book (Optional)?
              </Label>
              <Switch
                checked={(formData.is_default ?? false) as boolean}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_default: checked }))
                }
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-border text-foreground hover:bg-primary/10 rounded-lg"
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Book"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-card">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-foreground">
              Edit Book
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditBook} className="space-y-4 p-2">
            <div className="space-y-2">
              <Label
                htmlFor="edit-book-name"
                className="text-sm text-foreground"
              >
                Book Name
              </Label>
              <Input
                id="edit-book-name"
                placeholder="My Expense Book"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-book-type"
                className="text-sm text-foreground"
              >
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "personal" | "business") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={formLoading}
              >
                <SelectTrigger className="border-border bg-background text-foreground focus:ring-primary rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>Personal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-income" />
                      <span>Business</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-book-description"
                className="text-sm text-foreground"
              >
                Description (Optional)
              </Label>
              <Textarea
                id="edit-book-description"
                placeholder="Brief description of this book..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2 flex flex-col gap-1">
              <Label
                htmlFor="book-description"
                className="text-sm text-foreground"
              >
                Default Book (Optional)?
              </Label>
              <Switch
                checked={(formData.is_default ?? false) as boolean}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_default: checked }))
                }
                className="border-border bg-background text-foreground focus:ring-primary rounded-lg"
                disabled={formLoading}
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteBook}
                className="flex items-center space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
                disabled={formLoading}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Book</span>
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="border-border text-foreground hover:bg-primary/10 rounded-lg"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
