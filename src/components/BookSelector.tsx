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
import {
  BookOpen,
  Building2,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

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
  const [formData, setFormData] = useState({
    name: "",
    type: "personal" as "personal" | "business",
    description: "",
  });

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await createBook(
      formData.name,
      formData.type,
      formData.description
    );

    if (!error) {
      setShowCreateDialog(false);
      setFormData({ name: "", type: "personal", description: "" });
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    const { error } = await updateBook(selectedBook.id, {
      name: formData.name,
      type: formData.type,
      description: formData.description,
    });

    if (!error) {
      setShowEditDialog(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    const { error } = await deleteBook(selectedBook.id);

    if (!error) {
      onSelectBook(null);
      setShowEditDialog(false);
    }
  };

  const openEditDialog = () => {
    if (selectedBook) {
      setFormData({
        name: selectedBook.name,
        type: selectedBook.type,
        description: selectedBook.description || "",
      });
      setShowEditDialog(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Select Book</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Book
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {books.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No books yet</p>
              <p className="text-sm">
                Create your first book to start tracking expenses
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`relative p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedBook?.id === book.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onSelectBook(book)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {book.type === "business" ? (
                        <Building2 className="w-5 h-5 text-chart-2" />
                      ) : (
                        <User className="w-5 h-5 text-chart-1" />
                      )}
                      <div>
                        <h3 className="font-semibold text-sm">{book.name}</h3>
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

                    {selectedBook?.id === book.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog();
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Book Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="book-name">Book Name</Label>
              <Input
                id="book-name"
                placeholder="My Expense Book"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "personal" | "business") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Personal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>Business</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-description">Description (Optional)</Label>
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
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Book</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditBook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-book-name">Book Name</Label>
              <Input
                id="edit-book-name"
                placeholder="My Expense Book"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-book-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "personal" | "business") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Personal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>Business</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-book-description">
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
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteBook}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Book</span>
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
