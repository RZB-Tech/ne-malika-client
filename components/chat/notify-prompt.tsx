"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, X } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import {
  useNotificationChannels,
  useSetTelegramNotifications,
} from "@/lib/api/notify";
import { isPushSupported, permissionState, subscribeToPush } from "@/lib/api/push";
import { cn } from "@/lib/utils";

/**
 * Отказ помним, чтобы не спрашивать на каждом заходе.
 *
 * Ключ отличается от прежнего `chatPushDismissed` намеренно: раньше полоса
 * предлагала только браузерные уведомления, и закрывший её мог отказываться
 * именно от них. Предложение изменилось — Telegram работает и на закрытом
 * ноутбуке, и на iPhone, — поэтому оно вправе прозвучать один раз заново.
 */
const DISMISSED_KEY = "nemalika.notifyDismissed";

/**
 * На сервере считаем полосу закрытой: разметки для неё там всё равно нет, зато
 * первый клиентский проход совпадёт с серверным и гидратация не разъедется.
 */
function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DISMISSED_KEY) !== null;
}

/**
 * Предложение включить уведомления — в переписке, а не в настройках.
 *
 * Здесь у него единственный шанс быть уместным: человек только что написал
 * продавцу и ждёт ответа, и «сообщим, когда ответят» — это ровно то, чего он
 * хочет. Само разрешение браузер спрашивает по нажатию: непрошеный вопрос при
 * загрузке Chrome сворачивает, а после пары отказов запрещает навсегда.
 *
 * Полоса исчезает, когда уведомления уже приходят хоть куда-нибудь, когда оба
 * канала недоступны или когда её закрыли.
 */
export function NotifyPrompt({ className }: { className?: string }) {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();
  const { data } = useNotificationChannels();
  const setTelegram = useSetTelegramNotifications();

  /**
   * Разрешение читаем при отрисовке, а не храним: это живое состояние браузера,
   * которое человек может поменять в настройках сайта, не трогая нашу вкладку.
   * В состоянии лежит только ответ на наш собственный запрос — им и вызывается
   * перерисовка после отказа.
   */
  const [requested, setRequested] = useState<NotificationPermission | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(isDismissed);
  const [busy, setBusy] = useState(false);

  const permission = requested ?? permissionState();

  const canPush =
    isPushSupported() &&
    data?.push.available === true &&
    data.push.publicKey !== null &&
    permission !== "denied";

  const canTelegram =
    data?.telegram.available === true && data.telegram.enabled === false;

  const alreadyOn =
    data?.push.subscribed === true || data?.telegram.enabled === true;

  const hidden =
    !isHydrated ||
    !isAuthenticated ||
    !data ||
    dismissed ||
    alreadyOn ||
    (!canPush && !canTelegram);

  if (hidden) return null;

  const enablePush = async () => {
    if (!data.push.publicKey) return;
    setBusy(true);
    try {
      const result = await subscribeToPush(data.push.publicKey, {
        title: t("push.confirmTitle"),
        body: t("push.confirmBody"),
      });
      setRequested(result);
      if (result === "granted") toast.success(t("push.enabled"));
      else if (result === "denied") toast.error(t("push.blocked"));
    } catch {
      toast.error(t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const enableTelegram = () => {
    setTelegram.mutate(true, {
      onSuccess: () => toast.success(t("notify.telegramOn")),
      onError: () => toast.error(t("push.failed")),
    });
  };

  const close = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl bg-primary/5 px-3 py-2.5",
        className,
      )}
    >
      <Bell className="mt-0.5 size-4 shrink-0 text-primary" />

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t("chat.pushPrompt")}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {canPush && (
            <Button size="sm" onClick={enablePush} disabled={busy}>
              {busy ? t("common.saving") : t("notify.browser")}
            </Button>
          )}

          {canTelegram &&
            (data.telegram.linked ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={enableTelegram}
                disabled={setTelegram.isPending}
              >
                <TelegramIcon className="size-4" />
                {t("notify.telegram")}
              </Button>
            ) : (
              data.telegram.url && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={data.telegram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TelegramIcon className="size-4" />
                    {t("notify.telegram")}
                  </a>
                </Button>
              )
            ))}
        </div>
      </div>

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
