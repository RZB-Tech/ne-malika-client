import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearAuth, getAccessToken, setAccessToken } from "./token-store";

// Origin only — the generated operations already carry the `/api/v1` prefix.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Needed so the httpOnly refresh cookie is sent to /auth/refresh & /auth/logout.
  withCredentials: true,
});

// --- Attach the bearer access token to every outgoing request. ---------------
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Silent refresh on 401 ---------------------------------------------------
// Must match the path the backend scopes the httpOnly refresh cookie to
// (`path: '/api/v1/auth'` in auth.controller.ts) or the cookie is never sent.
const REFRESH_URL = "/api/v1/auth/refresh";

// A single in-flight refresh is shared by all requests that 401 at once.
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
    // Only a rejected refresh token means the session is really over. A network
    // failure or a 5xx must not discard a refresh cookie that is still valid.
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

    return Promise.reject(error);
  },
);

// --- Orval mutator -----------------------------------------------------------
// Orval calls this for every operation. It must return a promise of the
// response body and support cancellation via the returned promise's `.cancel`.
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
