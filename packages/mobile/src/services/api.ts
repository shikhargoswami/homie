import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

/**
 * API Client with automatic token management
 */

// Use environment variable or fallback
const API_BASE_URL = ENV_API_BASE_URL || 'http://192.168.29.142:3000';
const API_TIMEOUT = 30000;

console.log('🌐 API Base URL:', API_BASE_URL); // Debug log

class APIClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`); // Debug log
        
        const token = await AsyncStorage.getItem('accessToken');
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError) => {
        console.error('❌ Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            await AsyncStorage.setItem('accessToken', accessToken);

            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch(url, data);
    return response.data;
  }
}

export const apiClient = new APIClient();
