"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth, type TelegramUser } from "@/lib/api/auth";
import { TelegramOAuthButton } from "@/components/auth/telegram-oauth-button";

export function LoginDialog({
  children,
  redirectTo,
}: {
  children: React.ReactNode;
  redirectTo?: string | null;
}) {
  const { t } = useT();
  const router = useRouter();
  const { isTelegramMiniApp, loginWithInitData, loginWithTelegramUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasOAuth = Boolean(process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID);

  const finish = (role?: string) => {
    setOpen(false);
    if (redirectTo === null) return;
    router.push(redirectTo ?? (role === "admin" ? "/admin" : "/seller"));
  };

  const loginMiniApp = async () => {
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram
      ?.WebApp;
    const initData = wa?.initData;
    if (!initData) {
      toast.error(t("auth.telegramDataFailed"));
      return;
    }
    setLoading(true);
    try {
      const res = await loginWithInitData(initData);
      finish(res.user?.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onWidgetAuth = async (tgUser: TelegramUser) => {
    setLoading(true);
    try {
      const res = await loginWithTelegramUser(tgUser);
      finish(res.user?.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.loginTitle")}</DialogTitle>
          <DialogDescription>{t("auth.telegramSubtitle")}</DialogDescription>
        </DialogHeader>

        {isTelegramMiniApp ? (
          <Button
            size="lg"
            disabled={loading}
            className="mt-2 h-12 w-full gap-2 text-base"
            onClick={loginMiniApp}
          >
            <TelegramIcon className="size-4" />
            {t("auth.telegramLogin")}
          </Button>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3">
            {hasOAuth ? (
              <TelegramOAuthButton
                label={t("auth.telegramLogin")}
                disabled={loading}
                onAuth={onWidgetAuth}
                onError={(m) => toast.error(m)}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.telegramNotConfigured")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
