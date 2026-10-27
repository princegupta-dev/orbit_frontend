/**
 * Generic reusable API TypeScript models and primitives.
 * Contains no feature-specific or assumed schema definitions.
 */

/** Standard pagination metadata returned by paginated endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Generic envelope for paginated list responses */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/** Common query parameters for pagination */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Common query parameters for sorting */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Common query parameters for date-range filtering */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/** Generic search query parameters */
export interface SearchParams {
  search?: string;
  q?: string;
}

/** Generic field-level validation issue */
export interface FieldError {
  field: string;
  message: string;
}

/** Generic error payload format from HTTP APIs */
export interface ApiErrorPayload {
  message?: string;
  errors?: FieldError[];
  code?: string;
}

/** Generic simple operation result with status/message */
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
}
