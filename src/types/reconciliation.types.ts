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
  id: any;
  name: any;
  groupType: any;
  recUserGroupItems: any;
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
  id: any;
  title: any;
  period: any;
  preparedBy: any;
  preparerName: any;
  reviewedBy?: any;
  reviewerName?: any;
  status: any;
  createdDate: any;
  modifiedDate: any;
  dueDate?: any;
  totalAccounts: any;
  reconciledAccounts: any;
  pendingAccounts: any;
  totalAmount: any;
  items: any;
  attachments?: any;
  comments?: any;
  reconciliationId?: any;
  accountName?: any;
  accountNumber?: any;
  uploadDate?: any;
  variance?: any;
  priority?: any;
  balance?: any;
  currency?: any;
  assignedTo?: any;
  deadline?: any;
  lastModified?: any;
}

export interface Comment {
  id: any;
  userId: any;
  userName: any;
  text: any;
  timestamp: any;
  reconciliationId?: any;
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
