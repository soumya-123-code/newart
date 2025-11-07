// services/types.ts
export interface Reconciliation { id: string; name: string; status: string; priority: string; period: string; division?: string; }
export interface User { userId: any; name: string; role: string; }
export interface ImportHistory { id: string; filename: string; importedAt: string; status: string; }
export interface CommentaryRequest { reconciliationId: string; comment: string; }
export interface RecAssignmentRequest { reconciliationId: string; assigneeId: string; }
export interface PeriodRequest { period: string; }
export interface StatusRequest { reconciliationId: string; status: string; }
export interface SearchParams { [key: string]: any; }
