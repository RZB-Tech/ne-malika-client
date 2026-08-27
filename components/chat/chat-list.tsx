"use client";

import { MessageSquare } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPanel } from "@/components/shared/status-panel";
import { useT } from "@/components/providers/i18n-provider";
import { formatMessageTime } from "@/lib/format";
import type { ChatDto } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";

export function ChatList({
  chats,
  side,
  activeId,
  onSelect,
  isLoading,
  className,
}: {
  chats: ChatDto[];
  side: "buyer" | "seller";
  activeId: number | null;
  onSelect: (chat: ChatDto) => void;
  isLoading?: boolean;
  className?: string;
}) {
  const { t, locale } = useT();

  if (isLoading && chats.length === 0) {
    return (
      <div className={cn("space-y-2 p-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <StatusPanel
        compact
        className={cn("border-0 bg-transparent", className)}
        icon={<MessageSquare className="size-5" />}
        title={t("chat.empty")}
        description={side === "seller" ? t("chat.emptySeller") : t("chat.emptyBuyer")}
      />
    );
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {chats.map((chat) => (
        <li key={chat.id}>
          <button
            type="button"
            onClick={() => onSelect(chat)}
            className={cn(
              "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none",
              chat.id === activeId && "bg-muted",
            )}
          >
            <ChatAvatar chat={chat} side={side} />

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {side === "seller" ? chat.buyerName : chat.shopName}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatMessageTime(chat.lastMessageAt, locale)}
                </span>
              </span>

              <span className="mt-0.5 flex items-center gap-2">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs",
                    chat.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {chat.lastMessageText ?? chat.productName ?? ""}
                </span>
                {chat.unread > 0 && (
                  <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular">
                    {chat.unread > 99 ? "99+" : chat.unread}
                  </span>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
