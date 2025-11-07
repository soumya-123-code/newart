/**
 * Application routes constants
 * 
 * Use these constants instead of hardcoding paths to ensure consistency.
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/login',
  LOGOUT: '/logout',                    // ✅ NEW - Logout confirmation page
  UNAUTHORIZED: '/unauthorized',        // ✅ UPDATED - Session expired page

  // Preparer Routes
  PREPARER_RECONCILIATIONS: '/dashboard/preparer/my-reconciliations',
  PREPARER_UPLOAD: '/dashboard/preparer/upload',
  PREPARER_RECONCILIATION_DETAILS: '/dashboard/preparer/reconciliation-details',
  getReconciliationDetailsRoute: (id: string) => `/dashboard/preparer/reconciliation-details/${id}`,

  // Reviewer Routes
  REVIEWER_ALL_RECONCILIATIONS: '/dashboard/reviewer/all-reconciliations',
  REVIEWER_REVIEW: '/dashboard/reviewer/review',
  REVIEWER_DOWNLOAD: '/dashboard/reviewer/download',
  getReviewRoute: (id: string) => `/dashboard/reviewer/review/${id}`,

  // Director Routes
  DIRECTOR_CURRENT_PERIOD: '/dashboard/director/current-period',
  DIRECTOR_PROCESSED: '/dashboard/director/processed',

  // Admin Routes (match header order one-to-one)
  ADMIN_DASHBOARD: '/dashboard/admin/dashboard',                      // Rec control
  ADMIN_ALL_RECONCILIATIONS: '/dashboard/admin/all-reconciliations',  // All recs
  ADMIN_ROLL_FORWARD: '/dashboard/admin/roll-forward',               // Roll forward
  ADMIN_MASTER_RECS: '/dashboard/admin/master-recs',                 // Master recs
  ADMIN_REC_MANAGEMENT: '/dashboard/admin/rec-management',           // Rec management
  ADMIN_LEDGER_MANAGEMENT: '/dashboard/admin/ledger-management',     // Ledger management
  ADMIN_USER_MANAGEMENT: '/dashboard/admin/user-management',         // User management
  ADMIN_HISTORY: '/dashboard/admin/history',                         // History
  ADMIN_UPLOAD: '/dashboard/admin/upload',                           // Quick access
  ADMIN_DOWNLOAD: '/dashboard/admin/download',                       // Quick access
};

/**
 * Role-based default home routes
 */
export const ROLE_HOME_ROUTES = {
  preparer: ROUTES.PREPARER_RECONCILIATIONS,
  reviewer: ROUTES.REVIEWER_ALL_RECONCILIATIONS,
  director: ROUTES.DIRECTOR_CURRENT_PERIOD,
  admin: ROUTES.ADMIN_DASHBOARD,
};

/**
 * API endpoints
 */
export const API_ROUTES = {
  // Authentication
  LOGOUT: '/newapi/auth/logout',
  LOGIN: '/newapi/auth/login',
  GET_USER_INFO: '/newapi/auth/user-info',
  REFRESH_TOKEN: '/newapi/auth/refresh-token',

  // Reconciliations
  RECONCILIATIONS: '/newapi/reconciliations',
  RECONCILIATION_BY_ID: (id: string) => `/newapi/reconciliations/${id}`,
  RECONCILIATION_STATUS: (id: string) => `/newapi/reconciliations/${id}/status`,
  RECONCILIATION_SUBMIT: (id: string) => `/newapi/reconciliations/${id}/submit`,
  RECONCILIATION_APPROVE: (id: string) => `/newapi/reconciliations/${id}/approve`,
  RECONCILIATION_REJECT: (id: string) => `/newapi/reconciliations/${id}/reject`,

  // Admin Actions
  ADMIN_BULK_ASSIGN: '/newapi/admin/reconciliations/assign',
  ADMIN_EXPORT: '/newapi/admin/reconciliations/export',
  ADMIN_ROLL_FORWARD: '/newapi/admin/roll-forward',
  ADMIN_MASTER_RECS: '/newapi/admin/master-recs',
  ADMIN_REC_MGMT: '/newapi/admin/rec-management',
  ADMIN_LEDGER_MGMT: '/newapi/admin/ledger-management',
  ADMIN_HISTORY: '/newapi/admin/history',

  // Upload/Download
  UPLOAD: '/newapi/upload',
  DOWNLOAD: '/newapi/download',
  DOWNLOAD_BY_ID: (id: string) => `/newapi/download/${id}`,
  DOWNLOAD_EXPORT: (id: string) => `/newapi/download/${id}/export`,

  // Users
  USERS: '/newapi/users',
  USER_BY_ID: (id: string) => `/newapi/users/${id}`,
  UPDATE_USER: (id: string) => `/newapi/users/${id}`,
  DELETE_USER: (id: string) => `/newapi/users/${id}`,
};

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.LOGOUT,
  ROUTES.UNAUTHORIZED,
];

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
  ROUTES.PREPARER_RECONCILIATIONS,
  ROUTES.REVIEWER_ALL_RECONCILIATIONS,
  ROUTES.DIRECTOR_CURRENT_PERIOD,
  ROUTES.ADMIN_DASHBOARD,
];
