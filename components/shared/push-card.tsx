"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import {
  fetchPushConfig,
  isPushSupported,
  permissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/api/push";

/**
 * Включение уведомлений в браузере.
 *
 * Разрешение запрашивается по клику, а не при загрузке страницы: браузеры
 * наказывают за самовольный вопрос — Chrome сворачивает его, а после
 * нескольких отказов блокирует навсегда. Поэтому сначала карточка объясняет,
 * зачем это, и только потом появляется системное окно.
 */
export function PushCard() {
  const { t } = useT();
  const { isAuthenticated } = useAuth();

  const [supported, setSupported] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    // Ключ и сам факт включённого канала знает только сервер: без ключей VAPID
    // подписаться нельзя, и карточку показывать незачем. Состояние выставляем
    // в ответе, а не в теле эффекта: до ответа карточка всё равно скрыта, а
    // setState прямо в эффекте — это лишний каскад рендеров.
    void fetchPushConfig()
      .then((config) => {
        setSupported(true);
        setPermission(permissionState());
        setPublicKey(config.enabled ? config.publicKey : null);
      })
      .catch(() => setPublicKey(null));
  }, []);

  const enable = async () => {
    if (!publicKey) return;
    setBusy(true);
    try {
      const result = await subscribeToPush(publicKey);
      setPermission(result);
      if (result === "granted") toast.success(t("push.enabled"));
      else if (result === "denied") toast.error(t("push.blocked"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setPermission(permissionState());
      toast.success(t("push.disabled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  // Гостю подписываться некуда: рассылка выбирает адресатов по роли, и
  // подписку без владельца отнести не к кому.
  if (!isAuthenticated || !supported || !publicKey) return null;

  return (
    <Card className="flex flex-col gap-3 border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Bell className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{t("push.title")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {permission === "denied" ? t("push.blockedHint") : t("push.text")}
        </p>
      </div>

      {permission === "granted" ? (
        <Button
          variant="outline"
          className="shrink-0 gap-2"
          onClick={disable}
          disabled={busy}
        >
          <BellOff className="size-4" />
          {t("push.disable")}
        </Button>
      ) : (
        <Button
          className="shrink-0 gap-2"
          onClick={enable}
          disabled={busy || permission === "denied"}
        >
          <Bell className="size-4" />
          {t("push.enable")}
        </Button>
      )}
    </Card>
  );
}
