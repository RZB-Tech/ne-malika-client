"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import {
  useSetTelegramNotifications,
} from "@/lib/api/notify";
import {
  hasPushSubscription,
  permissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/api/push";

/**
 * Состояние push-канала этого устройства и его включение/выключение.
 *
 * Общее для полосы в переписке и карточки в настройках: раньше логика жила в
 * обоих компонентах копиями и уже разошлась — на одно и то же действие одна
 * поверхность показывала текст ошибки сервера, другая — общее «не получилось».
 *
 * Разрешение читаем при отрисовке, а не храним: это живое состояние браузера,
 * которое человек может поменять в настройках сайта, не трогая нашу вкладку.
 * В состоянии лежит только ответ на наш собственный запрос — им и вызывается
 * перерисовка после отказа.
 */
export function usePushChannel() {
  const { t } = useT();
  const [deviceSubscribed, setDeviceSubscribed] = useState<boolean | null>(null);
  const [requested, setRequested] = useState<NotificationPermission | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hasPushSubscription().then(setDeviceSubscribed);
  }, []);

  const permission = requested ?? permissionState();

  const enable = useCallback(
    async (publicKey: string) => {
      setBusy(true);
      try {
        const result = await subscribeToPush(publicKey, {
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
        return result;
      } catch (err) {
        toast.error(apiErrorMessage(err, t, "push.failed"));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setDeviceSubscribed(false);
      setRequested(null);
      toast.success(t("push.disabled"));
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "push.failed"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  return { deviceSubscribed, permission, busy, enable, disable };
}

/** Включение/выключение Telegram-канала с тостами — общая обёртка мутации. */
export function useTelegramChannel() {
  const { t } = useT();
  const setTelegram = useSetTelegramNotifications();

  const toggle = useCallback(
    (enabled: boolean) => {
      setTelegram.mutate(enabled, {
        onSuccess: () =>
          toast.success(
            enabled ? t("notify.telegramOn") : t("notify.telegramOff"),
          ),
        onError: () => toast.error(t("push.failed")),
      });
    },
    [setTelegram, t],
  );

  return { setTelegram, toggle };
}
