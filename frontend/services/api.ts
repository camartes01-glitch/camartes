/**
 * API service with token refresh interceptor.
 * Automatically refreshes session token when it expires and retries failed requests.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const TOKEN_KEY = 'session_token';
const EXPIRY_KEY = 'token_expires_at';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: Error) => void;
}> = [];

const processQueue = (token: string | null, err?: Error) => {
  failedQueue.forEach((prom) => {
    if (err) prom.reject(err);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/** Check if token should be refreshed (expiring within buffer). */
export async function shouldRefreshToken(): Promise<boolean> {
  const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
  if (!expiry) return true;
  const expiresAt = new Date(expiry).getTime();
  return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
}

/** Refresh the session token. */
export async function refreshToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const res = await axios.post(
      `${API_URL}/api/auth/refresh`,
      null,
      { params: { token } }
    );
    const { access_token, expires_at } = res.data;
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    await AsyncStorage.setItem(EXPIRY_KEY, expires_at);
    return access_token;
  } catch {
    await AsyncStorage.multiRemove([TOKEN_KEY, EXPIRY_KEY]);
    return null;
  }
}

/** Store tokens after login/signup. */
export async function setTokens(accessToken: string, expiresAt: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(EXPIRY_KEY, expiresAt);
}

/** Clear tokens on logout. */
export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, EXPIRY_KEY]);
}

/** Get current token. */
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Request interceptor: add Bearer token and optionally refresh before expiry
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return config;

    if (await shouldRefreshToken()) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => {
          failedQueue.push({
            resolve: () => resolve(),
            reject: () => resolve(),
          });
        });
        token = await AsyncStorage.getItem(TOKEN_KEY);
      } else {
        isRefreshing = true;
        const newToken = await refreshToken();
        isRefreshing = false;
        processQueue(newToken);
        token = newToken;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: on 401, try refresh and retry
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              } else reject(err);
            },
            reject: () => reject(err),
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshToken();
      isRefreshing = false;
      processQueue(newToken);

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(err);
  }
);
