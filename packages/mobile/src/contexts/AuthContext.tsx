import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { apiClient } from '../services/api';
import type { User, AuthResponse, OTPResponse } from '../services/auth.service';

// 🔧 DEV FLAG: Set to true to always start from login screen
const DEV_FORCE_LOGOUT = false; // Set to false for normal testing
// 🔧 DEV FLAG: Set to true to reset test user (9999999999) data on app start
const DEV_RESET_TEST_USER = false; // Disabled to preserve test data

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  requestOTP: (phone: string) => Promise<OTPResponse>;
  isRequestingOTP: boolean;
  verifyOTP: (params: { phone: string; otp: string }) => Promise<AuthResponse>;
  isVerifyingOTP: boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 🔧 DEV: Reset test user data for fresh onboarding
        if (DEV_RESET_TEST_USER) {
          try {
            console.log('🔧 DEV: Resetting test user data...');
            await apiClient.post('/api/auth/dev/reset-test-user');
            console.log('✅ DEV: Test user reset complete');
          } catch (error) {
            console.log('⚠️ DEV: Could not reset test user (may not exist yet)');
          }
        }

        // 🔧 DEV: Force logout for testing
        if (DEV_FORCE_LOGOUT) {
          console.log('🔧 DEV: Forcing logout for testing...');
          try {
            await authService.logout();
          } catch (error) {
            // Ignore logout errors - user might not be logged in
          }
          setIsAuthenticated(false);
          setIsInitialized(true);
          return;
        }

        console.log('🔐 AuthProvider: Checking authentication...');
        const authenticated = await authService.isAuthenticated();
        console.log('🔐 AuthProvider: isAuthenticated =', authenticated);
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
  const { data: user, isLoading: isLoadingUser, refetch: refetchUserQuery } = useQuery<User | null>({
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

  // Refetch user data (used after profile completion)
  const refetchUser = async () => {
    console.log('🔄 Refetching user data...');
    await refetchUserQuery();
  };

  // Request OTP
  const requestOTPMutation = useMutation<OTPResponse, Error, string>({
    mutationFn: (phone: string) => authService.requestOTP(phone),
  });

  // Verify OTP and login
  const verifyOTPMutation = useMutation<AuthResponse, Error, { phone: string; otp: string }>({
    mutationFn: async ({ phone, otp }) => {
      console.log('🔑 verifyOTPMutation.mutationFn called');
      
      // 🔧 DEV: Reset test user before verifying OTP to ensure fresh state
      if (DEV_RESET_TEST_USER && phone === '9999999999') {
        try {
          console.log('🔧 DEV: Resetting test user before login...');
          await apiClient.post('/api/auth/dev/reset-test-user');
          console.log('✅ DEV: Test user reset before login');
        } catch (error) {
          console.log('⚠️ DEV: Could not reset test user before login');
        }
      }
      
      return authService.verifyOTP(phone, otp);
    },
    onSuccess: (data) => {
      console.log('🔑 verifyOTPMutation.onSuccess - user data:', JSON.stringify(data.data.user, null, 2));
      console.log('🔑 profileCompleted:', data.data.user.profileCompleted);
      setIsAuthenticated(true);
      queryClient.setQueryData(['user'], data.data.user);
    },
    onError: (error) => {
      console.error('🔑 verifyOTPMutation.onError:', error);
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      console.log('🔑 logoutMutation.onSuccess - setting isAuthenticated to false');
      setIsAuthenticated(false);
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
    },
  });

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoadingUser: !isInitialized || isLoadingUser,
    requestOTP: requestOTPMutation.mutateAsync,
    isRequestingOTP: requestOTPMutation.isPending,
    verifyOTP: verifyOTPMutation.mutateAsync,
    isVerifyingOTP: verifyOTPMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
