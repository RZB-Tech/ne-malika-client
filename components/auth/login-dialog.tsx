"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
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

export function LoginDialog({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const router = useRouter();
  const { isTelegramMiniApp, loginWithInitData, loginWithTelegramUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasOAuth = Boolean(process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID);

  const finish = (role?: string) => {
    setOpen(false);
    router.push(role === "admin" ? "/admin" : "/seller");
  };

  const loginMiniApp = async () => {
    const wa = (
      window as unknown as { Telegram?: { WebApp?: { initData?: string } } }
    ).Telegram?.WebApp;
    const initData = wa?.initData;
    if (!initData) {
      toast.error("Не удалось получить данные Telegram");
      return;
    }
    setLoading(true);
    try {
      const res = await loginWithInitData(initData);
      finish(res.user?.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось войти");
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
      toast.error(e instanceof Error ? e.message : "Не удалось войти");
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
          // Inside the Telegram client (mobile or Telegram Desktop).
          <Button
            size="lg"
            disabled={loading}
            className="mt-2 h-12 w-full gap-2 text-base"
            onClick={loginMiniApp}
          >
            <Send className="size-4" />
            {t("auth.telegramLogin")}
          </Button>
        ) : (
          // Plain browser — official Telegram OAuth popup.
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
                Вход через Telegram не настроен (нет NEXT_PUBLIC_TELEGRAM_BOT_ID).
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
