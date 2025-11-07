// types/index.ts
// Central location for all Preparer-related types

// ================================
// Reconciliation Types
// ================================

export interface Reconciliation {
  reconciliationId: string;
  balance: number;
  ccy: string;
  status: 'Prepare' | 'Review' | 'Completed' | 'Rejected';
  priority: 'High' | 'Low';
  deadlineDate: string;
  createdDate?: string;
  description?: string;
  reviewerTiers?: ReviewerTier[];
}

export interface ReconciliationDetails extends Reconciliation {
  details?: {
    agingBalance?: number;
    movementThreshold?: number;
    periodCommentary?: string;
    description?: string;
  };
}

export interface ReviewerTier {
  status: string;
  reviewer?: string;
  reviewedDate?: string;
  comment?: string;
}

// ================================
// Comment/Commentary Types
// ================================

export interface Comment {
  id: string;
  reconciliationId: string;
  userName: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentRequest {
  reconciliationId: string;
  commentary: string;
  commentId?: string;
}

// ================================
// Summary & Dashboard Types
// ================================

export interface ReconciliationSummary {
  total: number;
  byStatus: {
    Prepare?: number;
    Review?: number;
    Completed?: number;
    Rejected?: number;
  };
  byPriority: {
    High?: number;
    Low?: number;
  };
  byUser?: Record<string, number>;
  lastUpdated?: string;
}

// ================================
// Pagination Types
// ================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

// ================================
// Filter Types
// ================================

export interface FilterOptions {
  priority?: string[];
  currency?: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SearchFilters extends FilterOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'balance' | 'status' | 'priority' | 'date';
  sortDirection?: 'asc' | 'desc';
}

// ================================
// Document/Upload Types
// ================================

export interface DocumentUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedDate: string;
  reconciliationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedDate?: string;
  downloadUrl?: string;
}

export interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'processing' | 'publishing';
  fileName: string;
}

export interface ExportReport {
  format: 'excel' | 'csv' | 'pdf';
  fileName: string;
  generatedDate: string;
  downloadUrl: string;
}

// ================================
// Status Update Types
// ================================

export interface StatusUpdateRequest {
  reconciliationId: string;
  status: 'Prepare' | 'Review' | 'Completed';
  comment?: string;
}

export interface StatusUpdateResponse {
  reconciliationId: string;
  previousStatus: string;
  newStatus: string;
  updatedDate: string;
  updatedBy: string;
}

// ================================
// User/Auth Types
// ================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'preparer' | 'reviewer' | 'director' | 'admin';
  department?: string;
  manager?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
}

// ================================
// Redux State Types
// ================================

export interface ReconciliationState {
  reconciliations: Reconciliation[];
  currentReconciliation: ReconciliationDetails | null;
  comments: Record<string, Comment[]>;
  summary: ReconciliationSummary | null;
  
  loading: boolean;
  searching: boolean;
  error: string | null;
  
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  
  filterOptions: FilterOptions;
  
  cache: {
    reconciliations: CacheState;
    summary: CacheState;
    details: Record<string, CacheState>;
  };
}

export interface CacheState {
  timestamp: number | null;
  data: any;
}

// ================================
// API Response Types
// ================================

export interface ApiResponse<T> {
  data?: T;
  items?: T[];
  message?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// ================================
// Hook Return Types
// ================================

export interface UsePreparerReturn {
  // State
  reconciliations: Reconciliation[];
  currentReconciliation: ReconciliationDetails | null;
  comments: Record<string, Comment[]>;
  summary: ReconciliationSummary | null;
  loading: boolean;
  searching: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  filterOptions: FilterOptions;
  
  // Actions
  getReconciliations: (page?: number, pageSize?: number) => Promise<void>;
  searchReconciliationsList: (filters: SearchFilters) => Promise<void>;
  getSummary: () => Promise<void>;
  getReconciliationDetails: (reconciliationId: string) => Promise<void>;

  handleGetLatestImported: (userId: any) => Promise<any>;
  handleExportReport: (format?: string) => Promise<Blob>;

  handleDeleteComment: (reconciliationId: string, commentId: string) => Promise<void>;
 
  handleClearError: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (pageSize: number) => void;
  invalidateCache: (key: 'reconciliations' | 'summary') => void;
  invalidateAllCache: () => void;
}

export interface UsePreparerPaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  changeItemsPerPage: (pageSize: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsePreparerFiltersReturn {
  filterOptions: FilterOptions;
  updateFilters: (newFilters: Partial<FilterOptions>, debounce?: boolean) => void;
  resetFilters: () => void;
  setPriorityFilter: (priority: string[]) => void;
  setCurrencyFilter: (currency: string[]) => void;
  setStatusFilter: (status: string) => void;
}



export interface UseDebouncedSearchReturn {
  query: string;
  isSearching: boolean;
  handleSearch: (query: string) => void;
  setQuery: (query: string) => void;
}

export interface UseAsyncOperationReturn<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
  execute: () => Promise<T>;
}



// ================================
// Component Props Types
// ================================

export interface ReconciliationTableProps {
  reconciliations: Reconciliation[];
  loading?: boolean;
  onRowClick?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export interface ReconciliationDetailsProps {
  reconciliationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onApply: () => void;
  onReset: () => void;
}

export interface ChatUIProps {
  messages: Comment[];
  onAddMessage: (text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  placeholder?: string;
  emptyStateMessage?: string;
}

export interface DonutChartProps {
  title: string;
  total: number;
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export interface StatusBadgeProps {
  status: 'Prepare' | 'Review' | 'Completed' | 'Rejected';
}

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

// ================================
// Utility Types
// ================================

export type ReconciliationStatus = 'Prepare' | 'Review' | 'Completed' | 'Rejected';
export type Priority = 'High' | 'Low';
export type Currency = 'GBP' | 'EUR' | 'CHF' | 'SEK' | 'CAD' | 'AUD';
export type SortDirection = 'asc' | 'desc';
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// ================================
// Service Response Types
// ================================

export interface GetReconciliationsResponse {
  items: Reconciliation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchReconciliationsResponse {
  data: Reconciliation[];
  total: number;
}

export interface GetSummaryResponse {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface UploadDocumentResponse {
  id: string;
  fileName: string;
  uploadedDate: string;
  status: string;
}

export interface AddCommentResponse {
  id: string;
  reconciliationId: string;
  userName: string;
  text: string;
  timestamp: string;
}

