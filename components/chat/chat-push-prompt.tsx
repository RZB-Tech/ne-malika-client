"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import {
  fetchPushConfig,
  isPushSupported,
  permissionState,
  subscribeToPush,
} from "@/lib/api/push";
import { cn } from "@/lib/utils";

/** Отказ помним, чтобы не спрашивать на каждом заходе. */
const DISMISSED_KEY = "nemalika.chatPushDismissed";

/**
 * Предложение включить уведомления — в переписке, а не в настройках.
 *
 * Здесь у него единственный шанс быть уместным: человек только что написал
 * продавцу и ждёт ответа, и «сообщить, когда ответят» — это ровно то, чего он
 * хочет. Само разрешение браузер спрашивает по нажатию: непрошеный вопрос при
 * загрузке Chrome сворачивает, а после пары отказов запрещает навсегда.
 *
 * Полоса исчезает, когда уведомления включены, запрещены в браузере, не
 * поддерживаются, выключены на сервере или человек её закрыл.
 */
export function ChatPushPrompt({ className }: { className?: string }) {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    void fetchPushConfig()
      .then((config) => {
        setDismissed(false);
        setPermission(permissionState());
        setPublicKey(config.enabled ? config.publicKey : null);
      })
      .catch(() => setPublicKey(null));
  }, []);

  const hidden =
    !isHydrated ||
    !isAuthenticated ||
    dismissed ||
    !publicKey ||
    permission === "granted" ||
    permission === "denied";

  if (hidden) return null;

  const enable = async () => {
    setBusy(true);
    try {
      const result = await subscribeToPush(publicKey, {
        title: t("push.confirmTitle"),
        body: t("push.confirmBody"),
      });
      setPermission(result);
      if (result === "granted") toast.success(t("push.enabled"));
      else if (result === "denied") toast.error(t("push.blocked"));
    } catch {
      toast.error(t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <Bell className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-xs text-muted-foreground sm:text-sm">
        {t("chat.pushPrompt")}
      </p>
      <Button size="sm" onClick={enable} disabled={busy}>
        {busy ? t("common.saving") : t("push.enable")}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={close}
        aria-label={t("common.clear")}
        className="shrink-0 text-muted-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
