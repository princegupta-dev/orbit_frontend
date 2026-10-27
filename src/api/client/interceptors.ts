import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_CONFIG } from '../config/env.config';
import { ENDPOINTS } from '../config/endpoints';
import { ApiError } from './apiError';
import { tokenManager } from './tokenManager';

// Extend AxiosRequestConfig to track retried requests
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuth?: boolean;
  }
}

interface QueuedPromise {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedPromise[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Resolves the client's current IANA time zone (e.g., 'Asia/Kolkata').
 */
export const getClientTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Attaches request and response interceptors to an Axios client instance.
 */
export function setupInterceptors(client: AxiosInstance): void {
  // 1. REQUEST INTERCEPTOR
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Set default headers if missing
      config.headers = config.headers || {};

      // Attach client timezone for backend day-boundary computations
      if (!config.headers['x-timezone'] && !config.headers['X-Timezone']) {
        config.headers['x-timezone'] = getClientTimeZone();
      }

      // Attach JWT access token unless explicitly skipped
      if (!config.skipAuth) {
        const token = tokenManager.getAccessToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(ApiError.fromAxiosError(error));
    }
  );

  // 2. RESPONSE INTERCEPTOR
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

      if (!originalRequest) {
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      const status = error.response?.status;
      const url = originalRequest.url || '';

      // Skip refresh handling for auth endpoints themselves to avoid infinite loops
      const isAuthEndpoint =
        url.includes(ENDPOINTS.AUTH.LOGIN) ||
        url.includes(ENDPOINTS.AUTH.REGISTER) ||
        url.includes(ENDPOINTS.AUTH.REFRESH_TOKEN);

      if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        const refreshToken = tokenManager.getRefreshToken();

        // If no refresh token exists, user must re-authenticate
        if (!refreshToken) {
          tokenManager.clearTokens();
          return Promise.reject(ApiError.fromAxiosError(error));
        }

        // If another request is currently refreshing the token, enqueue this one
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(ApiError.fromAxiosError(err)));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Perform refresh using an unintercepted standalone Axios call
          const response = await axios.post<{
            accessToken: string;
            refreshToken?: string;
          }>(
            `${API_CONFIG.baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          if (!accessToken) {
            throw new Error('Refresh token did not return an access token.');
          }

          tokenManager.setTokens({
            accessToken,
            refreshToken: newRefreshToken || refreshToken,
          });

          // Unblock queued requests
          processQueue(null, accessToken);

          // Update header and replay original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenManager.clearTokens();
          return Promise.reject(ApiError.fromAxiosError(refreshError));
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(ApiError.fromAxiosError(error));
    }
  );
}
