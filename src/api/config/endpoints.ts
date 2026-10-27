/**
 * Centralized API Endpoint Registry.
 *
 * This registry acts as the single source of truth for API endpoint paths.
 * Feature-specific endpoints should be registered under their respective domain namespace
 * as real API contracts are introduced during module integration.
 */

export const ENDPOINTS = {
  // Authentication & session management endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Feature module endpoint namespaces (to be populated during feature integration)
  HABITS: {
    BASE: '/habits',
  },

  TASKS: {
    BASE: '/tasks',
  },

  PLANNING: {
    BASE: '/planning',
  },

  NOTES: {
    BASE: '/notes',
  },

  LEARNING: {
    BASE: '/learning',
  },

  REVIEWS: {
    BASE: '/reviews',
  },

  FINANCE: {
    BASE: '/finance',
  },

  INSIGHTS: {
    BASE: '/insights',
  },

  PROFILE: {
    BASE: '/profile',
  },

  SETTINGS: {
    BASE: '/settings',
  },

  DATA: {
    BASE: '/data',
  },

  NOTIFICATIONS: {
    BASE: '/notifications',
  },

  SYNC: {
    BASE: '/sync',
  },
} as const;

/**
 * Utility to interpolate route parameters into a URL path pattern.
 * Example: `interpolateUrl('/users/:id/items/:itemId', { id: '1', itemId: '2' })` => `'/users/1/items/2'`
 */
export function interpolateUrl(path: string, params: Record<string, string | number>): string {
  let resolved = path;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return resolved;
}
