export interface Reconciliation {
  id: string;
  title: string;
  period: string;
  preparedBy: string;
  preparerName: string;
  reviewedBy?: string;
  reviewerName?: string;
  status: 'in-progress' | 'pending' | 'Prepare' | 'Review' | 'Rejected' | 'Completed' | string;
  createdDate: string;
  modifiedDate: string;
  dueDate?: string;
  totalAccounts: number;
  reconciledAccounts: number;
  pendingAccounts: number;
  totalAmount: number;
  items: any[]; // or defined ReconciliationItem[]
  attachments?: any[];
  comments?: any[];
  reconciliationId?: string;
  accountName?: string;
  accountNumber?: string;
  uploadDate?: string;
  variance?: number;
  priority?: 'High' | 'Low';
  balance?: number;
  currency?: string;
  assignedTo?: string;
  deadline?: string;
  lastModified?: string;
}

export interface Comment {
  id: string;
  userId: any;
  userName: string;
  text: string;
  timestamp: string;
  reconciliationId?: string;
}

export interface ReconciliationDetails extends Reconciliation {
  // Possible additional details
}

export interface ReconciliationSummary {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
