import type { AxiosError } from 'axios';

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface BackendErrorPayload {
  message?: string;
  errors?: FieldValidationError[];
  error?: string;
}

/**
 * Normalized API Error for all HTTP communications in DailyOS.
 * Unifies Express/Zod backend errors, network issues, and HTTP status codes.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: FieldValidationError[];
  public readonly originalError?: unknown;

  constructor(params: {
    message: string;
    status?: number;
    errors?: FieldValidationError[];
    originalError?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status ?? 0;
    this.errors = params.errors ?? [];
    this.originalError = params.originalError;

    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True when the request failed before reaching the server (e.g. offline, DNS failure) */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True when input validation failed on the backend (HTTP 400 with field issues) */
  get isValidationError(): boolean {
    return this.status === 400 && this.errors.length > 0;
  }

  /** True when the request was unauthenticated or session expired (HTTP 401) */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True when the user lacks permission or account is suspended/deleted (HTTP 403) */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True when the requested resource was not found (HTTP 404) */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True on 5xx server-side failures */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** Get error message for a specific validation field */
  getFieldError(fieldName: string): string | undefined {
    return this.errors.find((err) => err.field === fieldName)?.message;
  }

  /**
   * Factory to normalize any Axios or network error into an ApiError.
   */
  static fromAxiosError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const axiosErr = error as AxiosError<BackendErrorPayload>;

    // Network / offline error
    if (!axiosErr.response) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const message = isOffline
        ? 'You are currently offline. Please check your internet connection.'
        : axiosErr.message || 'Unable to connect to the server. Please try again.';
      return new ApiError({
        message,
        status: 0,
        originalError: error,
      });
    }

    const status = axiosErr.response.status;
    const data = axiosErr.response.data;

    let message = data?.message || data?.error || axiosErr.message || 'An unexpected error occurred.';
    let errors: FieldValidationError[] = [];

    if (Array.isArray(data?.errors)) {
      errors = data.errors.map((item) => ({
        field: String(item.field || ''),
        message: String(item.message || ''),
      }));
      // If validation error and no detailed message, use a friendly header
      if (status === 400 && (!message || message === 'Validation failed')) {
        message = 'Please check the entered information and correct the errors below.';
      }
    }

    return new ApiError({
      message,
      status,
      errors,
      originalError: error,
    });
  }
}
