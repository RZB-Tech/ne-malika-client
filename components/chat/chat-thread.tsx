"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Check, CheckDouble, Send } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/providers/i18n-provider";
import { useChatMessages, useSendMessage } from "@/lib/api/chats";
import { formatMessageTime } from "@/lib/format";
import type { ChatDto, ChatMessageDto } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";

/** Столько же принимает бэкенд — обрезать текст молча нельзя. */
const MESSAGE_MAX = 2000;

/**
 * Лента одной переписки и поле ответа.
 *
 * `side` — чьими глазами смотрим: у покупателя справа его собственные реплики,
 * у продавца — свои. Иначе продавец видел бы разговор наизнанку.
 */
export function ChatThread({
  chat,
  side,
  className,
  onBack,
}: {
  chat: ChatDto;
  side: "buyer" | "seller";
  className?: string;
  /** Возврат к списку. Только там, где список рядом не помещается, — на телефоне. */
  onBack?: () => void;
}) {
  const { t, locale } = useT();
  const { data, isPending } = useChatMessages(chat.id);
  const send = useSendMessage(chat.id, side);

  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement | null>(null);

  const messages = data ? [...data.data].reverse() : [];
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [lastId, chat.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || send.isPending) return;
    setText("");
    send.mutate(value, { onError: () => setText(value) });
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-start gap-2 border-b border-border p-3 sm:p-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label={t("chat.backToList")}
            className="-ml-1 shrink-0 md:hidden"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <ChatAvatar chat={chat} side={side} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {side === "seller" ? chat.buyerName : chat.shopName}
          </p>
          {chat.productName && (
            <p className="truncate text-xs text-muted-foreground">
              {chat.productCardId ? (
                <Link
                  href={`/product/${chat.productCardId}`}
                  className="hover:text-primary"
                >
                  {chat.productName}
                </Link>
              ) : (
                <span>{t("chat.productGone", { name: chat.productName })}</span>
              )}
            </p>
          )}
        </div>
      </header>

      <div className="chat-message-background min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {isPending && messages.length === 0 && (
          <>
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
          </>
        )}

        {!isPending && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("chat.emptyThread")}
          </p>
        )}

        {messages.map((message) => (
          <Bubble
            key={message.id}
            message={message}
            own={isOwn(message, side)}
            locale={locale}
            aiLabel={t("chat.aiReply")}
            sentLabel={t("chat.sent")}
            readLabel={t("chat.read")}
          />
        ))}
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MESSAGE_MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder={t("chat.placeholder")}
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none py-2"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || send.isPending}
          aria-label={t("chat.send")}
          title={t("chat.send")}
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}

/** Своё ли это сообщение. Автоответ ИИ — со стороны магазина, не покупателя. */
function isOwn(message: ChatMessageDto, side: "buyer" | "seller"): boolean {
  return side === "buyer" ? message.kind === "buyer" : message.kind !== "buyer";
}

function Bubble({
  message,
  own,
  locale,
  aiLabel,
  sentLabel,
  readLabel,
}: {
  message: ChatMessageDto;
  own: boolean;
  locale: Parameters<typeof formatMessageTime>[1];
  aiLabel: string;
  sentLabel: string;
  readLabel: string;
}) {
  return (
    <div className={cn("flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
          own
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {message.kind === "ai" && (
          <span
            className={cn(
              "mb-1 flex items-center gap-1 text-[11px] font-medium",
              own ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            <Bot className="size-3.5" />
            {aiLabel}
          </span>
        )}

        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        <span
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[11px]",
            own ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatMessageTime(message.createdAt, locale)}
          {own &&
            (message.readAt ? (
              <CheckDouble className="size-3.5" aria-label={readLabel} />
            ) : (
              <Check className="size-3.5 opacity-70" aria-label={sentLabel} />
            ))}
        </span>
      </div>
    </div>
  );
}
