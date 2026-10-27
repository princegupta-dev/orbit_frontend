/**
 * Centralized API environment configuration for DailyOS.
 * Provides unified access to API base URLs, timeouts, and request headers.
 */

const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]);
  }
  return defaultValue;
};

export const API_CONFIG = {
  /**
   * Base URL for all backend HTTP requests.
   * In local development, falls back to Express server at http://localhost:5000/api
   * or a relative /api when using Vite dev proxy.
   */
  baseURL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:5000/api'),

  /** Default timeout in milliseconds for HTTP requests (15 seconds) */
  timeoutMs: Number(getEnvVar('VITE_API_TIMEOUT_MS', '15000')),

  /** Default headers applied to every request */
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  /** Storage keys for token persistence */
  storageKeys: {
    accessToken: 'dailyos_access_token',
    refreshToken: 'dailyos_refresh_token',
    user: 'dailyos_auth_user',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;
