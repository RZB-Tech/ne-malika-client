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
} from "./generated/endpoints/auth/auth";
import type { AuthResponseDto } from "./generated/schemas";
import {
  clearAuth,
  getAccessToken,
  getCurrentUser,
  setAuth,
  subscribe,
} from "./token-store";

/** Shape shared by Telegram Mini App `user` and the Login Widget callback. */
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

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
  /** Browser (Login Widget) flow — signs initData client-side. */
  loginWithTelegramUser: (user: TelegramUser) => Promise<AuthResponseDto>;
  devLogin: (opts?: { id?: number; firstName?: string }) => Promise<void>;
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

  const loginWithTelegramUser = useCallback(
    async (tgUser: TelegramUser) => {
      const initData = await buildInitData(tgUser);
      return loginWithInitData(initData);
    },
    [loginWithInitData],
  );

  const devLogin = useCallback(
    async (opts?: { id?: number; firstName?: string }) => {
      await loginWithTelegramUser({
        id: opts?.id ?? 123456789,
        first_name: opts?.firstName ?? "Local",
        username: "local_seller",
        language_code: "ru",
      });
    },
    [loginWithTelegramUser],
  );

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
      .then((res) => {
        const data = res as unknown as AuthResponseDto;
        if (data?.accessToken) setAuth(data.accessToken, data.user ?? null);
      })
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
    devLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// --- Client-side initData signing --------------------------------------------
// The backend only validates Telegram Mini App `initData` (WebAppData HMAC).
// For the browser (Login Widget / dev) flow we forge an equivalent initData
// signed with NEXT_PUBLIC_TELEGRAM_BOT_TOKEN.
//
// SECURITY: this exposes the bot token to the browser, so a client can forge
// any identity. Acceptable for local/demo only. The production-safe fix is to
// validate the Login Widget payload on the backend instead.
async function buildInitData(user: TelegramUser): Promise<string> {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error(
      "Вход через Telegram в браузере недоступен: не задан NEXT_PUBLIC_TELEGRAM_BOT_TOKEN",
    );
  }

  const authDate = Math.floor(Date.now() / 1000).toString();
  const pairs = [
    `auth_date=${authDate}`,
    `user=${JSON.stringify(user)}`,
  ].sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = await hmacSha256(
    new TextEncoder().encode("WebAppData"),
    botToken,
  );
  const hash = toHex(await hmacSha256(secretKey, dataCheckString));

  return `${pairs.join("&")}&hash=${hash}`;
}

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  message: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
