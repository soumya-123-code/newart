// src/constants/roles.ts
import type { UserRole } from '@/types/auth.types';

export const ROLE_HOME: Record<UserRole, string> = {
  PREPARER: '/dashboard/preparer/my-reconciliations',
  REVIEWER: '/dashboard/reviewer/all-reconciliations',
  DIRECTOR: '/dashboard/director/current-period',
  ADMIN: '/dashboard/admin/dashboard',
};
