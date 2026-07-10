"use client";

import { useMemo } from "react";
import {
  TelegramLoginClient,
  TelegramLoginProvider,
  useTelegramLogin,
  type TelegramUserData,
} from "@telegram-login-ultimate/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Browser Telegram sign-in via the official OAuth popup (oauth.telegram.org),
 * using @telegram-login-ultimate/react. Requires:
 *   - NEXT_PUBLIC_TELEGRAM_BOT_ID (numeric bot id)
 *   - the site domain registered in @BotFather via /setdomain
 * The popup does not work on localhost — Telegram checks the origin domain.
 * Returns null when the bot id is not configured.
 */
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
  const { start, isPending } = useTelegramLogin({
    botId,
    onSuccess: (data) => onAuth(data),
    onError: (err) =>
      onError?.(err instanceof Error ? err.message : "Вход через Telegram отменён"),
  });

  return (
    <Button
      size="lg"
      disabled={disabled || isPending}
      className="h-12 w-full gap-2 text-base"
      onClick={start}
    >
      <Send className="size-4" />
      {label}
    </Button>
  );
}
