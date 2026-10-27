import type { AxiosRequestConfig } from 'axios';
import { httpClient } from '../client/httpClient';
import { toQueryString, type QueryParamsMap } from '../utils/queryParams';

/**
 * Abstract Base Repository.
 * Encapsulates common HTTP communication logic and query parameter handling.
 * Feature repositories extend this class to communicate with their backend endpoints.
 */
export abstract class BaseRepository {
  protected readonly client = httpClient;

  /**
   * Helper to perform a GET request with optional serialized query parameters.
   */
  protected get<T>(
    url: string,
    params?: QueryParamsMap,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const query = toQueryString(params);
    return this.client.get<T>(`${url}${query}`, config);
  }

  /**
   * Helper to perform a POST request.
   */
  protected post<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.post<T>(url, body, config);
  }

  /**
   * Helper to perform a PUT request.
   */
  protected put<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.put<T>(url, body, config);
  }

  /**
   * Helper to perform a PATCH request.
   */
  protected patch<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.patch<T>(url, body, config);
  }

  /**
   * Helper to perform a DELETE request.
   */
  protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(url, config);
  }
}
