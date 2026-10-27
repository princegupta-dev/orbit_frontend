/**
 * Utility for formatting and serializing query parameters for API requests.
 */

export type QueryValue = string | number | boolean | Date | null | undefined | QueryValue[];

export type QueryParamsMap = Record<string, QueryValue>;

/**
 * Normalizes a query parameters dictionary by stripping out undefined/null/empty values
 * and formatting booleans, numbers, arrays, and dates cleanly.
 */
export function cleanQueryParams(params?: QueryParamsMap): Record<string, string> {
  if (!params) return {};

  const cleaned: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (rawValue instanceof Date) {
      cleaned[key] = rawValue.toISOString();
    } else if (Array.isArray(rawValue)) {
      const filtered = rawValue.filter((item) => item !== undefined && item !== null && item !== '');
      if (filtered.length > 0) {
        cleaned[key] = filtered.map(String).join(',');
      }
    } else {
      cleaned[key] = String(rawValue);
    }
  }

  return cleaned;
}

/**
 * Builds a URL search string (e.g. "?page=1&status=active").
 */
export function toQueryString(params?: QueryParamsMap): string {
  const cleaned = cleanQueryParams(params);
  const searchParams = new URLSearchParams(cleaned);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
