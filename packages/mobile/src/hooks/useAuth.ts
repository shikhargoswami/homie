import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { User, AuthResponse, OTPResponse } from '../services/auth.service';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, []);

  // Get current user (only if authenticated)
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      
      try {
        return await authService.getCurrentUser();
      } catch (error) {
        console.error('Failed to get user:', error);
        return await authService.getUser();
      }
    },
    enabled: isAuthenticated && isInitialized,
    staleTime: Infinity,
  });

  // Request OTP
  const requestOTPMutation = useMutation<OTPResponse, Error, string>({
    mutationFn: (phone: string) => authService.requestOTP(phone),
  });

  // Verify OTP and login
  const verifyOTPMutation = useMutation<AuthResponse, Error, { phone: string; otp: string }>({
    mutationFn: ({ phone, otp }) => authService.verifyOTP(phone, otp),
    onSuccess: (data) => {
      setIsAuthenticated(true);
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    isLoadingUser: !isInitialized || isLoadingUser,
    requestOTP: requestOTPMutation.mutateAsync,
    isRequestingOTP: requestOTPMutation.isPending,
    verifyOTP: verifyOTPMutation.mutateAsync,
    isVerifyingOTP: verifyOTPMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
