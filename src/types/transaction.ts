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
  onDeleteTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  onImportCSV: () => void;
  canAddTransaction: boolean;
  pagination: PaginationInfo;
  onLoadMore: () => void;
  loadingMore: boolean;
  loading: boolean;
  onFilterChange: (filters: TransactionFilters) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onExportPDF: () => void;
  onOpenCalculator?: () => void;
  showEditForm?: boolean;
  setShowEditForm?: (show: boolean) => void;
}
