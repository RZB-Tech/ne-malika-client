"use client";

import { Bell, BellOff } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useNotificationChannels } from "@/lib/api/notify";
import { usePushChannel, useTelegramChannel } from "@/lib/api/use-push-channel";
import { isPushSupported } from "@/lib/api/push";
import { cn } from "@/lib/utils";

export function NotificationsCard({ className }: { className?: string }) {
  const { t } = useT();
  const { isAuthenticated } = useAuth();
  const { data } = useNotificationChannels();
  const push = usePushChannel();
  const telegram = useTelegramChannel();

  const deviceSubscribed = push.deviceSubscribed === true;
  const permission = push.permission;

  const pushConfig = data?.push;
  const telegramConfig = data?.telegram;

  const showPush = isPushSupported() && pushConfig?.available === true;
  const showTelegram = telegramConfig?.available === true;

  if (!isAuthenticated || !data || (!showPush && !showTelegram)) return null;

  const enablePush = () => {
    if (!pushConfig?.publicKey) return;
    void push.enable(pushConfig.publicKey);
  };

  return (
    <Card className={cn("gap-0 divide-y divide-border p-0", className)}>
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Bell className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{t("notify.title")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("notify.text")}</p>
        </div>
      </div>

      {showPush && (
        <ChannelRow
          icon={<Bell className="size-4" />}
          title={t("notify.browser")}
          hint={permission === "denied" ? t("push.blockedHint") : t("notify.browserHint")}
          active={deviceSubscribed}
          activeLabel={t("notify.on")}
        >
          {deviceSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void push.disable()}
              disabled={push.busy}
            >
              <BellOff className="size-4" />
              {t("push.disable")}
            </Button>
          ) : (
            <Button size="sm" onClick={enablePush} disabled={push.busy || permission === "denied"}>
              {t("push.enable")}
            </Button>
          )}
        </ChannelRow>
      )}

      {showTelegram && (
        <ChannelRow
          icon={<TelegramIcon className="size-4" />}
          title={t("notify.telegram")}
          hint={data.telegram.linked ? t("notify.telegramHint") : t("notify.telegramOpenHint")}
          active={data.telegram.enabled}
          activeLabel={t("notify.on")}
        >
          {!data.telegram.linked && data.telegram.url && (
            <Button asChild size="sm" className="gap-2">
              <a href={data.telegram.url} target="_blank" rel="noopener noreferrer">
                <TelegramIcon className="size-4" />
                {t("notify.telegramOpen")}
              </a>
            </Button>
          )}

          {data.telegram.linked && (
            <Button
              variant={data.telegram.enabled ? "outline" : "default"}
              size="sm"
              onClick={() => telegram.toggle(!data.telegram.enabled)}
              disabled={telegram.setTelegram.isPending}
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
    <div className="flex items-start gap-3 p-4">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
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
