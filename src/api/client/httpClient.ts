import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/env.config';
import { setupInterceptors } from './interceptors';

/**
 * Creates and configures the core Axios client.
 */
export const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeoutMs,
    headers: { ...API_CONFIG.defaultHeaders },
    withCredentials: true,
  });

  setupInterceptors(instance);
  return instance;
};

export const axiosInstance: AxiosInstance = createHttpClient();

/**
 * Standard typed HTTP client for DailyOS.
 * Automatically unwraps response data and normalizes errors into ApiError.
 */
export const httpClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
};

export type HttpClient = typeof httpClient;
