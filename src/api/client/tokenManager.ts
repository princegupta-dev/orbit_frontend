import { API_CONFIG } from '../config/env.config';

export interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
}

type AuthStateListener = (isAuthenticated: boolean) => void;

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private listeners = new Set<AuthStateListener>();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      this.accessToken = localStorage.getItem(API_CONFIG.storageKeys.accessToken);
      this.refreshToken = localStorage.getItem(API_CONFIG.storageKeys.refreshToken);
    } catch {
      // LocalStorage access may fail in private browsing mode
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined' && window.localStorage) {
      try {
        this.accessToken = localStorage.getItem(API_CONFIG.storageKeys.accessToken);
      } catch {
        // Fallback
      }
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined' && window.localStorage) {
      try {
        this.refreshToken = localStorage.getItem(API_CONFIG.storageKeys.refreshToken);
      } catch {
        // Fallback
      }
    }
    return this.refreshToken;
  }

  setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    this.accessToken = tokens.accessToken;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(API_CONFIG.storageKeys.accessToken, tokens.accessToken);
      } catch {
        // Fallback
      }
    }

    if (tokens.refreshToken !== undefined) {
      this.refreshToken = tokens.refreshToken;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          if (tokens.refreshToken) {
            localStorage.setItem(API_CONFIG.storageKeys.refreshToken, tokens.refreshToken);
          } else {
            localStorage.removeItem(API_CONFIG.storageKeys.refreshToken);
          }
        } catch {
          // Fallback
        }
      }
    }

    this.notifyListeners(true);
  }

  clearTokens(): void {
    const hadTokens = Boolean(this.accessToken || this.refreshToken);
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(API_CONFIG.storageKeys.accessToken);
        localStorage.removeItem(API_CONFIG.storageKeys.refreshToken);
        localStorage.removeItem(API_CONFIG.storageKeys.user);
      } catch {
        // Fallback
      }
    }

    if (hadTokens) {
      this.notifyListeners(false);
    }
  }

  hasTokens(): boolean {
    return Boolean(this.getAccessToken());
  }

  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(isAuthenticated: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(isAuthenticated);
      } catch (err) {
        console.error('Error in tokenManager subscriber:', err);
      }
    }
  }
}

export const tokenManager = new TokenManager();
