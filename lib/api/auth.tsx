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
import { DEV_ROLE } from "./dev-fixtures";
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
  /**
   * Перевыпускает токены по refresh-cookie. Нужен там, где роль изменилась на
   * бэкенде: она зашита в access-токен, и без этого «продавец» до конца сессии
   * остаётся покупателем.
   */
  refreshSession: () => Promise<AuthResponseDto | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const refreshSession = useCallback(async () => {
    try {
      const res = await authControllerRefresh();
      setAuth(res.accessToken, res.user);
      return res;
    } catch (err) {
      // Тихий фолбэк оставлен намеренно (гость без refresh-cookie — норма),
      // но причина должна быть видна в консоли: ротация cookie, 500 и т.д.
      console.error("[auth] session refresh failed:", err);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authControllerLogout();
    } finally {
      clearAuth();
    }
  }, []);

  useEffect(() => {
    const wa = (
      window as unknown as {
        Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } };
      }
    ).Telegram?.WebApp;
    wa?.ready?.();
    wa?.expand?.();

    if (getAccessToken()) {
      void refreshSession();
      return;
    }

    if (DEV_ROLE) {
      const devNames = {
        admin: "Локальный админ",
        seller: "Локальный продавец",
        user: "Локальный покупатель",
      };
      setAuth("dev-token", {
        id: 0,
        fullname: devNames[DEV_ROLE],
        role: DEV_ROLE,
        telegramUsername: null,
        telegramPhoto: null,
        phoneNumber: null,
        hasContact: false,
        telegramLinked: false,
      });
      return;
    }

    const initData = readMiniAppInitData();
    if (initData) {
      loginWithInitData(initData).catch((err) => {
        // Пользователь остаётся гостем без всякого сигнала — хотя бы в логах
        // должно быть видно, что вход в Mini App не прошёл.
        console.error("[auth] Mini App initData login failed:", err);
      });
      return;
    }

    authControllerRefresh()
      .then((res) => setAuth(res.accessToken, res.user))
      .catch((err) => {
        console.error("[auth] guest refresh failed:", err);
      });
  }, [loginWithInitData, refreshSession]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(token),
    isSeller: user?.role === "seller",
    isAdmin: user?.role === "admin",
    isHydrated: hydrated,
    isTelegramMiniApp: readMiniAppInitData() !== null,
    loginWithInitData,
    loginWithTelegramUser,
    refreshSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
