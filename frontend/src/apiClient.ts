import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// In development, use relative URL to leverage Vite proxy
// In production, use the full URL or environment variable
const isDev = import.meta.env.MODE === 'development';
const API_URL = isDev ? '/api' : import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Request interceptor for auth and logging
apiClient.interceptors.request.use(
  (config) => {
    // Only add auth header for non-authentication endpoints
    if (!config.url?.includes('token') && !config.url?.includes('login')) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('[API] Response error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] No response received:', error.request);
    } else {
      // Error setting up the request
      console.error('[API] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export { apiClient as api };

export interface ApiError extends Error {
  response?: {
    status: number;
    data: any;
    headers: any;
  };
  request?: any;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'response' in error;
}
