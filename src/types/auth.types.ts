export type UserRole = 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  roles: string;
  availableRoles: UserRole[];
  currentRole: UserRole;
  fullName: string;
}


export interface AuthUser {
  userId: any;
  userName: string;
  activeRole: UserRole;
  roles: UserRole[] | string[];
  status?: 'SUCCESS' | 'PASSWORD_CHANGE' | 'LOCKED' | string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
}
