"use client";

import { Bell } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramLinkCard({
  variant = "admin",
}: {
  variant?: "admin" | "seller";
}) {
  const { t } = useT();
  const { user } = useAuth();

  if (!user || user.telegramLinked) return null;

  return (
    <Card className="flex flex-col gap-3 border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Bell className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{t("admin.telegramLink.title")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t(
            variant === "seller"
              ? "admin.telegramLink.textSeller"
              : "admin.telegramLink.text",
          )}
        </p>
      </div>

      {BOT_USERNAME ? (
        <Button asChild className="shrink-0 gap-2">
          <a
            href={`https://t.me/${BOT_USERNAME}?start=notifications`}
            target="_blank"
            rel="noreferrer"
          >
            <TelegramIcon className="size-4" />
            {t("admin.telegramLink.button")}
          </a>
        </Button>
      ) : (
        <p className="shrink-0 text-xs text-destructive">
          {t("admin.telegramLink.notConfigured")}
        </p>
      )}
    </Card>
  );
}
