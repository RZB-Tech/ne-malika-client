import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearAuth, getAccessToken, setAccessToken } from "./token-store";
import { defaultLocale, locales, STORAGE_KEY, type Locale } from "@/lib/i18n/config";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers.set("Accept-Language", readLocale());
  return config;
});

let localeCache: string | null = null;

export function setRequestLocale(locale: Locale): void {
  localeCache = locale;
}

function readLocale(): string {
  if (localeCache) return localeCache;
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY);
  const valid = stored && locales.includes(stored as Locale) ? stored : null;
  localeCache = valid ?? defaultLocale;
  return localeCache;
}

const REFRESH_URL = "/api/v1/auth/refresh";

let refreshPromise: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      REFRESH_URL,
      {},
      { baseURL: API_BASE_URL, withCredentials: true },
    );
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      clearAuth();
    }
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/refresh") || url.includes("/auth/telegram");

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshPromise = refreshPromise ?? runRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return axiosInstance(original);
      }
    }

    const body = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const serverMessage = Array.isArray(body?.message)
      ? body.message.join('; ')
      : body?.message;
    if (serverMessage) error.message = serverMessage;

    return Promise.reject(error);
  },
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data as T);

  // @ts-expect-error attach cancel for orval's react-query cancellation.
  promise.cancel = () => source.cancel("Query was cancelled");

  return promise;
};

export default customInstance;

export type ErrorType<E> = AxiosError<E>;
export type BodyType<B> = B;
