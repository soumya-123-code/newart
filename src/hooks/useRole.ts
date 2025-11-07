// hooks/useRole.ts
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useRole = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  console.log(user,"user")
  
  return {
    userRole: user?.currentRole?.toLowerCase() || null,
    availableRoles: user?.availableRoles || [],
    hasRole: (role: string) => user?.availableRoles?.includes(role as any) || false,
  };
};