"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import {
  useNotificationChannels,
  useSetTelegramNotifications,
} from "@/lib/api/notify";
import {
  hasPushSubscription,
  isPushSupported,
  permissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/api/push";
import { cn } from "@/lib/utils";

/**
 * Выбор канала уведомлений: браузер или Telegram.
 *
 * Два канала, а не один, потому что оба дырявые поодиночке. Браузерные
 * уведомления не переживают закрытый ноутбук и не работают на iOS, пока сайт не
 * добавлен на домашний экран; Telegram требует, чтобы человек сам открыл чат с
 * ботом. Вместе они покрывают почти всех, поэтому предлагаем оба и не считаем
 * ни один обязательным.
 *
 * Разрешение браузера спрашиваем только по нажатию: непрошеный вопрос при
 * загрузке Chrome показывает свёрнутым, а после пары отказов запрещает навсегда.
 */
export function NotificationsCard({ className }: { className?: string }) {
  const { t } = useT();
  const { isAuthenticated } = useAuth();
  const { data } = useNotificationChannels();
  const setTelegram = useSetTelegramNotifications();

  /**
   * Подписку проверяем в самом браузере, а не по ответу сервера: сервер знает
   * только, что подписано хоть одно устройство. Человеку за другим компьютером
   * надо предложить включить, а не отрапортовать, что всё уже работает.
   */
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);

  /**
   * Разрешение читаем при отрисовке: это живое состояние браузера, которое
   * человек может поменять в настройках сайта, не трогая нашу вкладку. В
   * состоянии лежит только ответ на наш собственный запрос.
   */
  const [requested, setRequested] = useState<NotificationPermission | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const permission = requested ?? permissionState();

  useEffect(() => {
    void hasPushSubscription().then(setDeviceSubscribed);
  }, []);

  const push = data?.push;
  const telegram = data?.telegram;

  const showPush = isPushSupported() && push?.available === true;
  const showTelegram = telegram?.available === true;

  if (!isAuthenticated || !data || (!showPush && !showTelegram)) return null;

  const enablePush = async () => {
    if (!push?.publicKey) return;
    setBusy(true);
    try {
      const result = await subscribeToPush(push.publicKey, {
        title: t("push.confirmTitle"),
        body: t("push.confirmBody"),
      });
      setRequested(result);
      if (result === "granted") {
        setDeviceSubscribed(true);
        toast.success(t("push.enabled"));
      } else if (result === "denied") {
        toast.error(t("push.blocked"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setDeviceSubscribed(false);
      setRequested(null);
      toast.success(t("push.disabled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const toggleTelegram = (enabled: boolean) => {
    setTelegram.mutate(enabled, {
      onSuccess: () =>
        toast.success(
          enabled ? t("notify.telegramOn") : t("notify.telegramOff"),
        ),
      onError: () => toast.error(t("push.failed")),
    });
  };

  return (
    <Card className={cn("gap-0 divide-y divide-border p-0", className)}>
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Bell className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{t("notify.title")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("notify.text")}
          </p>
        </div>
      </div>

      {showPush && (
        <ChannelRow
          icon={<Bell className="size-4" />}
          title={t("notify.browser")}
          hint={
            permission === "denied"
              ? t("push.blockedHint")
              : t("notify.browserHint")
          }
          active={deviceSubscribed}
          activeLabel={t("notify.on")}
        >
          {deviceSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={disablePush}
              disabled={busy}
            >
              <BellOff className="size-4" />
              {t("push.disable")}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={enablePush}
              disabled={busy || permission === "denied"}
            >
              {t("push.enable")}
            </Button>
          )}
        </ChannelRow>
      )}

      {showTelegram && (
        <ChannelRow
          icon={<TelegramIcon className="size-4" />}
          title={t("notify.telegram")}
          hint={
            data.telegram.linked
              ? t("notify.telegramHint")
              : t("notify.telegramOpenHint")
          }
          active={data.telegram.enabled}
          activeLabel={t("notify.on")}
        >
          {!data.telegram.linked && data.telegram.url && (
            <Button asChild size="sm" className="gap-2">
              <a
                href={data.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TelegramIcon className="size-4" />
                {t("notify.telegramOpen")}
              </a>
            </Button>
          )}

          {data.telegram.linked && (
            <Button
              variant={data.telegram.enabled ? "outline" : "default"}
              size="sm"
              onClick={() => toggleTelegram(!data.telegram.enabled)}
              disabled={setTelegram.isPending}
            >
              {data.telegram.enabled ? t("push.disable") : t("push.enable")}
            </Button>
          )}
        </ChannelRow>
      )}
    </Card>
  );
}

function ChannelRow({
  icon,
  title,
  hint,
  active,
  activeLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  active: boolean;
  activeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="mt-0.5 shrink-0 text-muted-foreground sm:mt-0">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {title}
          {active && (
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
              {activeLabel}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{hint}</p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}
