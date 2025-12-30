import { Badge } from "@/components/ui/badge";
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
  Star,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookSelectorSkeleton } from "./skeleton/BookSelectorSkeleton";
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
  const navigate = useNavigate();

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
      // Select the newly created book and navigate
      onSelectBook(data);
      navigate(`/book/${data.id}`);
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
      navigate("/");
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
    return <BookSelectorSkeleton />;
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
                navigate("/");
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
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {selectedBook.name}
                  </h2>
                  {selectedBook.is_default && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 
                               text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 
                               px-2 py-1 text-xs font-semibold rounded-full shadow-sm"
                    >
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>
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
                      "group relative p-4 rounded-xl border border-border bg-white dark:bg-gray-900 bg-opacity-90 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/50",
                      "animate-scale-in",
                      book.is_default &&
                        "ring-2 ring-amber-200 dark:ring-amber-800/50 shadow-md"
                    )}
                    onClick={() => {
                      onSelectBook(book);
                      navigate(`/book/${book.id}`);
                    }}
                  >
                    <div className="flex flex-col h-full space-y-3">
                      <div className="flex items-start justify-between">
                        {book.type === "business" ? (
                          <div className="p-2 bg-income/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-income transform transition-transform duration-300 group-hover:scale-110" />
                          </div>
                        ) : (
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary transform transition-transform duration-300 group-hover:scale-110" />
                          </div>
                        )}

                        {book.is_default && (
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 
                                     text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 
                                     px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm
                                     transition-all duration-200"
                          >
                            <Star className="w-2.5 h-2.5 mr-1 fill-current" />
                            DEFAULT
                          </Badge>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors mb-1">
                          {book.name}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize flex items-center">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mr-1.5" />
                          {book.type} Book
                        </p>
                      </div>
                      {book.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                          {book.description}
                        </p>
                      )}
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
