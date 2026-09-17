import axios, {
  CanceledError as AxiosCanceledError,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearAuth, getAccessToken, getSessionVersion, setAuth } from "./token-store";
import type { AuthResponseDto } from "./generated/schemas";
import { defaultLocale, locales, STORAGE_KEY, type Locale } from "@/lib/i18n/config";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

type SessionRequestConfig = InternalAxiosRequestConfig & {
  _sessionVersion?: number;
  _retried?: boolean;
};

function assertSession(session: number | undefined): asserts session {
  if (session !== undefined && session !== getSessionVersion()) {
    throw new AxiosCanceledError("Session changed");
  }
}

axiosInstance.interceptors.request.use((config: SessionRequestConfig) => {
  config._sessionVersion ??= getSessionVersion();
  assertSession(config._sessionVersion);
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers.set("Accept-Language", readLocale());
  return config;
}, undefined, { synchronous: true });

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

let refreshOperation: { session: number; promise: Promise<AuthResponseDto | null> } | null = null;

export function refreshAuthSession(): Promise<AuthResponseDto | null> {
  const session = getSessionVersion();
  if (!refreshOperation || refreshOperation.session !== session) {
    const operation = {
      session,
      promise: runRefresh(session).finally(() => {
        if (refreshOperation === operation) refreshOperation = null;
      }),
    };
    refreshOperation = operation;
  }
  return refreshOperation.promise;
}

async function runRefresh(session: number): Promise<AuthResponseDto | null> {
  const previousToken = getAccessToken();
  try {
    const { data } = await axios.post<AuthResponseDto>(
      REFRESH_URL,
      {},
      { baseURL: API_BASE_URL, withCredentials: true, timeout: 10_000 },
    );
    if (getSessionVersion() !== session || getAccessToken() !== previousToken) return null;
    setAuth(data.accessToken, data.user);
    return data;
  } catch (err) {
    if (
      getSessionVersion() === session &&
      getAccessToken() === previousToken &&
      axios.isAxiosError(err) &&
      err.response?.status === 401
    ) {
      clearAuth();
    }
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => {
    assertSession((response.config as SessionRequestConfig)._sessionVersion);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as SessionRequestConfig | undefined;
    assertSession(original?._sessionVersion);

    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/");

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      const newToken = (await refreshAuthSession())?.accessToken;
      assertSession(original._sessionVersion);

      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return axiosInstance(original);
      }
    }

    const body = error.response?.data as { message?: string | string[] } | undefined;
    const serverMessage = Array.isArray(body?.message) ? body.message.join("; ") : body?.message;
    if (serverMessage) error.message = serverMessage;

    return Promise.reject(error);
  },
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const request: AxiosRequestConfig & { _sessionVersion: number } = {
    ...config,
    ...options,
    _sessionVersion: getSessionVersion(),
    cancelToken: source.token,
  };
  const promise = axiosInstance(request).then(({ data }) => {
    assertSession(request._sessionVersion);
    return data as T;
  });

  // @ts-expect-error attach cancel for orval's react-query cancellation.
  promise.cancel = () => source.cancel("Query was cancelled");

  return promise;
};

export default customInstance;

export type ErrorType<E> = AxiosError<E>;
export type BodyType<B> = B;
