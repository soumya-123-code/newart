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
  userName: any;
  activeRole: any;
  roles: any;
  status?: any;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
}
