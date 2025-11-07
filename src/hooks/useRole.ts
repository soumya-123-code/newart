import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();

  return {
    userRole: user?.currentRole?.toLowerCase() || null,
    availableRoles: user?.availableRoles || [],
    hasRole: (role: string) => user?.availableRoles?.includes(role as any) || false,
  };
};
