export interface Transaction {
  id: string;
  book_id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

/** What the add/edit transaction form submits */
export interface TransactionFormValues {
  book_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  /** null clears an existing note when editing */
  note?: string | null;
  date: Date;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TransactionFilters {
  bookId?: string;
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  search?: string;
  userId?: string;
}

export interface TransactionsSectionProps {
  transactions: Transaction[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  /** Filters other than search; the section edits them via its filter UI */
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  canAddTransaction: boolean;
  pagination: PaginationInfo;
  onLoadMore: () => void;
  loadingMore: boolean;
  loading: boolean;
}
