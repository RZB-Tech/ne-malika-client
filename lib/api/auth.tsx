"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  authControllerLogout,
  authControllerRefresh,
  authControllerTelegramAuth,
  authControllerWidgetAuth,
} from "./generated/endpoints/auth/auth";
import type { AuthResponseDto, TelegramWidgetDto } from "./generated/schemas";
import {
  clearAuth,
  getAccessToken,
  getCurrentUser,
  setAuth,
  subscribe,
} from "./token-store";

/** Ответ Telegram Login Widget — подпись проверяет бэкенд, токен бота живёт только там. */
export type TelegramUser = TelegramWidgetDto;

interface AuthContextValue {
  user: ReturnType<typeof getCurrentUser>;
  isAuthenticated: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  /**
   * False during SSR and the first client render, true after mount. Auth state
   * comes from localStorage, which is unavailable on the server — gate any
   * auth-dependent UI on this to avoid a logged-out → logged-in flash.
   */
  isHydrated: boolean;
  /** True while running inside the Telegram client (Mini App). */
  isTelegramMiniApp: boolean;
  loginWithInitData: (initData: string) => Promise<AuthResponseDto>;
  /** Браузерный вход через официальный Login Widget. */
  loginWithTelegramUser: (user: TelegramUser) => Promise<AuthResponseDto>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Флаг гидратации не зависит от внешнего стора, подписка не нужна.
const subscribeNoop = () => () => {};

function readMiniAppInitData(): string | null {
  if (typeof window === "undefined") return null;
  const wa = (
    window as unknown as { Telegram?: { WebApp?: { initData?: string } } }
  ).Telegram?.WebApp;
  return wa?.initData && wa.initData.length > 0 ? wa.initData : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getCurrentUser, () => null);
  const token = useSyncExternalStore(subscribe, getAccessToken, () => null);
  // Серверный снапшот — false, клиентский — true, поэтому значение
  // становится true сразу после гидратации, без setState в эффекте.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const loginWithInitData = useCallback(async (initData: string) => {
    const res = await authControllerTelegramAuth({ initData });
    setAuth(res.accessToken, res.user);
    return res;
  }, []);

  const loginWithTelegramUser = useCallback(async (tgUser: TelegramUser) => {
    const res = await authControllerWidgetAuth(tgUser);
    setAuth(res.accessToken, res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authControllerLogout();
    } finally {
      clearAuth();
    }
  }, []);

  // On mount: init the Telegram client, then restore/establish a session.
  useEffect(() => {
    const wa = (
      window as unknown as {
        Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } };
      }
    ).Telegram?.WebApp;
    wa?.ready?.();
    wa?.expand?.();

    if (getAccessToken()) return;

    // Inside Telegram — auto-authenticate with the injected initData.
    const initData = readMiniAppInitData();
    if (initData) {
      loginWithInitData(initData).catch(() => {
        /* stay logged out on failure */
      });
      return;
    }

    // Plain browser — try a silent refresh from the cookie.
    authControllerRefresh()
      .then((res) => setAuth(res.accessToken, res.user))
      .catch(() => {
        /* no active session */
      });
  }, [loginWithInitData]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(token),
    isSeller: user?.role === "seller",
    isAdmin: user?.role === "admin",
    isHydrated: hydrated,
    isTelegramMiniApp: readMiniAppInitData() !== null,
    loginWithInitData,
    loginWithTelegramUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
