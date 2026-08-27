"use client";

import { useMemo } from "react";
import {
  TelegramLoginClient,
  TelegramLoginProvider,
  useTelegramLogin,
  type TelegramUserData,
} from "@telegram-login-ultimate/react";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";

export function TelegramOAuthButton({
  label,
  disabled,
  onAuth,
  onError,
}: {
  label: string;
  disabled?: boolean;
  onAuth: (user: TelegramUserData) => void;
  onError?: (message: string) => void;
}) {
  const client = useMemo(() => new TelegramLoginClient(), []);
  const botId = Number(process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID);

  if (!botId) return null;

  return (
    <TelegramLoginProvider client={client}>
      <OAuthButton
        botId={botId}
        label={label}
        disabled={disabled}
        onAuth={onAuth}
        onError={onError}
      />
    </TelegramLoginProvider>
  );
}

function OAuthButton({
  botId,
  label,
  disabled,
  onAuth,
  onError,
}: {
  botId: number;
  label: string;
  disabled?: boolean;
  onAuth: (user: TelegramUserData) => void;
  onError?: (message: string) => void;
}) {
  const { t } = useT();
  const { start, isPending } = useTelegramLogin({
    botId,
    onSuccess: (data) => onAuth(data),
    onError: (err) => onError?.(apiErrorMessage(err, t, "auth.telegramCancelled")),
  });

  return (
    <Button
      size="lg"
      disabled={disabled || isPending}
      className="h-12 w-full gap-2 text-base"
      onClick={start}
    >
      <TelegramIcon className="size-4" />
      {label}
    </Button>
  );
}
