"use client";

import { useState } from "react";
import { Bell, X } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useNotificationChannels } from "@/lib/api/notify";
import { usePushChannel, useTelegramChannel } from "@/lib/api/use-push-channel";
import { isPushSupported } from "@/lib/api/push";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "nemalika.notifyDismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DISMISSED_KEY) !== null;
}

export function NotifyPrompt({ className }: { className?: string }) {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();
  const { data } = useNotificationChannels();
  const push = usePushChannel();
  const telegram = useTelegramChannel();

  const [dismissed, setDismissed] = useState(isDismissed);

  const permission = push.permission;

  const canPush =
    isPushSupported() &&
    data?.push.available === true &&
    data.push.publicKey !== null &&
    permission !== "denied";

  const canTelegram = data?.telegram.available === true && data.telegram.enabled === false;

  const alreadyOn = push.deviceSubscribed === true || data?.telegram.enabled === true;

  const hidden =
    !isHydrated ||
    !isAuthenticated ||
    !data ||
    push.deviceSubscribed === null ||
    dismissed ||
    alreadyOn ||
    (!canPush && !canTelegram);

  if (hidden) return null;

  const enablePush = () => {
    if (!data.push.publicKey) return;
    void push.enable(data.push.publicKey);
  };

  const close = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-xl bg-primary/5 px-3 py-2.5", className)}>
      <Bell className="mt-0.5 size-4 shrink-0 text-primary" />

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground sm:text-sm">{t("chat.pushPrompt")}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {canPush && (
            <Button size="sm" onClick={enablePush} disabled={push.busy}>
              {push.busy ? t("common.saving") : t("notify.browser")}
            </Button>
          )}

          {canTelegram &&
            (data.telegram.linked ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => telegram.toggle(true)}
                disabled={telegram.setTelegram.isPending}
              >
                <TelegramIcon className="size-4" />
                {t("notify.telegram")}
              </Button>
            ) : (
              data.telegram.url && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={data.telegram.url} target="_blank" rel="noopener noreferrer">
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
        aria-label={t("common.close")}
        className="shrink-0 text-muted-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
