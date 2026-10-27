/**
 * Response parsing and extraction utilities.
 */

/**
 * Safely extracts an array from various backend response envelope formats.
 * Handles:
 * - Direct array: `[item, ...]`
 * - Paginated wrapper: `{ data: [item, ...], pagination: {...} }`
 * - Named key wrapper: `{ items: [...] }`, `{ tasks: [...] }`, etc.
 */
export function extractList<T>(response: unknown, fallbackKey?: string): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const obj = response as Record<string, unknown>;

  if (Array.isArray(obj.data)) {
    return obj.data as T[];
  }

  if (fallbackKey && Array.isArray(obj[fallbackKey])) {
    return obj[fallbackKey] as T[];
  }

  return [];
}

/**
 * Safely extracts a single entity from response envelopes.
 * Handles:
 * - Direct entity: `{ id, ... }`
 * - Wrapped: `{ data: { id, ... } }` or `{ [key]: { id, ... } }`
 */
export function extractEntity<T>(response: unknown, entityKey?: string): T {
  if (!response || typeof response !== 'object') {
    return response as T;
  }

  const obj = response as Record<string, unknown>;

  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as T;
  }

  if (entityKey && obj[entityKey] && typeof obj[entityKey] === 'object') {
    return obj[entityKey] as T;
  }

  return response as T;
}
