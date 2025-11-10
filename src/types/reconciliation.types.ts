export interface User {
  userUuid: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string;
  changePassword: boolean;
  team: {
    teamUuid: number;
    teamName: string;
  };
  fullName: string;
}

export interface UserGroup {
  id: number;
  name: string;
  groupType: 'PREPARER' | 'REVIEWER';
  recUserGroupItems: any[];
}

export interface ReviewerTier {
  id?: number;
  tier: number;
  user?: User | null;
  reviewerUserGroup?: UserGroup | null;
  status?: string;
  reviewerName?: string;
}

export interface ReconciliationRequest {
  id?: number;
  recType: 'STANDARD' | 'ROLLUP_PARENT' | 'ROLLUP_CHILD';
  reconciliationId?: string;
  reconciliationName: string;
  riskRating: string;
  performer: User;
  preparerUserGroup?: UserGroup | null;
  description: string;
  bsCarSplit: string;
  divisionalSplit: string;
  division: string;
  category: string;
  deadlinePriority: 'low' | 'high';
  disabled: boolean;
  frequency: 'MONTHLY' | 'QUARTERLY';
  reviewerTiers: ReviewerTier[];
}

export interface BulkUploadStatus {
  reconciliationId: string;
  status: 'Success' | 'Failed';
  updateType: 'Add' | 'Amend' | 'Disable' | 'Enable';
  documentRefreshStatus: string;
  createdOn: string;
  errorInfo?: string;
}


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
