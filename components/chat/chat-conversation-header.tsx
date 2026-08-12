"use client";

import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import type { ChatDto } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";

/** One compact header shared by the drawer, sheet and full messages page. */
export function ChatConversationHeader({
  chat,
  side,
  onBack,
  onNavigate,
  backButtonClassName,
  className,
}: {
  chat: ChatDto;
  side: "buyer" | "seller";
  onBack?: () => void;
  onNavigate?: () => void;
  backButtonClassName?: string;
  className?: string;
}) {
  const { t } = useT();
  const participantName = side === "seller" ? chat.buyerName : chat.shopName;
  const lastMessage = chat.lastMessageText?.trim();
  const hasSubtitle = Boolean(lastMessage || chat.productName);

  return (
    <header
      className={cn(
        "flex min-h-16 shrink-0 items-center gap-2 border-b border-border px-3 py-2.5",
        className,
      )}
    >
      {onBack && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label={t("chat.backToList")}
          className={cn("-ml-1 shrink-0", backButtonClassName)}
        >
          <ArrowLeft />
        </Button>
      )}

      <ChatAvatar chat={chat} side={side} className="size-10" />

      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{participantName}</p>
        {hasSubtitle && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {lastMessage && <span>{lastMessage}</span>}
            {lastMessage && chat.productName && (
              <span aria-hidden="true"> — </span>
            )}
            {chat.productCardId ? (
              <Link
                href={`/product/${chat.productCardId}`}
                className="hover:text-primary"
                onClick={onNavigate}
              >
                {chat.productName ?? ""}
              </Link>
            ) : chat.productName ? (
              <span>{t("chat.productGone", { name: chat.productName })}</span>
            ) : null}
          </p>
        )}
      </div>
    </header>
  );
}
