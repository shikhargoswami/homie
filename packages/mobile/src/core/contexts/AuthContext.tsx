import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { apiClient } from '../services/api';
import type { User, AuthResponse, OTPResponse } from '../services/auth.service';

// ============================================================
// 🔧 DEVELOPER TESTING FLAGS
// ============================================================
// Set these to true for testing different scenarios:

// Always start from login screen (clears stored tokens on app load)
const DEV_FORCE_LOGOUT = true;

// Use smart setup: 
// - Seeded users (9876540001, etc.) → Preserve data
// - New users (9999999999, etc.) → Reset to fresh state
const DEV_SMART_SETUP = true;

// Legacy flags (use DEV_SMART_SETUP instead for better behavior)
const DEV_RESET_PROFILE = false;
const DEV_RESET_ALL_DATA = false;
// ============================================================

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
        // 🔧 DEV: Force logout - always start from login screen
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
      
      const response = await authService.verifyOTP(phone, otp);
      
      // 🔧 DEV: Smart setup based on user type
      // - Seeded users (9876540001, etc.) → Preserve data
      // - New users (9999999999, etc.) → Reset to fresh state
      if (DEV_SMART_SETUP) {
        try {
          console.log('🔧 DEV: Running smart setup...');
          const setupResult = await apiClient.post<{ 
            success: boolean; 
            action: string; 
            message: string;
            needsReseed?: boolean;
          }>('/api/auth/dev/smart-setup');
          
          console.log(`✅ DEV: Smart setup result: ${setupResult.action} - ${setupResult.message}`);
          
          // If it's a new user reset, update profileCompleted
          if (setupResult.action === 'new_user_reset') {
            response.data.user.profileCompleted = false;
          }
          // If seeded user, ensure profileCompleted is true
          if (setupResult.action === 'seeded_user_preserved') {
            response.data.user.profileCompleted = true;
          }
        } catch (error) {
          console.log('⚠️ DEV: Smart setup failed:', error);
        }
      }
      
      // 🔧 DEV: Legacy - Reset user profile after login to show onboarding again
      if (DEV_RESET_PROFILE && !DEV_SMART_SETUP) {
        try {
          console.log('🔧 DEV: Resetting user profile for fresh onboarding...');
          await apiClient.post('/api/auth/dev/reset-profile');
          response.data.user.profileCompleted = false;
          console.log('✅ DEV: Profile reset - will show onboarding');
        } catch (error) {
          console.log('⚠️ DEV: Could not reset profile:', error);
        }
      }
      
      // 🔧 DEV: Legacy - Reset all user data (swipes, matches, etc.)
      if (DEV_RESET_ALL_DATA && !DEV_SMART_SETUP) {
        try {
          console.log('🔧 DEV: Resetting all user data...');
          await apiClient.post('/api/auth/dev/reset-all-data');
          console.log('✅ DEV: All data reset complete');
        } catch (error) {
          console.log('⚠️ DEV: Could not reset all data:', error);
        }
      }
      
      return response;
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
