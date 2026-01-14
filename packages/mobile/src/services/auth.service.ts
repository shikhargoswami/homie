import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Authentication Service
 * 
 * Handles:
 * - OTP request and verification
 * - Token storage and retrieval
 * - User session management
 * - Logout
 */

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'tenant' | 'landlord' | 'admin';
  profileCompleted: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface OTPResponse {
  success: boolean;
  data: {
    message: string;
    expiresIn: number;
    phone: string;
  };
}

class AuthService {
  /**
   * Request OTP for phone number
   */
  async requestOTP(phone: string): Promise<OTPResponse> {
    return apiClient.post<OTPResponse>('/api/auth/request-otp', { phone });
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    console.log('📱 AuthService.verifyOTP called:', { phone, otp });
    
    const response = await apiClient.post<AuthResponse>('/api/auth/verify-otp', {
      phone,
      otp,
    });

    console.log('📱 AuthService.verifyOTP response:', response);

    // Store tokens and user data
    if (response.success) {
      console.log('📱 Storing auth data...');
      await this.storeAuthData(response.data.user, response.data.tokens);
      console.log('📱 Auth data stored successfully');
    }

    return response;
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(user: User, tokens: AuthTokens): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['user', JSON.stringify(user)],
    ]);
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('accessToken');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Only call logout API if we have a token
      const token = await this.getAccessToken();
      if (token) {
        // Call logout endpoint (blacklist token)
        await apiClient.post('/api/auth/logout');
      }
    } catch (error) {
      // Silently ignore logout API errors - the important part is clearing local storage
      console.log('Logout API call skipped or failed (this is okay):', error);
    } finally {
      // Clear local storage regardless of API call result
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  }

  /**
   * Get current user profile from API
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>(
      '/api/auth/me'
    );
    
    // Update stored user data
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data.user;
  }
}

// Singleton instance
export const authService = new AuthService();
